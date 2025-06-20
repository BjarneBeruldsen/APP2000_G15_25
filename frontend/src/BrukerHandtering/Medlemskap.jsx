//Author: Laurent Zogaj & Severin Waller Sørensen

/* Denne filen er en React-kompoonent som fungerer som en sentral side for
 * for brukere til å administrere sine innstillinger samt at den
 * også gir brukeren tilgang til ulike funksjoner avhengig av brukerens rolle.
 * Engelsk oversettelse her har ikke fungert dessverre. 
 */

import React, { useState } from "react";
import "../App.css";
import BrukerInnstillinger from "./Komponenter/BrukerInnstillinger.jsx";
import Personvern from "./Komponenter/Personvern.jsx";
import Sikkerhet from "./Komponenter/Sikkerhet.jsx";
import MinKlubb from "./Komponenter/MinKlubb.jsx";
import MittAbonnement from "./Komponenter/MittAbonnement.jsx";
import HentBruker from "./HentBruker.jsx"; 
import AdminDashboard from "../Admin/AdminDashboard";
import BrukerListe from "../Admin/BrukerListe.jsx";
import SystemLogg from "../Admin/LoggSystem.jsx";
import GlobaleInnstillinger from "../Admin/GlobaleInnstillinger.jsx";
import AdministrereKlubber from "../Admin/AdministrereKlubber.jsx";
import MedlemsAdministrasjon from "../KlubbHandtering/AdministrereMedlem.jsx";
import { useTranslation } from "react-i18next";

const Medlemskap = () => {
  const { t } = useTranslation();
  const { bruker, setBruker } = HentBruker(); //Henter brukerdata fra HentBruker.jsx
  const [valgtKategori, setValgtKategori] = useState("Brukerinnstillinger");
  const [valgtUnderKategori, setValgtUnderKategori] = useState("");
  const [underKategoriOpen, setUnderKategoriOpen] = useState(true);

  //Definerer hovedkategorier
  const hovedKategorier = (() => {
    if (bruker?.rolle === "hoved-admin") {
      return [
        "Systeminnstillinger",
        "Administrasjon",
        "Klubbinnstillinger",
        "Brukerinnstillinger",
        "Personvern",
        "Sikkerhet",
        "Min Klubb",
        "Mitt abonnement",
      ];
    } else if (bruker?.rolle === "admin") {
      return [
        "Administrasjon",
        "Klubbinnstillinger",
        "Brukerinnstillinger",
        "Personvern",
        "Sikkerhet",
        "Min Klubb",
        "Mitt abonnement",
      ];
    } else if (bruker?.rolle === "klubbleder") {
      return [
        "Klubbinnstillinger",
        "Brukerinnstillinger",
        "Personvern",
        "Sikkerhet",
        "Min Klubb",
        "Mitt abonnement",
      ];
    } else if (bruker?.rolle === "klubbmedlem") {
      return [
        "Brukerinnstillinger",
        "Personvern",
        "Sikkerhet",
        "Min Klubb",
        "Mitt abonnement",
      ];
    } else if (bruker?.rolle === "loggetInn") {
      return [
        "Brukerinnstillinger",
        "Personvern",
        "Sikkerhet",
      ];
    } else {
      return []; // Ingen tilgang hvis ingen rolle er definert
    }
  })();

  //Definerer underkategorier
  const underKategorier = {
    Systeminnstillinger: ["Globale innstillinger", "Brukeradministrasjon", "Systemlogg"],
    Administrasjon: ["AdminDashboard", "Administrere klubber"],
    Klubbinnstillinger: ["Administrere medlem"],
    Brukerinnstillinger: ["Min informasjon", "Endre min informasjon", "Slett bruker"],
    Personvern: ["Informasjonskapsler", "Synlighet"],
    Sikkerhet: ["To-faktor autentisering", "Gjennoppretting"],
    "Min Klubb": ["Min klubb", "Søk etter klubb", "Søk etter brukere", "Avregistrer"],
    "Mitt abonnement": ["Mitt abonnement"],
  };

  //Funksjon for å bytte mellom hovedkategorier og underkategorier
  const toggleUnderKategori = (kategori) => {
    if (valgtKategori === kategori) {
      setUnderKategoriOpen(!underKategoriOpen);
    } else {
      setValgtKategori(kategori);
      setUnderKategoriOpen(true);
    }
    setValgtUnderKategori("");
  };

  //Design og Styling for menyer og innhold i Medlemskap 
  return (
    <div
      className="outer-wrapper"
      style={{
        backgroundImage: `url('https://images.unsplash.com/photo-1616840388998-a514fe2175b9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3')`,
      }}
    >
      {/*Venstre Meny*/}
      <div className="menu-box">
        <h2 className="text-lg font-bold mb-4">{t("Innstillinger")}</h2>
        <ul className="space-y-4">
          {hovedKategorier.map((kat) => (
            <li key={kat}>
              <button
                className={`w-full text-left p-2 rounded transition duration-200 ${
                  valgtKategori === kat
                    ? "bg-gray-100 font-semibold text-black"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => toggleUnderKategori(kat)}
              >
                {kat}
              </button>
              {valgtKategori === kat && underKategoriOpen && underKategorier[kat] && (
                <ul className="ml-4 space-y-2 mt-2">
                  {underKategorier[kat].map((underkategori) => (
                    <li key={underkategori}>
                      <button
                        className={`w-full text-left p-2 rounded transition duration-200 ${
                          valgtUnderKategori === underkategori
                            ? "bg-gray-200 font-semibold text-black"
                            : "hover:bg-gray-200 text-gray-700"
                        }`}
                        onClick={() => setValgtUnderKategori(underkategori)}
                      >
                        {underkategori}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/*Høyre Meny*/}
      <div className="content-box flex flex-col items-center justify-center gap-6">

        {valgtKategori === "Systeminnstillinger" && valgtUnderKategori === "Globale innstillinger" && (
          <GlobaleInnstillinger />
        )}

        {valgtKategori === "Systeminnstillinger" && valgtUnderKategori === "Brukeradministrasjon" && (
          <BrukerListe />
        )}

        {valgtKategori === "Systeminnstillinger" && valgtUnderKategori === "Systemlogg" && (
          <SystemLogg />
        )}

        {valgtKategori === "Administrasjon" && valgtUnderKategori === "AdminDashboard" && (
          <AdminDashboard />
        )}

        {valgtKategori === "Administrasjon" && valgtUnderKategori === "Administrere klubber" && (
          <AdministrereKlubber />
        )}

        {valgtKategori === "Klubbinnstillinger" && valgtUnderKategori === "Administrere medlem" && (
          <MedlemsAdministrasjon />
        )}

        {valgtKategori === "Brukerinnstillinger" && valgtUnderKategori && (
          <BrukerInnstillinger bruker={bruker} valgtUnderKategori={valgtUnderKategori} setBruker={setBruker} />
        )}

        {valgtKategori === "Personvern" && valgtUnderKategori && (
          <Personvern valgtUnderKategori={valgtUnderKategori} />
        )}

        {valgtKategori === "Sikkerhet" && valgtUnderKategori && (
          <Sikkerhet valgtUnderKategori={valgtUnderKategori} />
        )}

        {valgtKategori === "Min Klubb" && valgtUnderKategori && (
          <MinKlubb valgtUnderKategori={valgtUnderKategori} />
        )}

        {valgtKategori === "Mitt abonnement" && valgtUnderKategori && (
          <MittAbonnement valgtUnderKategori={valgtUnderKategori} bruker={bruker} />
        )}
        
        {/* Fallback melding*/}
        {!valgtUnderKategori && (
          <p className="text-gray-600 text-center">{t("Velg en underkategori for ditt behov")}</p>
        )}
      </div>
    </div>
  );
};

// eksporterer komponenten
export default Medlemskap;