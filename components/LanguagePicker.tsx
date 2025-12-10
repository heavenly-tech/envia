"use client";

import { useI18n } from "@/context/I18nContext";
import { Locale } from "@/lib/translations";
import { cn } from "@/lib/utils";

const flags: Record<Locale, { emoji: string; label: string }> = {
    en: { emoji: "🇬🇧", label: "English" },
    es: { emoji: "🇪🇸", label: "Español" },
};

export function LanguagePicker() {
    const { locale, setLocale } = useI18n();

    return (
        <div className="flex items-center gap-1 bg-muted/50 rounded-full p-1">
            {(Object.keys(flags) as Locale[]).map((lang) => (
                <button
                    key={lang}
                    onClick={() => setLocale(lang)}
                    className={cn(
                        "text-xl px-2 py-1 rounded-full transition-all hover:bg-background",
                        locale === lang ? "bg-background shadow-sm ring-1 ring-border" : "opacity-60"
                    )}
                    title={flags[lang].label}
                    aria-label={`Switch to ${flags[lang].label}`}
                >
                    {flags[lang].emoji}
                </button>
            ))}
        </div>
    );
}
