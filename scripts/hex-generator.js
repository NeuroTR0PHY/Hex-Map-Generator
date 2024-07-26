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

// Hex data structure
class HexData {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.row = 0;

        // Terrain characteristics
        this.elevation = 0;
        this.humidity = 0;
        this.temperature = 0;
        this.precipitation = 0;
        this.windSpeed = 0;
        this.windDirection = 0;

        // Biome and vegetation
        this.biomeType = '';
        this.vegetationType = '';
        this.vegetationDensity = 0;

        // Water features
        this.isWater = false;
        this.waterDepth = 0;
        this.isCoastal = false;
        this.riverSize = 0;

        // Resources and features
        this.resources = [];
        this.landmarks = [];

        // Civilization and development
        this.owner = '';
        this.population = 0;
        this.developmentLevel = 0;
        this.buildingType = '';

        // Game mechanics
        this.movementCost = 1;
        this.defensebonus = 0;
        this.visibilityRange = 1;

        // Environmental conditions
        this.pollutionLevel = 0;
        this.radiationLevel = 0;

        // Time-based properties
        this.seasonalEffects = {};
        this.weatherCondition = '';

        // Fog of war
        this.isExplored = false;
        this.lastExploredTurn = -1;

        // New properties for encounters, items, and notes
        this.potentialEnemies = [];
        this.items = [];
        this.notes = '';

        // Custom properties
        this.customProperties = {};


    }

    setRow(row) {
        this.row = row;
    }

    // Methods for managing potential enemies
    addPotentialEnemy(enemy) {
        this.potentialEnemies.push(enemy);
    }

    removePotentialEnemy(enemyId) {
        this.potentialEnemies = this.potentialEnemies.filter(e => e.id !== enemyId);
    }

    // Methods for managing items
    addItem(item) {
        this.items.push(item);
    }

    removeItem(itemId) {
        this.items = this.items.filter(i => i.id !== itemId);
    }

    // Method to update notes
    updateNotes(newNotes) {
        this.notes = newNotes;
    }

    calculateMovementCost() {
        let cost = this.movementCost;
        if (this.elevation > 0.7) cost *= 2;
        if (this.isWater) cost *= this.waterDepth > 2 ? 3 : 1.5;
        return cost;
    }

    updateSeasonalEffects(currentSeason) {
        this.temperature += this.seasonalEffects[currentSeason]?.temperature || 0;
        this.precipitation += this.seasonalEffects[currentSeason]?.precipitation || 0;
    }
}

// Function to create hex grid data
function createHexGridData(width, height, hexSize) {
    const hexGrid = [];
    const hexWidth = hexSize + 10;
    const hexHeight = hexSize;
    const horizontalSpacing = hexWidth * 3 / 4;
    const verticalSpacing = hexHeight;

    const columns = Math.ceil(width / horizontalSpacing);
    const rows = Math.ceil(height / hexHeight);

    let id = 1;
    for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
            const x = col * horizontalSpacing;
            const y = row * verticalSpacing + (col % 2) * (hexHeight / 2);

            // Calculate the center of the hex
            const centerX = x + (hexWidth+10) / 2;
            const centerY = y + hexHeight / 2;

            if (centerX < width && centerY < height) {
                // Calculate the staggered row number
                let staggeredRow;
                if (col % 2 === 0) {
                    // Even columns
                    staggeredRow = row * 2 + 1;
                } else {
                    // Odd columns
                    staggeredRow = row * 2 + 2;
                }

                // Create HexData object and set its row
                const hexData = new HexData(id, centerX, centerY);
                hexData.setRow(staggeredRow);
                hexGrid.push(hexData);
                id++;
            }
        }
    }

    return hexGrid;
}

placedTileIds = [];
// Updated generateHexMap function with row-based z-index
async function generateHexMap(html) {
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const hexSize = parseInt(html.find('input[name="hex-size"]').val()) || canvas.grid.size;
    const terrainType = html.find('select[name="terrain-type"]').val() || 'mixed';

    console.log(`Generating hex map: ${width}x${height}, hex size: ${hexSize}, terrain: ${terrainType}`);

    const hexGrid = createHexGridData(width, height, hexSize);

    let placedTiles = hexGrid.map(hex => ({
        x: hex.x - (hexSize+10) / 2,  // Adjust x to top-left corner
        y: hex.y - hexSize / 2,  // Adjust y to top-left corner
        width: hexSize+10,
        height: hexSize,
        rotation: 0,
        sort: hex.row, // Use the row number as the z-index (sort value)
        flags: { isHexTile: true, hexId: hex.id }
    }));

    console.log('Total tiles to place:', placedTiles.length);

    const tileFolder = "modules/procedural-hex-maps/tiles";
    const tileImages = await fetchTileImages(tileFolder);
    if (tileImages.length === 0) {
        ui.notifications.warn("No tiles found in the specified directory.");
        return;
    }

    const filteredImages = terrainType === 'mixed' ? tileImages : tileImages.filter(img => img.toLowerCase().includes(terrainType.toLowerCase()));

    let createdTiles = await canvas.scene.createEmbeddedDocuments("Tile", placedTiles);
    placedTileIds = createdTiles.map(tile => tile.id);

    let updateData = createdTiles.map(tile => {
        const tileImage = filteredImages[Math.floor(Math.random() * filteredImages.length)];
        const texturePath = `${tileFolder}/${tileImage}`;

        return {
            _id: tile.id,
            texture: {
                src: texturePath,
                scaleX: 2,
                scaleY: 2,
                offsetX: 0,
                offsetY: 0
            },
            sort: tile.sort // Ensure the z-index is set in the update as well
        };
    });

    try {
        await canvas.scene.updateEmbeddedDocuments("Tile", updateData);
        console.log('All tiles placed and images assigned');
    } catch (error) {
        console.error("Error updating tile textures:", error);
    }

    // HexData objects are already created in createHexGridData
    await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);
}


// Function to update the display of a hex's data
function updateHexDisplay(hexId) {
    const hexGrid = canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    const hexData = hexGrid.find(hex => hex.id === hexId);

    const enemyList = document.getElementById(`hex-${hexId}-enemy-list`);
    enemyList.innerHTML = hexData.potentialEnemies.map(enemy =>
        `<div class="potential-enemy">${enemy.name}</div>`
    ).join('');

    const itemList = document.getElementById(`hex-${hexId}-item-list`);
    itemList.innerHTML = hexData.items.map(item =>
        `<div class="hex-item">${item.name}</div>`
    ).join('');

    const notesField = document.getElementById(`hex-${hexId}-notes`);
    notesField.value = hexData.notes;
}

// Function to create the UI for a hex
function createHexUI(hexId) {
    const hexElement = document.getElementById(`hex-${hexId}`);
    hexElement.innerHTML = `
        <div id="hex-${hexId}-drop-zone" class="hex-drop-zone">
            <h3>Enemies</h3>
            <div id="hex-${hexId}-enemy-list" class="enemy-list"></div>
            <h3>Items</h3>
            <div id="hex-${hexId}-item-list" class="item-list"></div>
        </div>
        <textarea id="hex-${hexId}-notes" placeholder="Enter notes here..."></textarea>
    `;

    setupHexDragDrop(hexId);
    updateHexDisplay(hexId);

    const notesField = document.getElementById(`hex-${hexId}-notes`);
    notesField.addEventListener('change', async () => {
        const hexGrid = await canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
        const hexData = hexGrid.find(hex => hex.id === hexId);
        hexData.updateNotes(notesField.value);
        await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);
    });
}

// Existing helper functions
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
                placedTileIds = [];
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
                <option value="fractalPerlin">Fractal Perlin</option>
                <option value="fractalSimplex">Fractal Simplex</option>
                <option value="fractalWorley">Fractal Worley</option>
            </select>
            <p>Fog density (0-1, higher values create denser fog):</p>
            <input type="number" id="fog-density" style="width: 100%;" step="0.01" min="0" max="1" value="0.5" />
            <p>Octaves (for fractal noise):</p>
            <input type="number" id="octaves" style="width: 100%;" min="1" max="10" value="6" />
            <p>Lacunarity (for fractal noise):</p>
            <input type="number" id="lacunarity" style="width: 100%;" step="0.1" min="1" value="2" />
            <p>Gain (for fractal noise):</p>
            <input type="number" id="gain" style="width: 100%;" step="0.1" min="0" max="1" value="0.5" />
        `,
        buttons: {
            generate: {
                label: "Generate",
                callback: (html) => {
                    const seed = parseInt(html.find("#seed-value").val(), 10);
                    const scale = parseFloat(html.find("#scale-input").val());
                    const noiseType = html.find("#noise-type").val();
                    const fogDensity = parseFloat(html.find("#fog-density").val());
                    const octaves = parseInt(html.find("#octaves").val(), 10);
                    const lacunarity = parseFloat(html.find("#lacunarity").val());
                    const gain = parseFloat(html.find("#gain").val());
                    if (isNaN(seed) || isNaN(scale) || isNaN(fogDensity) || isNaN(octaves) || isNaN(lacunarity) || isNaN(gain)) {
                        ui.notifications.error("Invalid input values.");
                        return;
                    }
                    if (fogDensity < 0 || fogDensity > 1) {
                        ui.notifications.error("Fog density must be between 0 and 1.");
                        return;
                    }
                    applyFogGeneration(seed, scale, noiseType, fogDensity, octaves, lacunarity, gain);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

function applyFogGeneration(seed, scale, noiseType, fogDensity, octaves, lacunarity, gain) {
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
                case 'fractalPerlin':
                    noiseValue = noiseModule.fractalPerlin(col * scale, row * scale, 0, octaves, lacunarity, gain);
                    break;
                case 'fractalSimplex':
                    noiseValue = noiseModule.fractalSimplex(col * scale, row * scale, 0, octaves, lacunarity, gain);
                    break;
                case 'fractalWorley':
                    noiseValue = noiseModule.fractalWorley(col * scale, row * scale, 0, octaves, lacunarity, gain);
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
        const data = template.document;

        if (data.x == null || data.y == null) {
            console.error("Template data missing x or y:", template);
            return;
        }

        let newX = data.x + dx * shiftDistance;
        let newY = data.y + dy * shiftDistance;

        newX += (Math.random() - 0.5) * gridSize;
        newY += (Math.random() - 0.5) * gridSize;

        fog.forEach(otherTemplate => {
            if (template !== otherTemplate) {
                const distance = Math.sqrt(Math.pow(newX - otherTemplate.document.x, 2) + Math.pow(newY - otherTemplate.document.y, 2));
                if (distance < gridSize) {
                    newX += Math.sign(newX - otherTemplate.document.x) * gridSize;
                    newY += Math.sign(newY - otherTemplate.document.y) * gridSize;
                }
            }
        });

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
            <option value="fractalPerlin">Fractal Perlin</option>
            <option value="fractalSimplex">Fractal Simplex</option>
            <option value="fractalWorley">Fractal Worley</option>
        </select>
        <p>Octaves (for fractal noise):</p>
        <input type="number" id="octaves" style="width: 100%;" min="1" max="10" value="6" />
        <p>Lacunarity (for fractal noise):</p>
        <input type="number" id="lacunarity" style="width: 100%;" step="0.1" min="1" value="2" />
        <p>Gain (for fractal noise):</p>
        <input type="number" id="gain" style="width: 100%;" step="0.1" min="0" max="1" value="0.5" />
        <p>
            <label>
                <input type="checkbox" id="normalize-noise" />
                Normalize noise values (stretch to full 0-1 range)
            </label>
        </p>
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
                    const octaves = parseInt(html.find("#octaves").val(), 10);
                    const lacunarity = parseFloat(html.find("#lacunarity").val());
                    const gain = parseFloat(html.find("#gain").val());
                    const normalizeNoise = html.find("#normalize-noise").prop("checked");
                    if (isNaN(seed) || isNaN(scale) || isNaN(octaves) || isNaN(lacunarity) || isNaN(gain)) {
                        ui.notifications.error("Invalid input values.");
                        return;
                    }
                    generateAndApplyNoiseToBackground(seed, scale, noiseType, octaves, lacunarity, gain, normalizeNoise);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

async function generateAndApplyNoiseToBackground(seed, scale, noiseType, octaves, lacunarity, gain, normalizeNoise) {
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
        applyElevationNoiseToImage(ctx, width, height, seed, scale, noiseType, octaves, lacunarity, gain, normalizeNoise);
        const texturePath = canvasEl.toDataURL('image/png');

        try {
            await scene.update({ 'background.src': texturePath });

            setTimeout(() => {
                canvas.draw();

                const refreshFlags = {
                    refreshLighting: true,
                    refreshVision: true,
                    refreshSounds: true
                };

                if (typeof canvas.perception.refreshOcclusion === 'function') {
                    refreshFlags.refreshOcclusion = true;
                } else if (typeof canvas.perception.refreshTiles === 'function') {
                    refreshFlags.refreshTiles = true;
                }

                canvas.perception.update(refreshFlags);

                if (canvas.tokens && typeof canvas.tokens.refresh === 'function') {
                    canvas.tokens.refresh();
                } else if (canvas.tokens && canvas.tokens.placeables) {
                    canvas.tokens.placeables.forEach(token => token.refresh());
                }

                Hooks.callAll('backgroundRefreshed', scene);
            }, 100);

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

function applyElevationNoiseToImage(ctx, width, height, seed, scale, noiseType, octaves, lacunarity, gain, normalizeNoise) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const noiseModule = new NoiseModule();
    noiseModule.setSeed(seed);

    let minNoiseValue = Infinity;
    let maxNoiseValue = -Infinity;
    const noiseValues = [];

    // First pass: generate noise values and find min/max if normalizing
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
                case 'fractalPerlin':
                    noiseValue = noiseModule.fractalPerlin(x * scale, y * scale, 0, octaves, lacunarity, gain);
                    break;
                case 'fractalSimplex':
                    noiseValue = noiseModule.fractalSimplex(x * scale, y * scale, 0, octaves, lacunarity, gain);
                    break;
                case 'fractalWorley':
                    noiseValue = noiseModule.fractalWorley(x * scale, y * scale, 0, octaves, lacunarity, gain);
                    break;
                case 'perlin':
                default:
                    noiseValue = (noiseModule.perlin(x * scale, y * scale) + 1) / 2;
            }

            if (normalizeNoise) {
                minNoiseValue = Math.min(minNoiseValue, noiseValue);
                maxNoiseValue = Math.max(maxNoiseValue, noiseValue);
            }
            noiseValues.push(noiseValue);
        }
    }

    // Normalize noise values if the option is selected
    if (normalizeNoise && minNoiseValue !== maxNoiseValue) {
        const range = maxNoiseValue - minNoiseValue;
        noiseValues.forEach((value, index) => {
            noiseValues[index] = (value - minNoiseValue) / range;
        });
    }

    // Second pass: apply noise values to image data
    for (let i = 0; i < noiseValues.length; i++) {
        const noiseValue = noiseValues[i];
        const color = getTerrainColor(noiseValue);
        const index = i * 4;
        data[index] = color.r;     // Red
        data[index + 1] = color.g; // Green
        data[index + 2] = color.b; // Blue
        data[index + 3] = 255;     // Alpha (fully opaque)
    }

    ctx.putImageData(imageData, 0, 0);
    console.log(`${noiseType} noise applied to image${normalizeNoise ? ' (normalized)' : ''}`);
}

function getTerrainColor(value) {
    const invertedValue = 1 - value;
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