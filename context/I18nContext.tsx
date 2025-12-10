"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale } from "@/lib/translations";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("es");

    useEffect(() => {
        // Load from localStorage on mount
        const saved = localStorage.getItem("envia-locale") as Locale | null;
        if (saved && (saved === "en" || saved === "es")) {
            setLocaleState(saved);
        }
    }, []);

    const setLocale = (newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("envia-locale", newLocale);
    };

    const t = (key: string): string => {
        return translations[locale][key] || key;
    };

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within an I18nProvider");
    }
    return context;
}
