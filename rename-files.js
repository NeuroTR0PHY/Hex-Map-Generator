const fs = require('fs');
const path = require('path');

// Directory containing the files
const directoryPath = './tiles'; // Change this to your directory path

// Function to rename files
function renameFiles() {
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            if (path.extname(file) === '.png') {
                // Construct the new file name by removing spaces
                const newFileName = file.replace(/ /g, '_');
                const oldFilePath = path.join(directoryPath, file);
                const newFilePath = path.join(directoryPath, newFileName);

                // Rename the file
                fs.rename(oldFilePath, newFilePath, (err) => {
                    if (err) {
                        console.error(`Error renaming file ${file}:`, err);
                    } else {
                        console.log(`Renamed ${file} to ${newFileName}`);
                    }
                });
            }
        });
    });
}

// Execute the renaming function
renameFiles();
