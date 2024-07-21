// Simple seed-based random number generator
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
        this.state = seed;
    }

    random() {
        const x = Math.sin(this.state++) * 10000;
        return x - Math.floor(x);
    }

    setSeed(seed) {
        this.seed = seed;
        this.state = seed;
    }
}

// Perlin noise function with seeded random
function noise(x, y, random, p) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    x -= Math.floor(x);
    y -= Math.floor(y);
    const u = fade(x);
    const v = fade(y);
    const A = p[X] + Y, B = p[X + 1] + Y;
    return lerp(v, lerp(u, grad(p[A], x, y, random), grad(p[B], x - 1, y, random)),
        lerp(u, grad(p[A + 1], x, y - 1, random), grad(p[B + 1], x - 1, y - 1, random)));
}

function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(t, a, b) { return a + t * (b - a); }

function grad(hash, x, y, random) {
    const h = hash & 15;
    const grad = 1 + (h & 7);
    return ((h & 8) ? -grad : grad) * x + ((h & 4) ? -grad : grad) * y;
}

function initPermutationArray(random) {
    const p = new Array(512);
    const perm = Array.from({ length: 256 }, (_, i) => i);

    // Shuffle perm array with seeded random
    for (let i = perm.length - 1; i > 0; i--) {
        const j = Math.floor(random.random() * (i + 1));
        [perm[i], perm[j]] = [perm[j], perm[i]];
    }

    for (let i = 0; i < 256; i++) {
        p[i] = p[i + 256] = perm[i];
    }
    return p;
}

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
                name: "clear",
                title: "Clear Hex Map",
                icon: "fas fa-trash",
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
});

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

function generateHexMap(html) {
    const width = html.find('input[name="map-width"]').val();
    const height = html.find('input[name="map-height"]').val();
    const hexSize = html.find('input[name="hex-size"]').val();
    const terrainType = html.find('select[name="terrain-type"]').val();

    console.log(`Generating hex map: ${width}x${height}, hex size: ${hexSize}, terrain: ${terrainType}`);
    // Add your hex map generation logic here
}

function generateFog() {
    new Dialog({
        title: "Generate Fog",
        content: `<p>Enter a seed value for fog generation:</p><input type="number" id="seed-value" style="width: 100%;" />`,
        buttons: {
            generate: {
                label: "Generate",
                callback: (html) => {
                    const seed = parseInt(html.find("#seed-value").val(), 10);
                    const random = new SeededRandom(seed);
                    const p = initPermutationArray(random); // Initialize permutation array with seed
                    applyFogGeneration(random, p);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

function applyFogGeneration(random, p) {
    const scene = canvas.scene;
    const fogColor = 0xCCCCCC; // Fog gray color
    const fogOpacity = 0.5; // Adjust as needed
    const templateSize = 7; // Size in feet
    const noiseScale = 0.1;
    const threshold = 0.95; // Adjust to control fog density
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
    let fogTemplates = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const noiseValue = noise(col * noiseScale, row * noiseScale, random, p);
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

// Function to shift fog based on wind direction and intensity
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

// Array to keep track of placed tile IDs
let placedTileIds = [];

async function generateHexMap(html) {
    const width = parseInt(html.find('input[name="map-width"]').val());
    const height = parseInt(html.find('input[name="map-height"]').val());
    const hexSize = parseInt(html.find('input[name="hex-size"]').val());
    const terrainType = html.find('select[name="terrain-type"]').val();

    console.log(`Generating hex map: ${width}x${height}, hex size: ${hexSize}, terrain: ${terrainType}`);

    const tileFolder = "modules/procedural-hex-maps/tiles";
    const tileImages = await fetchTileImages(tileFolder);
    console.log("Tile images fetched:", tileImages);
    if (tileImages.length === 0) {
        ui.notifications.warn("No tiles found in the specified directory.");
        return;
    }

    const gridSize = canvas.scene.grid.size;
    const rows = Math.ceil(canvas.dimensions.height / (gridSize * 1.5));
    const cols = Math.ceil(canvas.dimensions.width / (gridSize * Math.sqrt(3)));

    let tilePromises = [];
    placedTileIds = []; // Reset placedTileIds

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * gridSize * Math.sqrt(3) + (row % 2) * (gridSize * Math.sqrt(3) / 2);
            const y = row * gridSize * 1.5;
            const tileImage = tileImages[Math.floor(Math.random() * tileImages.length)];

            if (!tileImage) {
                console.warn("Selected tile image is empty.");
                continue;
            }

            const imgPath = `${tileFolder}/${tileImage}`;
            console.log(`Placing tile at ${x}, ${y} with image ${imgPath}`);

            tilePromises.push(
                canvas.scene.createEmbeddedDocuments("Tile", [{
                    img: imgPath,
                    x: x,
                    y: y,
                    width: gridSize * 2,
                    height: gridSize * 2,
                    rotation: 0,
                    z: 0,
                    flags: { isHexTile: true }
                }])
                    .then(tiles => {
                        placedTileIds.push(...tiles.map(tile => tile.id));
                    })
                    .catch(error => {
                        console.error(`Error creating tile with image ${imgPath}:`, error);
                    })
            );
        }
    }

    // Wait for all tiles to be placed
    Promise.all(tilePromises)
        .then(() => {
            console.log('All tiles placed');
            ui.notifications.info("Hex map generated with tiles.");
        })
        .catch(error => {
            console.error("Error generating hex map:", error);
        });
}

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
