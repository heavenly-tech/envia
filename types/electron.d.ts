// Type definitions for Electron APIs exposed via preload script

interface ElectronFileInfo {
    name: string;
    path: string;
    size?: number;
    exists: boolean;
}

interface ElectronAPI {
    isElectron: true;
    selectFolder: () => Promise<string | null>;
    selectFiles: () => Promise<{ name: string; path: string }[]>;
    readFileAsBase64: (filePath: string) => Promise<string | null>;
    fileExists: (filePath: string) => Promise<boolean>;
    getFileInfo: (filePath: string) => Promise<ElectronFileInfo>;
}

declare global {
    interface Window {
        electron?: ElectronAPI;
    }
}

export { };
