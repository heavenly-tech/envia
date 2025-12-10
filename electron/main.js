const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const portfinder = require('portfinder');

let mainWindow;
let serverProcess;

// ============================================
// IPC Handlers for File System Operations
// ============================================

// Open folder selection dialog
ipcMain.handle('dialog:selectFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    return result.filePaths[0];
});

// Open file selection dialog (multi-select)
ipcMain.handle('dialog:selectFiles', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile', 'multiSelections']
    });
    if (result.canceled || result.filePaths.length === 0) {
        return [];
    }
    // Return array of { name, path }
    return result.filePaths.map(filePath => ({
        name: path.basename(filePath),
        path: filePath
    }));
});

// Read file as base64
ipcMain.handle('fs:readFileAsBase64', async (event, filePath) => {
    try {
        const buffer = fs.readFileSync(filePath);
        return buffer.toString('base64');
    } catch (error) {
        console.error('Error reading file:', error);
        return null;
    }
});

// Check if file exists
ipcMain.handle('fs:exists', async (event, filePath) => {
    return fs.existsSync(filePath);
});

// Get file info (name, size)
ipcMain.handle('fs:getFileInfo', async (event, filePath) => {
    try {
        const stats = fs.statSync(filePath);
        return {
            name: path.basename(filePath),
            path: filePath,
            size: stats.size,
            exists: true
        };
    } catch (error) {
        return { name: path.basename(filePath), path: filePath, exists: false };
    }
});

// ============================================
// Window Creation
// ============================================

async function createWindow() {
    // 1. Find an available port
    const port = await portfinder.getPortPromise({ port: 3000, stopPort: 3999 });
    console.log(`Starting server on port ${port}...`);

    // 2. Spawn the Next.js Standalone Server
    // In production (bundled), the path will be different than dev.
    const isDev = !app.isPackaged;

    if (isDev) {
        // In Dev, we just use the localhost:3000 already running via 'npm run electron:dev'
        // We don't spawn the server here, the script does it.
        startWindow(`http://localhost:3000`);
    } else {
        // In Production (Executable)
        // Wait for server to be ready
        const checkServer = () => {
            http.get(`http://localhost:${port}`, (res) => {
                if (res.statusCode === 200) {
                    startWindow(`http://localhost:${port}`);
                } else {
                    setTimeout(checkServer, 100);
                }
            }).on('error', () => {
                setTimeout(checkServer, 100);
            });
        };
        checkServer();
    }
}

function startWindow(url) {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: false, // Security: keep frontend isolated
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true,
    });

    mainWindow.loadURL(url);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    if (serverProcess) {
        serverProcess.kill();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});
