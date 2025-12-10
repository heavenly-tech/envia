/**
 * Storage service for saving/loading configurations
 * Now supports modular storage: Data, Templates, and SMTP are stored separately
 * with individual names, allowing mix-and-match when loading.
 */

import { DataRow } from "@/context/MailMergeContext";

// Types matching the context
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
    cc?: string;
    bcc?: string;
    attachmentVariable?: string;
}

// Individual saved items (each type stored separately)
export interface SavedDataItem {
    id: string;
    name: string;
    createdAt: string;
    rows: DataRow[];
    headers: string[];
}

export interface SavedTemplateItem {
    id: string;
    name: string;
    createdAt: string;
    template: Template;
}

export interface SavedSMTPItem {
    id: string;
    name: string;
    createdAt: string;
    settings: Settings;
}

// Storage keys for each type
const STORAGE_KEYS = {
    data: "envia_saved_data",
    templates: "envia_saved_templates",
    smtp: "envia_saved_smtp",
};

// Generate unique ID
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============= DATA ITEMS =============
export const listDataItems = (): SavedDataItem[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.data);
    if (!stored) return [];
    try {
        return JSON.parse(stored) as SavedDataItem[];
    } catch {
        return [];
    }
};

export const saveDataItem = (name: string, rows: DataRow[], headers: string[]): SavedDataItem => {
    const newItem: SavedDataItem = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        rows,
        headers,
    };
    const existing = listDataItems();
    existing.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(existing));
    return newItem;
};

export const deleteDataItem = (id: string): void => {
    const items = listDataItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify(filtered));
};

export const getDataItem = (id: string): SavedDataItem | null => {
    const items = listDataItems();
    return items.find(i => i.id === id) || null;
};

// ============= TEMPLATE ITEMS =============
export const listTemplateItems = (): SavedTemplateItem[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.templates);
    if (!stored) return [];
    try {
        return JSON.parse(stored) as SavedTemplateItem[];
    } catch {
        return [];
    }
};

export const saveTemplateItem = (name: string, template: Template): SavedTemplateItem => {
    const newItem: SavedTemplateItem = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        template,
    };
    const existing = listTemplateItems();
    existing.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(existing));
    return newItem;
};

export const deleteTemplateItem = (id: string): void => {
    const items = listTemplateItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify(filtered));
};

export const getTemplateItem = (id: string): SavedTemplateItem | null => {
    const items = listTemplateItems();
    return items.find(i => i.id === id) || null;
};

// ============= SMTP ITEMS =============
export const listSMTPItems = (): SavedSMTPItem[] => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEYS.smtp);
    if (!stored) return [];
    try {
        return JSON.parse(stored) as SavedSMTPItem[];
    } catch {
        return [];
    }
};

export const saveSMTPItem = (name: string, settings: Settings): SavedSMTPItem => {
    const newItem: SavedSMTPItem = {
        id: generateId(),
        name,
        createdAt: new Date().toISOString(),
        settings,
    };
    const existing = listSMTPItems();
    existing.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.smtp, JSON.stringify(existing));
    return newItem;
};

export const deleteSMTPItem = (id: string): void => {
    const items = listSMTPItems();
    const filtered = items.filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.smtp, JSON.stringify(filtered));
};

export const getSMTPItem = (id: string): SavedSMTPItem | null => {
    const items = listSMTPItems();
    return items.find(i => i.id === id) || null;
};

// ============= INDIVIDUAL EXPORT =============
const downloadJSON = (data: object, filename: string): void => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.replace(/[^a-z0-9]/gi, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const exportDataItem = (item: SavedDataItem): void => {
    downloadJSON({ type: "data", ...item }, `data_${item.name}`);
};

export const exportTemplateItem = (item: SavedTemplateItem): void => {
    downloadJSON({ type: "template", ...item }, `template_${item.name}`);
};

export const exportSMTPItem = (item: SavedSMTPItem): void => {
    downloadJSON({ type: "smtp", ...item }, `smtp_${item.name}`);
};

// ============= BUNDLE EXPORT/IMPORT =============
interface ExportBundle {
    version: number;
    exportedAt: string;
    data?: SavedDataItem[];
    templates?: SavedTemplateItem[];
    smtp?: SavedSMTPItem[];
}

export const exportAllItems = (): void => {
    const bundle: ExportBundle = {
        version: 2,
        exportedAt: new Date().toISOString(),
        data: listDataItems(),
        templates: listTemplateItems(),
        smtp: listSMTPItems(),
    };
    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `envia_backup_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importBundle = (file: File): Promise<{ data: number; templates: number; smtp: number }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content) as ExportBundle;

                let dataCount = 0, templateCount = 0, smtpCount = 0;

                if (parsed.data && Array.isArray(parsed.data)) {
                    const existing = listDataItems();
                    const newItems = parsed.data.map(d => ({ ...d, id: generateId() }));
                    localStorage.setItem(STORAGE_KEYS.data, JSON.stringify([...newItems, ...existing]));
                    dataCount = newItems.length;
                }

                if (parsed.templates && Array.isArray(parsed.templates)) {
                    const existing = listTemplateItems();
                    const newItems = parsed.templates.map(t => ({ ...t, id: generateId() }));
                    localStorage.setItem(STORAGE_KEYS.templates, JSON.stringify([...newItems, ...existing]));
                    templateCount = newItems.length;
                }

                if (parsed.smtp && Array.isArray(parsed.smtp)) {
                    const existing = listSMTPItems();
                    const newItems = parsed.smtp.map(s => ({ ...s, id: generateId() }));
                    localStorage.setItem(STORAGE_KEYS.smtp, JSON.stringify([...newItems, ...existing]));
                    smtpCount = newItems.length;
                }

                resolve({ data: dataCount, templates: templateCount, smtp: smtpCount });
            } catch (error) {
                reject(new Error("Invalid JSON file"));
            }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsText(file);
    });
};
