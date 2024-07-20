const fs = require('fs');
const path = require('path');

const tilesDirectory = path.join(__dirname, 'tiles');
const outputFile = path.join(tilesDirectory, 'images.json');

fs.readdir(tilesDirectory, (err, files) => {
    if (err) {
        console.error('Error reading directory:', err);
        return;
    }

    // Filter for .png files
    const pngFiles = files.filter(file => path.extname(file) === '.png');

    // Write to JSON file
    fs.writeFile(outputFile, JSON.stringify({ tiles: pngFiles }), (err) => {
        if (err) {
            console.error('Error writing JSON file:', err);
            return;
        }
        console.log('JSON file created:', outputFile);
    });
});
