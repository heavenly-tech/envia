const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electron', {
    // Check if running in Electron
    isElectron: true,

    // Open folder selection dialog
    selectFolder: () => ipcRenderer.invoke('dialog:selectFolder'),

    // Open file selection dialog (multi-select)
    selectFiles: () => ipcRenderer.invoke('dialog:selectFiles'),

    // Read a file from disk and return as base64
    readFileAsBase64: (filePath) => ipcRenderer.invoke('fs:readFileAsBase64', filePath),

    // Check if a file exists
    fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),

    // Get file info (name, size)
    getFileInfo: (filePath) => ipcRenderer.invoke('fs:getFileInfo', filePath),
});
