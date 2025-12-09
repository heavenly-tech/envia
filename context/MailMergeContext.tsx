"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type DataRow = Record<string, string>;

interface Settings {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string; // Encryption? In local storage, plain text is risky but standard for this type of client-side-only app.
    fromEmail: string;
}

interface Template {
    subject: string;
    body: string;
}

interface MailMergeContextType {
    data: DataRow[];
    setData: (data: DataRow[]) => void;
    headers: string[];
    template: Template;
    setTemplate: (template: Template | ((prev: Template) => Template)) => void;
    settings: Settings;
    setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;
    attachments: File[];
    setAttachments: (files: File[]) => void;
}

const MailMergeContext = createContext<MailMergeContextType | undefined>(undefined);

export function MailMergeProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<DataRow[]>([]);
    const [template, setTemplate] = useState<Template>({ subject: "", body: "" });
    const [settings, setSettings] = useState<Settings>({
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPass: "",
        fromEmail: "",
    });
    const [attachments, setAttachments] = useState<File[]>([]);

    // Derived state
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // Persistence (optional, load from localStorage on mount)
    useEffect(() => {
        const savedSettings = localStorage.getItem("envia_settings");
        if (savedSettings) setSettings(JSON.parse(savedSettings));

        const savedTemplate = localStorage.getItem("envia_template");
        if (savedTemplate) setTemplate(JSON.parse(savedTemplate));
    }, []);

    // Save on change
    useEffect(() => {
        localStorage.setItem("envia_settings", JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem("envia_template", JSON.stringify(template));
    }, [template]);

    return (
        <MailMergeContext.Provider
            value={{
                data,
                setData,
                headers,
                template,
                setTemplate,
                settings,
                setSettings,
                attachments,
                setAttachments,
            }}
        >
            {children}
        </MailMergeContext.Provider>
    );
}

export function useMailMerge() {
    const context = useContext(MailMergeContext);
    if (context === undefined) {
        throw new Error("useMailMerge must be used within a MailMergeProvider");
    }
    return context;
}
