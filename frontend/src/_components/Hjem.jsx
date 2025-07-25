// Author: Bjarne Beruldsen & Abdinasir Ali

import React from 'react';
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Hjem = () => {
    const { t } = useTranslation();

    const handleTommeTestdata = () => {
        if (window.confirm(t('Er du sikker på at du vil tømme all testdata?'))) {
            fetch(`${process.env.REACT_APP_API_BASE_URL}/tommeTestdata`, {
                method: 'DELETE'
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                window.location.reload();
            })
            .catch(error => {
                console.error(t('Feil ved tømming av testdata:'), error);
            });
        }
    };

    return (
        <header>
            <div className="text-grey-200 py-6 text-center bg-gray-40 justify-items-center space-y-2">
                <h1 className="text-2xl font-normal">{t('Over 5,000 Baner')}</h1>
                <p className="text-lg text-[#656565]">{t('Registrer resultater og forbedre din spillopplevelse')}</p>
                <div className="flex justify-center">
                    <Link to="Baner">
                        <h1 className="text-center bg-[#A09884] w-full max-w-sm px-9 py-1 rounded-3xl text-2xl text-white hover:scale-105">
                            {t('Finn Bane')}
                        </h1>
                    </Link>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mt-20">{t('Øk diskgolf opplevelsen din 🥏')}</h2>
                <div className="justify-items-center grid xl:grid-cols-3 mt-10 gap-3">
                    <div
                        className="relative h-[500px] w-[470px] bg-cover bg-no-repeat rounded-lg"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1575378912698-edc484585334?q=80&w=1943&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
                        }}
                    >
                        <div className="absolute inset-0 bg-white opacity-70"></div>
                        <div className="relative p-4 mt-30">
                            <h1 className="text-4xl text-left">{t('Utforsk baner med venner')}</h1>
                            <p className="mt-4 text-gray-600 leading-relaxed text-3xl text-left font-sans">
                                {t('Finn nye disc golf-baner, planlegg turer med venner, og opplev spennende utfordringer sammen!')}
                            </p>
                        </div>
                    </div>

                    <div
                        className="relative h-[500px] w-[470px] bg-cover bg-no-repeat rounded-lg"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1725724767938-26e57f67a12c?q=80&w=2004&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
                        }}
                    >
                        <div className="absolute inset-0 bg-white opacity-70"></div>
                        <div className="relative p-4 mt-30">
                            <h1 className="text-4xl text-left">{t('Delta i en klubb')}</h1>
                            <p className="mt-4 text-gray-600 leading-relaxed text-3xl text-left">
                                {t('Bli med i en disc golf-klubb og bli en del av et engasjert fellesskap!')}
                            </p>
                        </div>
                    </div>

                    <div
                        className="relative h-[500px] w-[470px] bg-cover bg-no-repeat rounded-lg"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1727727302419-9579e5f9f76e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
                        }}
                    >
                        <div className="absolute inset-0 bg-white opacity-70"></div>
                        <div className="relative p-4 mt-30">
                            <h1 className="text-4xl text-left">{t('Turneringer')}</h1>
                            <p className="mt-4 text-gray-600 leading-relaxed text-3xl text-left">
                                {t('Delta i spennende turneringer og utfordr deg selv sammen med andre disc golf-spillere!')}
                            </p>
                        </div>
                    </div>
                </div>

                <h1 className="text-4xl font-sans mt-20 font-bold">{t('Sjekk værforholdene før du spiller!')}</h1>
                <div className="flex justify-center mt-1 w-full">
                    <iframe
                        title={t('YR værmelding')}
                        src="https://www.yr.no/nb/innhold/1-72837/table.html"
                        className="w-full h-[550px] pointer-events-none"
                    ></iframe>
                </div>

                <div className="m-8 flex justify-center">
                    <button onClick={handleTommeTestdata} className="py-4 px-8 bg-red-500 rounded-lg text-sm text-white justify-self-end">
                        {t('Slett testdata')}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Hjem;