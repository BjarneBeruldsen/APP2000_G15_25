//Author: Bjarne Beruldsen

const express = require('express');
const { ObjectId } = require('mongodb');
const { kobleTilDB, getDb } = require('../db'); 
const { sjekkBrukerAktiv, beskyttetRute } = require('./brukerhandtering/funksjoner');
const { MongoClient } = require('mongodb');
const db = require('../db');
const klubbRouter = express.Router();
const { lagKlubbValidering } = require("./brukerhandtering/validering");
const { validationResult } = require("express-validator");
const multer = require('multer');
const path = require('path');
let io;

function setSocketIO(socketIOInstance) {
    io = socketIOInstance;
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../filer'));
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
const upload = multer({ storage });

// Route for file uploads
klubbRouter.post('/upload', upload.single('pdf'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Ingen fil ble lastet opp' });
    }
    res.status(200).json({ filePath: req.file.filename });
});

//Klubbhåndterings ruter 
klubbRouter.get('/klubber', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    let klubber = []
    db.collection('Klubb')
    .find()
    .forEach(klubb => klubber.push(klubb))
    .then(() => {
        res.status(200).json(klubber)
    })
    .catch(() => {
        res.status(500).json({error: 'Feil ved henting av klubber'})
    })
})

klubbRouter.get('/klubber/:id', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'})
    }
    else {
        db.collection('Klubb')
        .findOne({_id: new ObjectId(req.params.id)})
        .then(doc => {
            res.status(200).json(doc)
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved henting av klubb'})
        })
    }
})

klubbRouter.post('/klubber', lagKlubbValidering, (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    const klubb = req.body;
    const error = validationResult(req);
    if (!error.isEmpty()) { //Henter validering
        return res.status(400).json({ error: error.array()[0].msg });
    }
    db.collection('Klubb')
    .insertOne(klubb)
    .then(result => {
        if (io) io.emit('klubbOppdatert', { type: 'ny', data: klubb });
        res.status(201).json(result);
    })
    .catch(err => {
        res.status(500).json({error: 'Feil ved lagring av klubb'});
    });
})

klubbRouter.delete('/klubber/:id', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    }
    else {
        db.collection('Klubb')
        .deleteOne({_id: new ObjectId(req.params.id)})
        .then(result => {
            if (io) io.emit('klubbOppdatert', { type: 'slettet', id: req.params.id });
            res.status(200).json(result);
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved sletting av klubb'});
        });
    }
})

klubbRouter.patch('/klubber/:id', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    const oppdatering = req.body
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'})
    }
    else {
        db.collection('Klubb')
        .updateOne({_id: new ObjectId(req.params.id)}, {$set: oppdatering})
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved sletting av klubb'})
        })
    }
})

//Rute som legger nyheter til klubben sin klubbside
klubbRouter.post('/klubber/:id/nyheter', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    } else {
        const nyNyhet = {
            ...req.body,
            _id: new ObjectId(),
            fil: req.body.fil 
        };
        db.collection('Klubb')
        .updateOne(
            { _id: new ObjectId(req.params.id) },
            { $push: { nyheter: nyNyhet } }
        )
        .then(async result => {
            if (io) {
                const klubb = await db.collection('Klubb').findOne({ _id: new ObjectId(req.params.id) });
                io.emit('nyhetOppdatert', { type: 'ny', data: klubb }); // Send hele klubbobjektet
            }
            res.status(201).json(result);
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved lagring av nyhet'});
        });
    }
});

// Rute for å legge til likes og kommentarer til en nyhet
klubbRouter.patch('/klubber/:klubbId/nyheter/:nyhetId', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Ingen database tilkobling' });

    const { klubbId, nyhetId } = req.params;
    const { liker, kommentar, brukernavn } = req.body;

    if (!ObjectId.isValid(klubbId) || !ObjectId.isValid(nyhetId)) {
        return res.status(400).json({ error: 'Ugyldig dokument-id' });
    }

    try {
        const oppdatering = {};
        if (liker) {
            oppdatering.$inc = { 'nyheter.$.likes': 1 };
        }
        if (kommentar) {
            oppdatering.$push = { 'nyheter.$.kommentarer': { brukernavn, kommentar, dato: new Date() } };
        }

        const result = await db.collection('Klubb').updateOne(
            { _id: new ObjectId(klubbId), 'nyheter._id': new ObjectId(nyhetId) },
            oppdatering
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Nyhet ikke funnet' });
        }

        res.status(200).json({ message: 'Nyhet oppdatert', result });
    } catch (error) {
        res.status(500).json({ error: 'Feil ved oppdatering av nyhet' });
    }
});

//rute som legger til bane til git klubb
klubbRouter.post('/klubber/:id/baner', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    } else {
        const nyBane = { ...req.body, _id: new ObjectId() };
        db.collection('Klubb')
        .updateOne(
            { _id: new ObjectId(req.params.id) },
            { $push: { baner: nyBane } }
        )
        .then(result => {
            res.status(201).json(result);
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved lagring av bane'});
        });
    }
});



//rute for henting av alle nyheter
klubbRouter.get('/nyheterListe', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    let nyheter = []; 
    db.collection('Klubb')
    .find()
    .forEach(klubb => {
        if(klubb.nyheter) {
            klubb.nyheter.forEach(nyhet => nyheter.push(nyhet));
        }
    })
    .then(() => {
        res.status(200).json(nyheter);
    })
    .catch(() => {
        res.status(500).json({error: 'Feil ved henting av nyheter'});
    });
})


//rute for henting av alle baner 
klubbRouter.get('/banerListe', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    let baner = []; 
    db.collection('Klubb')
    .find()
    .forEach(klubb => {
        if(klubb.baner) {
            klubb.baner.forEach(bane => baner.push(bane));
        }
    })
    .then(() => {
        res.status(200).json(baner);
    })
    .catch(() => {
        res.status(500).json({error: 'Feil ved henting av baner'});
    }); 
})

//rute for henting av spesifikk bane 
klubbRouter.get('/baner/:id', async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
        const baneId = new ObjectId(req.params.id);
        const klubb = await db.collection('Klubb').findOne({ 'baner._id': baneId }, { projection: { 'baner.$': 1 } });
        
        if (!klubb) {
            return res.status(404).json({ error: 'Bane ikke funnet' });
        }

        const bane = klubb.baner[0];
        const response = {
            ...bane,
            klubbId: klubb._id 
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: 'Feil ved henting av bane' });
    }
});

klubbRouter.patch('/klubber/:klubbId/baner/:baneId', (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    const updates = { ...req.body, _id: new ObjectId(req.params.baneId) };
    if(ObjectId.isValid(req.params.klubbId) === false || ObjectId.isValid(req.params.baneId) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'})
    }
    else {
        db.collection('Klubb')
        .updateOne(
            { _id: new ObjectId(req.params.klubbId), 'baner._id': new ObjectId(req.params.baneId) },
            { $set: { 'baner.$': updates } }
        )
        .then(result => {
            res.status(200).json(result)
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved oppdatering av bane'})
        })
    }
})

//Rute for å lagre poengkort for en bruker
klubbRouter.post('/brukere/:id/poengkort', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    } else {
        const poengkort = req.body

        db.collection('Brukere')
        .updateOne(
            { _id: new ObjectId(req.params.id) }, 
            { $push: { poengkort: poengkort } },
        )
        .then(result => {
            res.status(201).json(result)
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved lagring av poengkort'})
        })
    }
})

//Rute for å lagre invitasjoner for en bruker 
klubbRouter.post('/brukere/:id/invitasjoner', async (req, res) => {
    const db = getDb(); 
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    } else {
        const invitasjon = req.body

        db.collection('Brukere')
        .updateOne(
            { _id: new ObjectId(req.params.id) }, 
            { $push: { invitasjoner: invitasjon } },
        )
        .then(result => {
            if (io) io.emit('invitasjonOppdatert', { type: 'ny', data: invitasjon });
            res.status(201).json(result)
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved lagring av invitasjon'})
        })
    }
})

//Rute for å slette invitasjon 
klubbRouter.delete('/brukere/:id/invitasjoner/:rundeId', async (req, res) => {
    const db = getDb(); 
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    if(ObjectId.isValid(req.params.id) === false) {
        return res.status(400).json({error: 'Ugyldig dokument-id'});
    } else {
        db.collection('Brukere')
        .updateOne(
            { _id: new ObjectId(req.params.id) }, 
            { $pull: { invitasjoner: { 'invitasjon.rundeId': req.params.rundeId } } },
        )
        .then(result => {
            if (result.modifiedCount === 0) {
                return res.status(404).json({error: 'Invitasjon ikke funnet'});
            }
            res.status(200).json(result);
        })
        .catch(err => {
            res.status(500).json({error: 'Feil ved sletting av invitasjon'});
        });
    }
});

//rute for å lagre runde 
klubbRouter.post('/runder', async (req, res) => {
    const db = getDb(); 
    if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
    const runde = req.body

    db.collection('Runder')
    .insertOne(runde)
    .then(result => {
        res.status(201).json(result)
        if (io) io.emit('rundeLagret', { type: 'ny', data: runde });
    })
    .catch(err => {
        res.status(500).json({error: 'Feil ved lagring av runde'})
    })
})

//rute for å lagre antall aksepterte invitasjoner 
klubbRouter.patch('/runder/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Ingen database tilkobling' });

    try {
        const result = await db.collection('Runder').updateOne(
            { rundeId: req.params.id },
            { $inc: { antallAkseptert: 1 } }
        );

        const runde = await db.collection('Runder').findOne({ rundeId: req.params.id });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Runde ikke funnet' });
        }

        res.status(200).json({ message: 'Antall akseptert oppdatert', result});

        if (io) io.emit('akseptertOppdatert', { type: 'ny', data: runde });
    } catch (err) {
        res.status(500).json({ error: 'Feil ved oppdatering av antall akseptert' });
    }
});

//lagrute for å oppdatere antall ferdig spillere
klubbRouter.patch('/runder/ferdig/:id', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Ingen database tilkobling' });


    try {
        const result = await db.collection('Runder').updateOne(
            { rundeId: req.params.id },
            { $inc: { antallFerdig: 1 } }
        );

        const runde = await db.collection('Runder').findOne({ rundeId: req.params.id });

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Runde ikke funnet' });
        }

        res.status(200).json({ message: 'Antall ferdig oppdatert', result });

        if (io) io.emit('akseptertFerdig', { type: 'ny', data: runde });
    } catch (err) {
        res.status(500).json({ error: 'Feil ved oppdatering av antall ferdig' });
    }
})

// Rute for å legge til poengkort til runde
klubbRouter.post('/runder/:rundeId/poengkort', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Ingen database tilkobling' });

    const { rundeId } = req.params;
    const poengkort = req.body;

    try {
        const result = await db.collection('Runder').updateOne(
            { rundeId: rundeId },
            { $push: { poengkort: poengkort } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Runde ikke funnet' });
        }

        res.status(201).json({ message: 'Poengkort lagret', result });
    } catch (err) {
        res.status(500).json({ error: 'Feil ved lagring av poengkort' });
    }
});

//rute for å hente runder
klubbRouter.get('/runder/:rundeId', async (req, res) => {
    const db = getDb();
    if (!db) return res.status(500).json({ error: 'Ingen database tilkobling' });
    try {
        const rundeId = req.params.rundeId;
        const runde = await db.collection('Runder').findOne({ rundeId: rundeId });
        if (!runde) {
            return res.status(404).json({ error: 'Runde ikke funnet' });
        }
        res.status(200).json(runde);
    } catch (err) {
        res.status(500).json({ error: 'Feil ved henting av runde' });
    }
})


//rute for å hente spillere
klubbRouter.get('/spillere', async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
        const brukere = await db.collection("Brukere").find({}).toArray();
        res.status(200).json(brukere); 
    } catch (err) {
        console.error("Feil ved henting av brukere:", err);
        res.status(500).json({ error: "Kunne ikke hente brukere" });
    }
})
//Author: Ylli Ujkani
//Rute for å hente alle anmeldelser for en bane
klubbRouter.get('/baner/:id/reviews', async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
        const baneId = req.params.id;
        // Hent anmeldelser fra databasen
        const reviews = await db.collection('Reviews').find({ baneId: baneId }).toArray();
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({error: 'Feil ved henting av anmeldelser'});
    }
});

//Rute for å legge til en anmeldelse for en bane
klubbRouter.post('/baner/:id/reviews', sjekkBrukerAktiv, beskyttetRute, async (req, res) => {
    try {
        const db = getDb();
        if (!db) return res.status(500).json({error: 'Ingen database tilkobling'});
        const baneId = req.params.id;
        const { rating, kommentar } = req.body;
        //Validering
        if (rating < 1 || rating > 5) {
            return res.status(400).json({error: 'Vurdering må være mellom 1 og 5'});
        }
        const nyReview = {
            baneId: baneId,
            brukerId: req.user._id,
            navn: req.user.brukernavn,
            rating: parseInt(rating),
            kommentar: kommentar,
            dato: new Date()
        };
        const result = await db.collection('Reviews').insertOne(nyReview);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({error: 'Feil ved lagring av anmeldelse'});
    }
});


module.exports = { klubbRouter, setSocketIO };