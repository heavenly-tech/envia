"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type DataRow = Record<string, string>;

// For Electron: files stored by path instead of as File objects
export interface ElectronFilePath {
    name: string;
    path: string;
    size?: number;
}

interface Settings {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPass: string;
    fromName: string;
    fromEmail: string;
}

interface Template {
    subject: string;
    body: string;
    fromName?: string;
    fromEmailOverride?: string;
    // toEmailColumn?: string; // Implicitly finding 'email' header for now, or could make configurable
    cc?: string;
    bcc?: string;
    attachmentVariable?: string; // e.g. "filename" (header name)
}

interface MailMergeContextType {
    data: DataRow[];
    setData: (data: DataRow[]) => void;
    updateDataCell: (rowIndex: number, column: string, value: string) => void;
    headers: string[];
    template: Template;
    setTemplate: (template: Template | ((prev: Template) => Template)) => void;
    settings: Settings;
    setSettings: (settings: Settings | ((prev: Settings) => Settings)) => void;

    // Attachments (Web: File objects)
    attachmentPool: File[];
    setAttachmentPool: (files: File[] | ((prev: File[]) => File[])) => void;

    // Attachments (Electron: file paths)
    electronFilePaths: ElectronFilePath[];
    setElectronFilePaths: (files: ElectronFilePath[] | ((prev: ElectronFilePath[]) => ElectronFilePath[])) => void;
    attachmentFolderPath: string;
    setAttachmentFolderPath: (path: string) => void;
}

const MailMergeContext = createContext<MailMergeContextType | undefined>(undefined);

export function MailMergeProvider({ children }: { children: React.ReactNode }) {
    const [data, setData] = useState<DataRow[]>([]);

    const [template, setTemplate] = useState<Template>({
        subject: "",
        body: "",
        fromName: "",
        fromEmailOverride: "",
        cc: "",
        bcc: "",
        attachmentVariable: ""
    });

    const [settings, setSettings] = useState<Settings>({
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPass: "",
        fromName: "",
        fromEmail: "",
    });

    const [attachmentPool, setAttachmentPool] = useState<File[]>([]);
    const [electronFilePaths, setElectronFilePaths] = useState<ElectronFilePath[]>([]);
    const [attachmentFolderPath, setAttachmentFolderPath] = useState<string>("");

    // Derived state
    const headers = data.length > 0 ? Object.keys(data[0]) : [];

    // Data Editing
    const updateDataCell = (rowIndex: number, column: string, value: string) => {
        setData(prev => {
            const newData = [...prev];
            newData[rowIndex] = { ...newData[rowIndex], [column]: value };
            return newData;
        });
    };

    // Persistence
    useEffect(() => {
        const savedSettings = localStorage.getItem("envia_settings");
        if (savedSettings) setSettings(JSON.parse(savedSettings));

        // v2 key to avoid conflict with old structure if any
        const savedTemplate = localStorage.getItem("envia_template_v2");
        if (savedTemplate) setTemplate(JSON.parse(savedTemplate));
    }, []);

    useEffect(() => {
        localStorage.setItem("envia_settings", JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        localStorage.setItem("envia_template_v2", JSON.stringify(template));
    }, [template]);

    return (
        <MailMergeContext.Provider
            value={{
                data,
                setData,
                updateDataCell,
                headers,
                template,
                setTemplate,
                settings,
                setSettings,
                attachmentPool,
                setAttachmentPool,
                electronFilePaths,
                setElectronFilePaths,
                attachmentFolderPath,
                setAttachmentFolderPath,
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
