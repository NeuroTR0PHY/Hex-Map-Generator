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
function noise(x, y, random) {
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

const p = new Array(512);
for (let i = 0; i < 256; i++) p[i] = p[i + 256] = Math.floor(Math.random() * 256);

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
        // Add your hex map clearing logic here
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

async function generateHexMap(html) {
    const width = html.find('input[name="map-width"]').val();
    const height = html.find('input[name="map-height"]').val();
    const hexSize = html.find('input[name="hex-size"]').val();
    const terrainType = html.find('select[name="terrain-type"]').val();

    console.log(`Generating hex map: ${width}x${height}, hex size: ${hexSize}, terrain: ${terrainType}`);

    // Fetch the tile assets from the module
    const tileFolder = "modules/procedural-hex-maps/tiles"; // Replace with actual path
    const tileImages = await fetchTileImages(tileFolder);
    console.log("Tile images fetched:", tileImages); // Log fetched tile images
    if (tileImages.length === 0) {
        ui.notifications.warn("No tiles found in the specified directory.");
        return;
    }

    // Generate hex map and place tiles
    const gridSize = canvas.scene.grid.size * 2;
    const rows = Math.ceil(canvas.dimensions.height / gridSize);
    const cols = Math.ceil(canvas.dimensions.width / gridSize);
    console.log(`Generating hex map for ${rows} rows and ${cols} columns`);

    let tilePromises = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * gridSize + gridSize / 2;
            const y = row * gridSize + gridSize / 2;
            const tileImage = tileImages[Math.floor(Math.random() * tileImages.length)];

            if (!tileImage) {
                console.warn("Selected tile image is empty.");
                continue;
            }

            const imgPath = `${tileFolder}/${tileImage}`;
            console.log(`Placing tile at ${x}, ${y} with image ${imgPath}`); // Log the image path

            tilePromises.push(canvas.scene.createEmbeddedDocuments("Tile", [{
                t: "tile",
                x: x,
                y: y,
                width: gridSize,
                height: gridSize,
                img: imgPath, // Use the full path for the image
                rotation: 0,
                z: 0,
                flags: { isHexTile: true }
            }]));

            console.log(`Tile creation parameters:`, {
                x,
                y,
                width: gridSize,
                height: gridSize,
                img: imgPath
            });
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
        const response = await fetch(`${folderPath}/images.json`); // Ensure the path to images.json is correct
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        console.log("Tile images data:", data); // Log the data fetched from images.json
        return data.tiles || [];
    } catch (error) {
        console.error("Error fetching tile images:", error);
        return [];
    }
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
                    applyFogGeneration(random);
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "generate"
    }).render(true);
}

function applyFogGeneration(random) {
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
            const noiseValue = noise(col * noiseScale, row * noiseScale, random);
            if (noiseValue > threshold) {
                const x = col * gridSize + gridSize / 2;
                const y = row * gridSize + gridSize / 2;
                fogTemplates.push({
                    t: "template",
                    x: x,
                    y: y,
                    width: templateSize,
                    height: templateSize,
                    fillColor: fogColor,
                    fillAlpha: fogOpacity,
                    angle: 0,
                    flags: { isFog: true }
                });
                console.log(`Adding fog template at ${x}, ${y}`);
            }
        }
    }

    // Create fog templates
    canvas.scene.createEmbeddedDocuments("MeasuredTemplate", fogTemplates)
        .then(() => ui.notifications.info("Fog generated"))
        .catch(error => console.error("Error generating fog:", error));
}

async function showShiftFogDialog() {
    const content = await renderTemplate("modules/procedural-hex-maps/templates/shift-fog-dialog.html", {});
    new Dialog({
        title: "Shift Fog",
        content: content,
        buttons: {
            shift: {
                icon: '<i class="fas fa-wind"></i>',
                label: "Shift Fog",
                callback: (html) => shiftFog(html)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "shift",
        render: html => console.log("Dialog rendered for shifting fog"),
        close: html => console.log("Dialog closed for shifting fog")
    }).render(true);
}

function shiftFog(html) {
    const direction = html.find('select[name="direction"]').val();
    const distance = parseInt(html.find('input[name="distance"]').val(), 10);
    const shiftX = distance * Math.cos(direction * Math.PI / 180);
    const shiftY = distance * Math.sin(direction * Math.PI / 180);
    const fogTemplates = canvas.templates.placeables.filter(t => t.document.flags?.isFog);

    if (fogTemplates.length === 0) {
        ui.notifications.warn("No fog templates found.");
        return;
    }

    const updates = fogTemplates.map(t => ({
        _id: t.id,
        x: t.data.x + shiftX,
        y: t.data.y + shiftY
    }));

    canvas.scene.updateEmbeddedDocuments("MeasuredTemplate", updates)
        .then(() => ui.notifications.info("Fog shifted"))
        .catch(error => console.error("Error shifting fog:", error));
}

function removeFog() {
    const fogTemplates = canvas.templates.placeables.filter(t => t.document.flags?.isFog);
    if (fogTemplates.length === 0) {
        ui.notifications.warn("No fog templates found.");
        return;
    }

    canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", fogTemplates.map(f => f.id))
        .then(() => ui.notifications.info("Fog removed"))
        .catch(error => console.error("Error removing fog:", error));
}
