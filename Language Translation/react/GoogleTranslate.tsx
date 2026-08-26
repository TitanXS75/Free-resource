import React, { useEffect, useState } from 'react';
import { Globe, X } from 'lucide-react';

export interface LanguageOption {
    code: string;
    country: string;
    name: string;
    nativeName?: string;
}

declare global {
    interface Window {
        google?: any;
        googleTranslateElementInit?: () => void;
    }
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'en', country: 'US', name: 'English' },
    { code: 'hi', country: 'IN', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', country: 'IN', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', country: 'IN', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'mr', country: 'IN', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'ta', country: 'IN', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'gu', country: 'IN', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'kn', country: 'IN', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', country: 'IN', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'pa', country: 'IN', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'ur', country: 'IN', name: 'Urdu', nativeName: 'اردو' },
];

export const GoogleTranslate: React.FC = () => {
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [currentLang, setCurrentLang] = useState<string>('en');
    const [tempSelectedLang, setTempSelectedLang] = useState<string>('en');

    const getSavedLanguage = (): string => {
        if (typeof document === 'undefined') return 'en';
        const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z\-]+)/);
        return match ? match[1] : 'en';
    };

    useEffect(() => {
        const saved = getSavedLanguage();
        setCurrentLang(saved);
        setTempSelectedLang(saved);

        if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
            const script = document.createElement('script');
            script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
            script.async = true;
            document.body.appendChild(script);

            window.googleTranslateElementInit = () => {
                if (window.google?.translate?.TranslateElement) {
                    new window.google.translate.TranslateElement(
                        {
                            pageLanguage: 'en',
                            includedLanguages: SUPPORTED_LANGUAGES.map(l => l.code).join(','),
                            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                            autoDisplay: false,
                        },
                        'google_translate_hidden_element'
                    );
                }
            };
        }
    }, []);

    const openModal = (): void => {
        setTempSelectedLang(currentLang);
        setIsModalOpen(true);
    };

    const closeModal = (): void => {
        setIsModalOpen(false);
    };

    const applyLanguage = (): void => {
        const selected = tempSelectedLang;
        const current = currentLang;

        setCurrentLang(selected);
        closeModal();

        if (selected === current) return;

        const domain = window.location.hostname;

        if (selected === 'en') {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain};`;
            if (domain.includes('.')) {
                const rootDomain = domain.split('.').slice(-2).join('.');
                document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${rootDomain};`;
            }
        } else {
            document.cookie = `googtrans=/en/${selected}; path=/;`;
            document.cookie = `googtrans=/en/${selected}; path=/; domain=${domain};`;
            if (domain.includes('.')) {
                const rootDomain = domain.split('.').slice(-2).join('.');
                document.cookie = `googtrans=/en/${selected}; path=/; domain=.${rootDomain};`;
            }
        }

        const triggerCombo = (attempts = 0): void => {
            let combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
            if (!combo) {
                const hidden = document.getElementById('google_translate_hidden_element');
                if (hidden) combo = hidden.querySelector('select');
            }

            if (combo) {
                if (selected === 'en') {
                    let defaultVal = '';
                    for (let i = 0; i < combo.options.length; i++) {
                        const val = combo.options[i].value;
                        if (val === '' || val === 'en' || val === 'auto') {
                            defaultVal = val;
                            break;
                        }
                    }
                    combo.value = defaultVal;
                } else {
                    combo.value = selected;
                }
                combo.dispatchEvent(new Event('change', { bubbles: true }));
                return;
            }

            if (attempts < 25) {
                setTimeout(() => triggerCombo(attempts + 1), 100);
            }
        };

        triggerCombo();
    };

    const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang);

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="notranslate flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3.5 py-1.5 rounded-full transition-all border border-blue-200 shadow-sm cursor-pointer"
                translate="no"
                title={`Language: ${currentLangObj ? currentLangObj.name : 'English'}`}
            >
                <Globe className="w-4 h-4 text-blue-600 notranslate" />
                <span className="text-sm font-semibold notranslate">{currentLangObj ? currentLangObj.name : 'Language'}</span>
            </button>

            {isModalOpen && (
                <div
                    className="notranslate fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-sm"
                    translate="no"
                    onClick={closeModal}
                >
                    <div
                        className="notranslate bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 overflow-hidden flex flex-col"
                        translate="no"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="notranslate flex justify-between items-start p-6 pb-4 border-b border-gray-100" translate="no">
                            <div className="notranslate" translate="no">
                                <h1 className="notranslate text-2xl font-bold text-gray-900 leading-tight" translate="no">Settings</h1>
                                <p className="notranslate text-sm text-gray-500 mt-1" translate="no">Customize your experience</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="notranslate p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                translate="no"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="notranslate p-6 overflow-y-auto max-h-[70vh]" translate="no">
                            <div className="notranslate border border-gray-200 rounded-2xl p-5 bg-white" translate="no">
                                <div className="notranslate mb-4" translate="no">
                                    <div className="notranslate flex items-center gap-2" translate="no">
                                        <Globe className="w-5 h-5 text-blue-600 notranslate" />
                                        <h2 className="notranslate text-base font-semibold text-gray-900" translate="no">Language</h2>
                                    </div>
                                    <p className="notranslate text-xs text-gray-500 ml-7 mt-0.5" translate="no">Select your preferred language</p>
                                </div>

                                <div className="notranslate grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3" translate="no">
                                    {SUPPORTED_LANGUAGES.map((lang) => {
                                        const isSelected = tempSelectedLang === lang.code;
                                        return (
                                            <button
                                                key={lang.code}
                                                type="button"
                                                onClick={() => setTempSelectedLang(lang.code)}
                                                className={`notranslate flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center cursor-pointer ${
                                                    isSelected
                                                        ? 'border-2 border-blue-600 bg-blue-50/60 shadow-sm'
                                                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                                                }`}
                                                translate="no"
                                            >
                                                <div className="notranslate flex items-center gap-1.5" translate="no">
                                                    <span className={`notranslate text-xs font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                                        {lang.country}
                                                    </span>
                                                    <span className={`notranslate text-sm font-semibold ${isSelected ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
                                                        {lang.name}
                                                    </span>
                                                </div>
                                                {lang.nativeName && (
                                                    <span className={`notranslate text-xs mt-0.5 ${isSelected ? 'text-blue-500' : 'text-gray-500'}`}>
                                                        {lang.nativeName}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="notranslate p-6 pt-2" translate="no">
                            <button
                                type="button"
                                onClick={applyLanguage}
                                className="notranslate w-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-blue-500/25 transition-all active:scale-[0.99] cursor-pointer"
                                translate="no"
                            >
                                Apply Language Change
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div id="google_translate_hidden_element" className="hidden notranslate" translate="no"></div>
        </>
    );
};

export default GoogleTranslate;
