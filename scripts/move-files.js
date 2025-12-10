const fs = require('fs-extra');
const path = require('path');

async function moveFiles() {
    const standaloneDir = path.join(__dirname, '../.next/standalone');
    const staticSrc = path.join(__dirname, '../.next/static');
    const publicSrc = path.join(__dirname, '../public');

    const staticDest = path.join(standaloneDir, '.next/static');
    const publicDest = path.join(standaloneDir, 'public');

    console.log('Copying static files to standalone build...');

    try {
        // Copy .next/static -> .next/standalone/.next/static
        if (await fs.pathExists(staticSrc)) {
            await fs.copy(staticSrc, staticDest);
            console.log('Static files copied.');
        } else {
            console.warn('Warning: .next/static not found.');
        }

        // Copy public -> .next/standalone/public
        if (await fs.pathExists(publicSrc)) {
            await fs.copy(publicSrc, publicDest);
            console.log('Public files copied.');
        } else {
            console.warn('Warning: public folder not found.');
        }

        console.log('File preparation complete.');
    } catch (err) {
        console.error('Error copying files:', err);
        process.exit(1);
    }
}

moveFiles();
