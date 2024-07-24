
//Button controls
Hooks.on('getSceneControlButtons', (controls) => {
    console.log('Adding Hex Map Generator button');
    controls.push({
        name: "hexmap",
        title: "Hex Map Generator",
        icon: "fas fa-hexagon",
        layer: "controls",
        tools: [
            {
                name: "generate",
                title: "Generate Hex Map",
                icon: "fas fa-magic",
            },
            {
                name: "clear",
                title: "Clear Hex Map",
                icon: "fas fa-trash",
            },
            {
                name: "generateFog",
                title: "Generate Fog",
                icon: "fas fa-cloud",
            },
            {
                name: "shiftFog",
                title: "Shift Fog",
                icon: "fas fa-wind",
            },
            {
                name: "removeFog",
                title: "Remove Fog",
                icon: "fas fa-sun",
            },
            {
                name: "generateColorMap",
                title: "Generate Color Map",
                icon: "fas fa-paint-brush",
            },
        ],
        activeTool: "generate"
    });
});

Hooks.on('renderSceneControls', (app, html, data) => {
    console.log('SceneControls rendered');

    html.find('.control-tool[data-tool="generate"]').click(ev => {
        console.log('Generate Hex Map clicked');
        showHexMapDialog();
    });

    html.find('.control-tool[data-tool="generateFog"]').click(ev => {
        console.log('Generate Fog clicked');
        generateFog();
    });

    html.find('.control-tool[data-tool="shiftFog"]').click(ev => {
        console.log('Shift Fog clicked');
        showShiftFogDialog();
    });

    html.find('.control-tool[data-tool="removeFog"]').click(ev => {
        console.log('Remove Fog clicked');
        removeFog();
    });

    html.find('.control-tool[data-tool="clear"]').click(ev => {
        console.log('Clear Hex Map clicked');
        clearHexMap();
    });

    html.find('.control-tool[data-tool="generateColorMap"]').click(ev => {
        console.log('Generate Color Map clicked');
        showGenerateNoiseDialog();
    });
});

//Hex map tile generator functions
async function showHexMapDialog() {
    const content = await renderTemplate("modules/procedural-hex-maps/templates/template.html", {});
    new Dialog({
        title: "Generate Hex Map",
        content: content,
        buttons: {
            generate: {
                icon: '<i class="fas fa-magic"></i>',
                label: "Generate",
                callback: (html) => generateHexMap(html)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "generate",
        render: html => console.log("Register interactivity in the rendered dialog"),
        close: html => console.log("This always is logged no matter which option is chosen")
    }).render(true);
}

async function generateHexMap(html) {
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const hexSize = parseInt(html.find('input[name="hex-size"]').val()) || canvas.grid.size;
    const terrainType = html.find('select[name="terrain-type"]').val() || 'mixed';

    console.log(`Generating hex map: ${width}x${height}, hex size: ${hexSize}, terrain: ${terrainType}`);

    const tileFolder = "modules/procedural-hex-maps/tiles";
    const tileImages = await fetchTileImages(tileFolder);
    console.log("Tile images fetched:", tileImages);
    if (tileImages.length === 0) {
        ui.notifications.warn("No tiles found in the specified directory.");
        return;
    }

    const filteredImages = terrainType === 'mixed' ? tileImages : tileImages.filter(img => img.toLowerCase().includes(terrainType.toLowerCase()));
    console.log("Filtered images:", filteredImages);

    const gridSize = hexSize;
    const rows = Math.ceil(height / (gridSize * 1.5)) + 1; // Ensure coverage
    const cols = Math.ceil(width / (gridSize * Math.sqrt(3))) + 1; // Ensure coverage

    let placedTiles = [];
    placedTileIds = []; // Reset placedTileIds

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * gridSize * Math.sqrt(3) + (row % 2) * (gridSize * Math.sqrt(3) / 2);
            const y = row * gridSize * 1.5;

            // Debug output
            console.log(`Placing tile at (${x}, ${y})`);

            // Check if x and y are within bounds
            if (x < width && y < height) {
                placedTiles.push({
                    x: x,
                    y: y,
                    width: gridSize,
                    height: gridSize,
                    rotation: 0,
                    z: 0,
                    flags: { isHexTile: true }
                });
            }
        }
    }

    console.log('Total tiles to place:', placedTiles.length);

    let createdTiles = await canvas.scene.createEmbeddedDocuments("Tile", placedTiles);
    placedTileIds = createdTiles.map(tile => tile.id);
    console.log('Created tiles:', createdTiles);

    let updateData = createdTiles.map(tile => {
        const tileImage = filteredImages[Math.floor(Math.random() * filteredImages.length)];
        const texturePath = `${tileFolder}/${tileImage}`;

        console.log(`Tile ID: ${tile.id}`);
        console.log(`Tile Document:`, tile);

        return {
            _id: tile.id,
            texture: {
                src: texturePath,
                scaleX: 4,
                scaleY: 4,
                offsetX: 0,
                offsetY: 0
            }
        };
    });

    try {
        console.log('Update data before applying:', updateData);
        await canvas.scene.updateEmbeddedDocuments("Tile", updateData);
        console.log('All tiles placed and images assigned');
    } catch (error) {
        console.error("Error updating tile textures:", error);
    }
}

let placedTileIds = []; // Array to keep track of placed tile IDs

async function fetchTileImages(folderPath) {
    try {
        const response = await fetch(`${folderPath}/images.json`);
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return data.tiles || [];
    } catch (error) {
        console.error("Error fetching tile images:", error);
        return [];
    }
}

function clearHexMap() {
    console.log('Clearing Hex Map');
    if (placedTileIds.length > 0) {
        canvas.scene.deleteEmbeddedDocuments("Tile", placedTileIds)
            .then(() => {
                placedTileIds = []; // Clear the array after successful deletion
                ui.notifications.info("Hex map cleared.");
            })
            .catch(error => console.error("Error clearing hex map:", error));
    } else {
        ui.notifications.info("No tiles to clear.");
    }
}


//Fog generator functions
function generateFog() {
    new Dialog({
        title: "Generate Fog",
        content: `
            <p>Enter a seed value for fog generation:</p>
            <input type="number" id="seed-value" style="width: 100%;" />
            <p>Enter a scale factor (lower values = larger features):</p>
            <input type="number" id="scale-input" style="width: 100%;" step="0.001" value="0.1" />
            <p>Select noise type:</p>
            <select id="noise-type" style="width: 100%;">
                <option value="perlin">Perlin</option>
                <option value="simplex">Simplex</option>
                <option value="worley">Worley</option>
                <option value="fbm">FBM (Perlin)</option>
            </select>
            <p>Fog density (0-1, higher values create denser fog):</p>
            <input type="number" id="fog-density" style="width: 100%;" step="0.01" min="0" max="1" value="0.5" />
        `,
        buttons: {
            generate: {
                label: "Generate",
                callback: (html) => {
                    const seed = parseInt(html.find("#seed-value").val(), 10);
                    const scale = parseFloat(html.find("#scale-input").val());
                    const noiseType = html.find("#noise-type").val();
                    const fogDensity = parseFloat(html.find("#fog-density").val());
                    if (isNaN(seed) || isNaN(scale) || isNaN(fogDensity)) {
                        ui.notifications.error("Invalid seed, scale, or density value.");
                        return;
                    }
                    if (fogDensity < 0 || fogDensity > 1) {
                        ui.notifications.error("Fog density must be between 0 and 1.");
                        return;
                    }
                    applyFogGeneration(seed, scale, noiseType, fogDensity);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

function applyFogGeneration(seed, scale, noiseType, fogDensity) {
    const scene = canvas.scene;
    const fogColor = 0xCCCCCC; // Fog gray color
    const fogOpacity = 0.5; // Adjust as needed
    const templateSize = 7; // Size in feet
    const threshold = 1 - fogDensity; // Convert density to threshold
    console.log("Starting fog generation script");

    // Check if fog exists and remove it if it does
    const existingFog = canvas.templates.placeables.filter(t => t.document.flags?.isFog);
    if (existingFog.length > 0) {
        console.log(`Removing ${existingFog.length} fog templates`);
        canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", existingFog.map(f => f.id));
        ui.notifications.info("Existing fog removed");
    }

    // Generate new fog
    const gridSize = scene.grid.size * 2;
    const rows = Math.ceil(canvas.dimensions.height / gridSize);
    const cols = Math.ceil(canvas.dimensions.width / gridSize);
    console.log(`Generating fog for ${rows} rows and ${cols} columns`);

    const noiseModule = new NoiseModule();
    noiseModule.setSeed(seed);

    let fogTemplates = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let noiseValue;
            switch (noiseType) {
                case 'simplex':
                    noiseValue = (noiseModule.simplex(col * scale, row * scale) + 1) / 2;
                    break;
                case 'worley':
                    noiseValue = noiseModule.worley(col * scale, row * scale);
                    break;
                case 'fbm':
                    noiseValue = noiseModule.fbm(col * scale, row * scale);
                    break;
                case 'perlin':
                default:
                    noiseValue = (noiseModule.perlin(col * scale, row * scale) + 1) / 2;
            }

            if (noiseValue > threshold) {
                const x = col * gridSize + gridSize / 2;
                const y = row * gridSize + gridSize / 2;

                fogTemplates.push({
                    t: "circle",
                    user: game.user.id,
                    x: x,
                    y: y,
                    direction: 0,
                    distance: templateSize,
                    borderColor: fogColor,
                    fillColor: fogColor,
                    fillAlpha: fogOpacity,
                    texture: "",
                    hidden: false,
                    flags: { isFog: true }
                });
            }
        }
    }
    canvas.scene.createEmbeddedDocuments("MeasuredTemplate", fogTemplates)
        .then(createdFog => {
            console.log(`Created ${createdFog.length} fog templates`);
            canvas.perception.update({ refreshLighting: true, refreshVision: true }, true);
            ui.notifications.info("Fog generated");
        })
        .catch(error => {
            console.error("Error creating fog:", error);
        });
}

async function showShiftFogDialog() {
    const content = `
        <p>Enter the number of times to shift the fog:</p><input type="number" id="shift-count" value="1" min="1" style="width: 100%;"/>
        <p>Select wind direction:</p>
        <select id="wind-direction" style="width: 100%;">
            <option value="N">North</option>
            <option value="NE">North-East</option>
            <option value="E">East</option>
            <option value="SE">South-East</option>
            <option value="S">South</option>
            <option value="SW">South-West</option>
            <option value="W">West</option>
            <option value="NW">North-West</option>
        </select>
        <p>Set wind intensity (e.g., 1, 2, 3):</p><input type="number" id="wind-intensity" value="1" min="0" step="0.1" style="width: 100%;"/>
    `;
    new Dialog({
        title: "Shift Fog",
        content: content,
        buttons: {
            shift: {
                label: "Shift Fog",
                callback: (html) => {
                    const shiftCount = parseInt(html.find("#shift-count").val(), 10);
                    const windDirection = html.find("#wind-direction").val();
                    const windIntensity = parseFloat(html.find("#wind-intensity").val());

                    shiftFog(shiftCount, windDirection, windIntensity);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "shift"
    }).render(true);
}

function shiftFog(shiftCount, windDirection, windIntensity) {
    const fog = canvas.templates.placeables.filter(t => t.document.flags?.isFog);
    if (fog.length === 0) {
        ui.notifications.warn("No fog to shift");
        return;
    }

    const directions = {
        N: { dx: 0, dy: -1 },
        NE: { dx: 1, dy: -1 },
        E: { dx: 1, dy: 0 },
        SE: { dx: 1, dy: 1 },
        S: { dx: 0, dy: 1 },
        SW: { dx: -1, dy: 1 },
        W: { dx: -1, dy: 0 },
        NW: { dx: -1, dy: -1 }
    };

    const { dx, dy } = directions[windDirection] || { dx: 0, dy: 0 };
    const gridSize = canvas.scene.grid.size;
    const shiftDistance = gridSize * windIntensity * shiftCount;

    fog.forEach(template => {
        const data = template.document; // Use document directly

        // Check if template has valid x and y properties
        if (data.x == null || data.y == null) {
            console.error("Template data missing x or y:", template);
            return;
        }

        // Calculate new positions with wind influence
        let newX = data.x + dx * shiftDistance;
        let newY = data.y + dy * shiftDistance;

        // Add random movement
        newX += (Math.random() - 0.5) * gridSize;
        newY += (Math.random() - 0.5) * gridSize;

        // Ensure fog templates don't get closer than 1 tile to each other
        fog.forEach(otherTemplate => {
            if (template !== otherTemplate) {
                const distance = Math.sqrt(Math.pow(newX - otherTemplate.document.x, 2) + Math.pow(newY - otherTemplate.document.y, 2));
                if (distance < gridSize) {
                    newX += Math.sign(newX - otherTemplate.document.x) * gridSize;
                    newY += Math.sign(newY - otherTemplate.document.y) * gridSize;
                }
            }
        });

        // Update template position
        template.document.update({ x: newX, y: newY });
    });

    canvas.perception.update({ refreshLighting: true, refreshVision: true }, true);
    ui.notifications.info(`Fog shifted ${shiftCount} times to the ${windDirection}`);
}

function removeFog() {
    const fog = canvas.templates.placeables.filter(t => t.document.flags?.isFog);
    if (fog.length > 0) {
        canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", fog.map(f => f.id))
            .then(() => {
                ui.notifications.info("Fog removed");
                canvas.perception.update({ refreshLighting: true, refreshVision: true }, true);
            })
            .catch(error => {
                console.error("Error removing fog:", error);
            });
    } else {
        ui.notifications.warn("No fog to remove");
    }
}


//Background painting functions
async function showGenerateNoiseDialog() {
    const content = `
        <p>Enter a seed value for noise generation:</p>
        <input type="number" id="seed-input" style="width: 100%;" />
        <p>Enter a scale factor (lower values = larger features):</p>
        <input type="number" id="scale-input" style="width: 100%;" step="0.001" value="0.005" />
        <p>Select noise type:</p>
        <select id="noise-type" style="width: 100%;">
            <option value="perlin">Perlin</option>
            <option value="simplex">Simplex</option>
            <option value="worley">Worley</option>
            <option value="fbm">FBM (Perlin)</option>
        </select>
    `;
    new Dialog({
        title: "Generate and Apply Noise",
        content: content,
        buttons: {
            generate: {
                label: "Apply Noise",
                callback: (html) => {
                    const seed = parseInt(html.find("#seed-input").val(), 10);
                    const scale = parseFloat(html.find("#scale-input").val());
                    const noiseType = html.find("#noise-type").val();
                    if (isNaN(seed) || isNaN(scale)) {
                        ui.notifications.error("Invalid seed or scale value.");
                        return;
                    }
                    generateAndApplyNoiseToBackground(seed, scale, noiseType);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

async function generateAndApplyNoiseToBackground(seed, scale, noiseType) {
    if (!canvas || !canvas.scene) {
        console.error("Canvas or scene is not available.");
        return;
    }
    const scene = canvas.scene;
    const imagePath = 'modules/procedural-hex-maps/MapTemplate.png';
    const canvasEl = document.createElement('canvas');
    const ctx = canvasEl.getContext('2d');
    const width = canvasEl.width = 4000;
    const height = canvasEl.height = 3000;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imagePath;
    img.onload = async () => {
        ctx.drawImage(img, 0, 0, width, height);
        applyElevationNoiseToImage(ctx, width, height, seed, scale, noiseType);
        const texturePath = canvasEl.toDataURL('image/png');

        try {
            // Update the scene with the new background
            await scene.update({ 'background.src': texturePath });

            // Refresh the canvas and its components
            setTimeout(() => {
                // Force a redraw of the canvas
                canvas.draw();

                // Use the updated method to refresh perception
                const refreshFlags = {
                    refreshLighting: true,
                    refreshVision: true,
                    refreshSounds: true
                };

                // Check if refreshOcclusion is available (Foundry V12+)
                if (typeof canvas.perception.refreshOcclusion === 'function') {
                    refreshFlags.refreshOcclusion = true;
                } else if (typeof canvas.perception.refreshTiles === 'function') {
                    // Fallback for older versions
                    refreshFlags.refreshTiles = true;
                }

                canvas.perception.update(refreshFlags);

                // Refresh tokens if the method is available
                if (canvas.tokens && typeof canvas.tokens.refresh === 'function') {
                    canvas.tokens.refresh();
                } else if (canvas.tokens && canvas.tokens.placeables) {
                    // Alternative way to refresh tokens
                    canvas.tokens.placeables.forEach(token => token.refresh());
                }

                // Emit a custom hook for other modules that might need to respond to the background change
                Hooks.callAll('backgroundRefreshed', scene);
            }, 100);  // 100ms delay to ensure the background has loaded

            ui.notifications.info('Elevation noise applied and background refreshed.');
        } catch (error) {
            console.error("Error updating scene:", error);
            ui.notifications.error("Error updating scene.");
        }
    };
    img.onerror = (error) => {
        console.error("Error loading background image:", error);
        ui.notifications.error("Error loading background image.");
    };
}

function applyElevationNoiseToImage(ctx, width, height, seed, scale, noiseType) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const noiseModule = new NoiseModule();
    noiseModule.setSeed(seed);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let noiseValue;
            switch (noiseType) {
                case 'simplex':
                    noiseValue = (noiseModule.simplex(x * scale, y * scale) + 1) / 2;
                    break;
                case 'worley':
                    noiseValue = noiseModule.worley(x * scale, y * scale);
                    break;
                case 'fbm':
                    noiseValue = noiseModule.fbm(x * scale, y * scale);
                    break;
                case 'perlin':
                default:
                    noiseValue = (noiseModule.perlin(x * scale, y * scale) + 1) / 2;
            }
            const color = getTerrainColor(noiseValue);
            const index = (y * width + x) * 4;
            data[index] = color.r;     // Red
            data[index + 1] = color.g; // Green
            data[index + 2] = color.b; // Blue
            data[index + 3] = 255;     // Alpha (fully opaque)
        }
    }
    ctx.putImageData(imageData, 0, 0);
    console.log(`${noiseType} noise applied to image`);
}

function getTerrainColor(value) {
    // Invert the value so that higher values are darker
    const invertedValue = 1 - value;

    // Lerp between white (255, 255, 255) and black (0, 0, 0)
    const color = Math.round(invertedValue * 255);

    return { r: color, g: color, b: color };
}

function interpolateColor(color1, color2, t) {
    return {
        r: Math.round(color1.r + (color2.r - color1.r) * t),
        g: Math.round(color1.g + (color2.g - color1.g) * t),
        b: Math.round(color1.b + (color2.b - color1.b) * t)
    };
}



