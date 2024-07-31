let hexInfoBoxCreated = false;

//let tileMappings = [];



Hooks.once('ready', () => {
    const factors = ['elevation', 'precipitation', 'temperature', 'windIntensity'];
    const sceneId = canvas.scene.id;

    // Register settings for environmental factors
    for (const factor of factors) {
        game.settings.register('procedural-hex-maps', `${sceneId}-${factor}`, {
            name: `Generated ${factor} data`,
            scope: 'world',
            config: false,
            default: null,
            type: Object
        });
    }

    for (const factor of factors) {
        game.settings.register('procedural-hex-maps', `temp-${factor}`, {
            name: `Temporary ${factor} data`,
            scope: 'client',
            config: false,
            default: null,
            type: Object
        });
    }

    createHexInfoBox();
    createHoverInfoBox();

    // Load tile mappings
    let tileMappings = game.settings.get('procedural-hex-maps', 'tileMappings') || [];

    // Load scene-specific tile mappings if available
    const sceneSpecificMappings = canvas.scene.getFlag("procedural-hex-maps", "tileMappings");
    if (sceneSpecificMappings) {
        tileMappings = sceneSpecificMappings;
    }

    game['procedural-hex-maps'] = game['procedural-hex-maps'] || {};
    game['procedural-hex-maps'].tileMappings = tileMappings;

    // If you want to ensure the global setting is updated with the scene-specific mappings
    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
});

Hooks.once('init', () => {


    game.settings.register('procedural-hex-maps', 'tileMappings', {
        name: "Tile Mappings",
        scope: "world",
        config: false,
        type: Object,
        default: []
    });

    const factors = ['elevation', 'precipitation', 'temperature', 'windIntensity'];
    for (const factor of factors) {
        game.settings.register('procedural-hex-maps', `${factor}-curve`, {
            name: `${factor.charAt(0).toUpperCase() + factor.slice(1)} Curve`,
            scope: 'world',
            config: false,
            type: Array,
            default: new Array(256).fill(0).map((_, i) => i)
        });
    }

    game.settings.register('procedural-hex-maps', 'savedConfigurations', {
        name: "Saved Configurations",
        scope: "world",
        config: false,
        type: Object,
        default: {}
    });
});

// Button controls
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
            {
                name: "toggleHexInfo",
                title: "Toggle Hex Info",
                icon: "fas fa-info-circle",
            },
            {
                name: "settings",
                title: "Hex Map Settings",
                icon: "fas fa-cog",
            }
        ],
        activeTool: "generate"
    });
});

let showHexInfo = false;

function createHexInfoBox() {
    if (hexInfoBoxCreated) {
        console.log('Hex info box already exists');
        return;
    }

    const hexInfoBox = document.createElement('div');
    hexInfoBox.id = 'hex-info-box';
    hexInfoBox.style.position = 'fixed';
    hexInfoBox.style.bottom = '120px';
    hexInfoBox.style.left = '50%';
    hexInfoBox.style.width = '60%';
    hexInfoBox.style.height = "20%";
    hexInfoBox.style.transform = 'translateX(-50%)';
    hexInfoBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    hexInfoBox.style.color = 'white';
    hexInfoBox.style.padding = '12px';
    hexInfoBox.style.borderRadius = '8px';
    hexInfoBox.style.fontSize = '14px';
    hexInfoBox.style.zIndex = '1000000';
    hexInfoBox.style.display = 'none';
    document.body.appendChild(hexInfoBox);
    console.log('Hex info box created:', hexInfoBox);

    hexInfoBoxCreated = true;
}

function createHoverInfoBox() {
    const hoverInfoBox = document.createElement('div');
    hoverInfoBox.id = 'hover-info-box';
    hoverInfoBox.style.position = 'fixed';
    hoverInfoBox.style.color = 'red';
    hoverInfoBox.style.fontSize = '14px';
    hoverInfoBox.style.background = 'rgba(255, 255, 255, 0.8)';
    hoverInfoBox.style.border = '1px solid red';
    hoverInfoBox.style.padding = '2px 5px';
    hoverInfoBox.style.pointerEvents = 'none';
    hoverInfoBox.style.zIndex = '10000';
    hoverInfoBox.style.display = 'none';
    document.body.appendChild(hoverInfoBox);
}


function attachHoverEventListeners(previewCanvas, noiseValues, width, params) {
    const hoverInfoBox = document.getElementById('hover-info-box');

    previewCanvas.addEventListener('mousemove', (event) => {
        const rect = previewCanvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) * (width / rect.width));
        const y = Math.floor((event.clientY - rect.top) * (width / rect.width));

        const index = y * width + x;
        const noiseValue = noiseValues[index];

        hoverInfoBox.style.left = `${event.clientX + 10}px`;
        hoverInfoBox.style.top = `${event.clientY + 10}px`;
        hoverInfoBox.style.display = 'block';
        hoverInfoBox.innerHTML = `Noise Value: ${noiseValue.toFixed(4)}`;
    });

    previewCanvas.addEventListener('mouseout', () => {
        hoverInfoBox.style.display = 'none';
    });
}


//createHexInfoBox();

// Function to update the hex info box content
function updateHexInfoBox(content) {
    if (!showHexInfo) {
        console.log('Hex info is toggled off, not updating box');
        return;
    }
    const hexInfoBox = document.getElementById('hex-info-box');
    console.log('Updating hex info box content:', content);
    console.log('Hex info box element:', hexInfoBox);
    hexInfoBox.innerHTML = content;
    hexInfoBox.style.display = content ? 'block' : 'none';
    console.log('Hex info box display style:', hexInfoBox.style.display);
}

// Function to toggle the display of the hex info box
function toggleHexInfoBox(show) {
    const hexInfoBox = document.getElementById('hex-info-box');
    if (!hexInfoBox) {
        console.error('Hex info box not found');
        return;
    }
    console.log('Toggling hex info box display:', show);
    hexInfoBox.style.display = show ? 'block' : 'none';
    if (!show) {
        hexInfoBox.innerHTML = ''; // Clear content when hiding
    }
}

// Function to handle the hover event
function handleHexHover(event) {
    console.log('Hover event triggered');

    const tile = event.currentTarget;
    console.log('Hovering over tile:', tile);

    const hexId = tile.document.flags.hexId;
    console.log('Hex ID:', hexId);

    if (!hexId) {
        console.warn('No hexId found for tile:', tile);
        return;
    }

    console.log('Hovering over hex:', hexId);

    const hexGrid = canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    if (!hexGrid) {
        console.warn('No hex grid data found in scene flags');
        return;
    }

    console.log('Hex grid data:', hexGrid);

    const hexData = hexGrid.find(hex => hex.id === parseInt(hexId));

    if (hexData) {
        console.log('Hex data found:', hexData);

        const hexInfoContent = `
        <div style="display: flex; flex-wrap: wrap;">
            <div style="width: 100%;"><strong>ID:</strong> ${hexData.id} x= ${hexData.x} y= ${hexData.y}</div>
            <div style="width: 100%;"><strong>Type:</strong> ${hexData.tileType} <strong>Modifier:</strong> ${hexData.tileModifier} <strong>Variant:</strong> ${hexData.tileVariant}</div>
            <div style="width: 100%;"><strong>Tile:</strong> ${hexData.fullTileName}</div>
            <div style="width: 50%;"><strong>Elevation:</strong> ${hexData.finalElevation.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Temperature:</strong> ${hexData.finalTemperature.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Humidity:</strong> ${hexData.humidity.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Precipitation:</strong> ${hexData.precipitation.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Wind Direction:</strong> ${hexData.windDirection}</div>
            <div style="width: 50%;"><strong>Wind Intensity:</strong> ${hexData.finalWindIntensity.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Vegetation Density:</strong> ${hexData.vegetationDensity.toFixed(2)}</div>
            <div style="width: 50%;"><strong>isWater:</strong> ${hexData.isWater}</div>
            <div style="width: 50%;"><strong>Water Depth:</strong> ${hexData.waterDepth.toFixed(2)}</div>
            <div style="width: 50%;"><strong>Moisture:</strong> ${hexData.finalMoisture.toFixed(2)}</div>
        </div>
            `;
        updateHexInfoBox(hexInfoContent);
    } else {
        console.warn('No hex data found for hexId:', hexId);
    }
}



// Add event listeners to the hex tiles
function addHexHoverListeners() {
    console.log('Adding or removing hover listeners based on showHexInfo:', showHexInfo);
    const hexTiles = canvas.tiles.placeables.filter(tile => tile.document.flags && tile.document.flags.hexTile);
    console.log('Found hex tiles:', hexTiles.length);
    hexTiles.forEach(tile => {
        if (showHexInfo) {
            console.log('Adding hover listener to tile:', tile.id);
            tile.on('pointerover', handleHexHover);
            tile.on('pointerout', handleHexHoverOut);
        } else {
            console.log('Removing hover listener from tile:', tile.id);
            tile.off('pointerover', handleHexHover);
            tile.off('pointerout', handleHexHoverOut);
        }
    });
}

function handleHexHoverOut(event) {
    updateHexInfoBox('');
}

Hooks.on('renderSceneControls', (app, html, data) => {
    console.log('SceneControls rendered');

    html.find('.control-tool[data-tool="generate"]').click(ev => {
        console.log('Generate Hex Map clicked');
        showEnhancedHexMapDialog();
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

    html.find('.control-tool[data-tool="toggleHexInfo"]').click(ev => {
        showHexInfo = !showHexInfo;
        console.log('showHexInfo toggled:', showHexInfo);
        toggleHexInfoBox(showHexInfo);
        addHexHoverListeners();
        if (!showHexInfo) {
            updateHexInfoBox(''); // Clear the content when hiding
        }
    });
    html.find('.control-tool[data-tool="settings"]').click(ev => {
        console.log('Hex Map Settings clicked');
        showHexMapSettings();
    });
});

// Call this function after the hex map is generated
function updateHexTilesWithIds() {
    console.log('Updating hex tiles with IDs');
    const hexGrid = canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    console.log('Hex grid data:', hexGrid);

    if (!hexGrid || !Array.isArray(hexGrid)) {
        console.error('Invalid hexGrid data:', hexGrid);
        return;
    }

    console.log('canvas.tiles.placeables:', canvas.tiles.placeables);

    canvas.tiles.placeables.forEach((tile, index) => {
        if (tile.document.flags.hexTile) {
            const hex = hexGrid[index];
            if (hex) {
                tile.document.updateSource({ flags: { ...tile.document.flags, hexId: hex.id } });
                console.log(`Assigning hex ID ${hex.id} to tile`, tile);
            } else {
                console.error(`No hex data found for tile at index ${index}`);
            }
        }
    });
}
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

//// Noise functions ////

class NoiseModule {
    constructor() {
        this.random = new SeededRandom(0);
        this.p = this.initPermutationArray();
    }

    setSeed(seed) {
        this.random.setSeed(seed);
        this.p = this.initPermutationArray();
    }

    initPermutationArray() {
        const p = new Array(512);
        const perm = Array.from({ length: 256 }, (_, i) => i);
        for (let i = perm.length - 1; i > 0; i--) {
            const j = Math.floor(this.random.random() * (i + 1));
            [perm[i], perm[j]] = [perm[j], perm[i]];
        }
        for (let i = 0; i < 256; i++) {
            p[i] = p[i + 256] = perm[i];
        }
        return p;
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    perlin(x, y, z = 0) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        const A = this.p[X] + Y, B = this.p[X + 1] + Y;
        const AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        const BA = this.p[B] + Z, BB = this.p[B + 1] + Z;

        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z),
            this.grad(this.p[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1, z),
                this.grad(this.p[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1),
                this.grad(this.p[BA + 1], x - 1, y, z - 1)),
                this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1),
                    this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))));
    }

    simplex(x, y, z = 0) {
        const F3 = 1.0 / 3.0;
        const G3 = 1.0 / 6.0;
        const s = (x + y + z) * F3;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        const k = Math.floor(z + s);
        const t = (i + j + k) * G3;
        const X0 = i - t;
        const Y0 = j - t;
        const Z0 = k - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        const z0 = z - Z0;

        let i1, j1, k1;
        let i2, j2, k2;
        if (x0 >= y0) {
            if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
            else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
            else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }

        const x1 = x0 - i1 + G3;
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2.0 * G3;
        const y2 = y0 - j2 + 2.0 * G3;
        const z2 = z0 - k2 + 2.0 * G3;
        const x3 = x0 - 1.0 + 3.0 * G3;
        const y3 = y0 - 1.0 + 3.0 * G3;
        const z3 = z0 - 1.0 + 3.0 * G3;

        const n0 = this.simplexGrad(i, j, k, x0, y0, z0);
        const n1 = this.simplexGrad(i + i1, j + j1, k + k1, x1, y1, z1);
        const n2 = this.simplexGrad(i + i2, j + j2, k + k2, x2, y2, z2);
        const n3 = this.simplexGrad(i + 1, j + 1, k + 1, x3, y3, z3);

        return 32.0 * (n0 + n1 + n2 + n3);
    }

    simplexGrad(i, j, k, x, y, z) {
        const t = 0.6 - x * x - y * y - z * z;
        if (t < 0) return 0;
        const gi = this.p[(i + this.p[(j + this.p[k & 255]) & 255]) & 255] % 12;
        return t * t * t * t * this.grad(gi, x, y, z);
    }

    worley(x, y, z = 0) {
        const xi = Math.floor(x);
        const yi = Math.floor(y);
        const zi = Math.floor(z);

        let closest = 1.0;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dz = -1; dz <= 1; dz++) {
                    const neighbor = [xi + dx, yi + dy, zi + dz];
                    const point = this.worleyPoint(neighbor[0], neighbor[1], neighbor[2]);
                    const dist = this.distance([x, y, z], [
                        neighbor[0] + point[0],
                        neighbor[1] + point[1],
                        neighbor[2] + point[2]
                    ]);
                    closest = Math.min(closest, dist);
                }
            }
        }

        return closest;
    }

    worleyPoint(x, y, z) {
        const n = x + y * 57 + z * 131;
        const seed = (n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff;
        return [
            this.random.random(),
            this.random.random(),
            this.random.random()
        ];
    }

    distance(a, b) {
        return Math.sqrt(
            (a[0] - b[0]) * (a[0] - b[0]) +
            (a[1] - b[1]) * (a[1] - b[1]) +
            (a[2] - b[2]) * (a[2] - b[2])
        );
    }

    fractal(x, y, z = 0, octaves = 6, lacunarity = 2, gain = 0.5, noiseType = 'perlin') {
        let amplitude = 1.0;
        let frequency = 1.0;
        let total = 0;
        let maxValue = 0;

        for (let i = 0; i < octaves; i++) {
            total += amplitude * this[noiseType](x * frequency, y * frequency, z * frequency);
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }

        return total / maxValue;
    }

    fractalPerlin(x, y, z = 0, octaves = 6, lacunarity = 2, gain = 0.5) {
        return this.fractal(x, y, z, octaves, lacunarity, gain, 'perlin');
    }

    fractalSimplex(x, y, z = 0, octaves = 6, lacunarity = 2, gain = 0.5) {
        return this.fractal(x, y, z, octaves, lacunarity, gain, 'simplex');
    }

    fractalWorley(x, y, z = 0, octaves = 6, lacunarity = 2, gain = 0.5) {
        return this.fractal(x, y, z, octaves, lacunarity, gain, 'worley');
    }
}

Handlebars.registerHelper('capitalize', function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
});

async function showEnhancedHexMapDialog() {
    const content = await renderTemplate("modules/procedural-hex-maps/templates/enhanced-hex-map-dialog.html", {
        environmentalFactors: ['elevation', 'precipitation', 'temperature', 'windIntensity'],
        noiseTypes: ['perlin', 'simplex', 'worley', 'fractalPerlin', 'fractalSimplex', 'fractalWorley']
    });

    new Dialog({
        title: "Generate Enhanced Hex Map",
        content: content,
        buttons: {
            generate: {
                icon: '<i class="fas fa-magic"></i>',
                label: "Generate",
                callback: (html) => generateEnhancedHexMap(html)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        render: (html) => {
            console.log("Full dialog HTML:", html.html());

            for (const factor of ['elevation', 'precipitation', 'temperature', 'windIntensity']) {
                const previewButton = html[0].querySelector(`#preview-${factor}`);
                const previewCanvas = html[0].querySelector(`#${factor}-preview`);

                // Create curve editor container if it doesn't exist
                let curveEditorContainer = html[0].querySelector(`#${factor}-curve-editor-container`);
                if (!curveEditorContainer) {
                    curveEditorContainer = document.createElement('div');
                    curveEditorContainer.id = `${factor}-curve-editor-container`;
                    curveEditorContainer.className = 'curve-editor';
                }

                // Create reset and preset buttons
                const resetButton = document.createElement('button');
                resetButton.textContent = 'Reset Curve';
                resetButton.className = 'reset-curve';
                resetButton.dataset.factor = factor;

                const bellCurveButton = document.createElement('button');
                bellCurveButton.textContent = 'Bell Curve';
                bellCurveButton.className = 'preset-curve';
                bellCurveButton.dataset.factor = factor;
                bellCurveButton.dataset.preset = 'bell';

                const sCurveButton = document.createElement('button');
                sCurveButton.textContent = 'S-Curve';
                sCurveButton.className = 'preset-curve';
                sCurveButton.dataset.factor = factor;
                sCurveButton.dataset.preset = 's';

                // Insert the curve editor container and buttons after the preview button but before the preview canvas
                if (previewButton && previewCanvas) {
                    curveEditorContainer.insertAdjacentElement('afterend', previewCanvas);
                    previewButton.insertAdjacentElement('afterend', sCurveButton);
                    sCurveButton.insertAdjacentElement('afterend', bellCurveButton);
                    bellCurveButton.insertAdjacentElement('afterend', resetButton);
                    resetButton.insertAdjacentElement('afterend', curveEditorContainer);
                }

                console.log(`${factor} elements:`, {
                    previewButton: previewButton ? 1 : 0,
                    previewCanvas: previewCanvas ? 1 : 0,
                    curveEditorContainer: curveEditorContainer ? 1 : 0,
                    curveEditorHTML: curveEditorContainer ? curveEditorContainer.outerHTML : 'Not found'
                });

                if (previewButton && previewCanvas && curveEditorContainer) {
                    previewButton.addEventListener('click', () => previewNoise(html, factor));
                    initializeCurveEditor(curveEditorContainer, factor);
                    resetButton.addEventListener('click', () => resetCurve(factor));
                    bellCurveButton.addEventListener('click', () => applyPresetCurve(factor, 'bell'));
                    sCurveButton.addEventListener('click', () => applyPresetCurve(factor, 's'));
                } else {
                    console.warn(`Preview button, canvas, or curve editor container for ${factor} not found`);
                }
            }
            html.find('#preview-moisture').on('click', () => previewMoisture(html));
            html.find('#preview-wind-direction').on('click', () => previewWindDirection(html));
            html.find('#preview-cloud-cover').on('click', () => previewCloudCover(html));

            // Add horizontal lines between sections
            for (let i = 0; i < html[0].children.length; i++) {
                if (i % 2 !== 0) {
                    const separator = document.createElement('div');
                    separator.style.gridColumn = '1 / -1';
                    separator.style.borderBottom = '1px solid #ccc';
                    separator.style.margin = '10px 0';
                    html[0].children[i].insertAdjacentElement('afterend', separator);
                }
            }
        },
        default: "generate",
        width: 800,
        height: 800
    }).render(true);
}



function initializeCurveEditor(container, factor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let curve = getCurve(factor);

    drawCurve(ctx, curve);

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    let isDrawing = false;

    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / rect.width * 256);
        const y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * 256);
        curve[x] = y;
        drawCurve(ctx, curve);
    }

    function stopDrawing() {
        isDrawing = false;
        saveCurve(factor, curve);

        // Trigger a preview update
        const previewButton = document.querySelector(`#preview-${factor}`);
        if (previewButton) {
            previewButton.click();
        }
    }
}

async function previewMoisture(html) {
    const hexGrid = await generateTemporaryHexGrid(html);
    generateMoistureMap(hexGrid);
    const previewCanvas = html.find('#moisture-preview')[0];
    renderPreview(previewCanvas, hexGrid, hex => hex.moisture);
}

async function previewWindDirection(html) {
    const hexGrid = await generateTemporaryHexGrid(html);
    generateWindPatterns(hexGrid);
    const previewCanvas = html.find('#wind-direction-preview')[0];
    renderPreview(previewCanvas, hexGrid, hex => hex.windDirection, true);
}

async function previewCloudCover(html) {
    const hexGrid = await generateTemporaryHexGrid(html);
    const previewCanvas = html.find('#cloud-cover-preview')[0];
    renderPreview(previewCanvas, hexGrid, hex => hex.cloudCover);
}

async function generateTemporaryHexGrid(html) {
    const width = 250;
    const height = 250;
    const hexSize = 10;
    const noiseData = {};
    const factors = ['elevation', 'precipitation', 'temperature', 'windIntensity'];

    for (const factor of factors) {
        const params = getNoiseParams(html, factor);
        const noiseModule = new NoiseModule();
        noiseModule.setSeed(params.seed);
        noiseData[factor] = generateUnifiedNoise(width, height, params, noiseModule);
    }

    const seed = parseInt(html.find('#main-seed').val()) || Math.floor(Math.random() * 1000000);

    // Load the current tile mappings
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", "currentTileMappingConfig");
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};
    let tileMapping;
    if (currentConfigName && savedConfigs[currentConfigName]) {
        tileMapping = JSON.parse(JSON.stringify(savedConfigs[currentConfigName]));
    } else {
        tileMapping = game.settings.get('procedural-hex-maps', 'tileMappings') || [];
    }

    tileMapping = updateTileMappingStructure(tileMapping);

    console.log("Updated tile mapping used for preview:", tileMapping);

    return createHexGridData(width, height, hexSize, noiseData, tileMapping, seed);
}

function renderPreview(canvas, hexGrid, valueFunction, isDirectional = false) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.createImageData(width, height);

    const values = hexGrid.map(valueFunction);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);

    for (let i = 0; i < hexGrid.length; i++) {
        const hex = hexGrid[i];
        const value = valueFunction(hex);
        const normalizedValue = (value - minValue) / (maxValue - minValue);

        let r, g, b;
        if (isDirectional) {
            const hue = (value / 8) * 360; // 8 directions, so we multiply by 360/8
            [r, g, b] = hslToRgb(hue / 360, 1, 0.5);
        } else {
            const color = Math.floor(normalizedValue * 255);
            r = g = b = color;
        }

        const index = (Math.floor(hex.y) * width + Math.floor(hex.x)) * 4;
        imageData.data[index] = r;
        imageData.data[index + 1] = g;
        imageData.data[index + 2] = b;
        imageData.data[index + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
}
function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}



async function previewNoise(html, factor) {
    try {
        const params = getNoiseParams(html, factor);
        const previewCanvas = html.find(`#${factor}-preview`)[0];
        if (!previewCanvas) {
            throw new Error(`Preview canvas for ${factor} not found`);
        }
        const ctx = previewCanvas.getContext('2d');
        const previewWidth = 250;
        const previewHeight = 250;
        previewCanvas.width = previewWidth;
        previewCanvas.height = previewHeight;

        console.log(`Preview dimensions for ${factor}: ${previewWidth}x${previewHeight}`);
        console.log(`Noise parameters for ${factor}:`, params);

        const noiseModule = new NoiseModule();
        noiseModule.setSeed(params.seed);

        let noiseData = generateUnifiedNoise(previewWidth, previewHeight, params, noiseModule);

        // Apply the most recent curve
        const curve = getCurve(factor);
        for (let i = 0; i < noiseData.length; i++) {
            const index = Math.floor(noiseData[i] * 25.5); // Map 0-10 to 0-255
            noiseData[i] = curve[index] / 25.5; // Map back to 0-10
        }

        // Render preview
        const imageData = ctx.createImageData(previewWidth, previewHeight);

        for (let y = 0; y < previewHeight; y++) {
            for (let x = 0; x < previewWidth; x++) {
                const noiseValue = noiseData[y * previewWidth + x];
                const color = Math.floor(255 * (1 - noiseValue / 10));
                const index = (y * previewWidth + x) * 4;
                imageData.data[index] = color;
                imageData.data[index + 1] = color;
                imageData.data[index + 2] = color;
                imageData.data[index + 3] = 255;
            }
        }

        ctx.putImageData(imageData, 0, 0);

        // Use noiseData for hover functionality
        attachHoverEventListeners(previewCanvas, noiseData, previewWidth, params);

        await game.settings.set('procedural-hex-maps', `temp-${factor}`, { noiseData, noiseParams: params, curve });

        console.log(`${factor} noise data and curve stored:`, { noiseData, curve });
    } catch (error) {
        console.error(`Error in previewNoise for ${factor}:`, error);
        ui.notifications.error(`Error generating preview for ${factor}: ${error.message}`);
    }
}

function displayErrorMessage(html, factor, errorMessage) {
    const errorContainer = html.find(`#${factor}-error`);
    if (errorContainer.length) {
        errorContainer.text(`Error: ${errorMessage}`).show();
    } else {
        console.error(`Error container for ${factor} not found`);
        ui.notifications.error(`Error generating preview for ${factor}: ${errorMessage}`);
    }
}









function generateNoiseValues(noiseModule, width, height, params) {
    const noiseValues = new Array(width * height);
    let minNoiseValue = Infinity;
    let maxNoiseValue = -Infinity;

    // Generate noise values and find min/max
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const noiseValue = generateEnvironmentalFactor(noiseModule, x, y, params);
            minNoiseValue = Math.min(minNoiseValue, noiseValue);
            maxNoiseValue = Math.max(maxNoiseValue, noiseValue);
            noiseValues[y * width + x] = noiseValue;
        }
    }

    console.log(`Noise Min Value: ${minNoiseValue}`);
    console.log(`Noise Max Value: ${maxNoiseValue}`);

    // Normalize noise values if required
    if (params.normalize) {
        for (let i = 0; i < noiseValues.length; i++) {
            noiseValues[i] = normalizeToRange(noiseValues[i], minNoiseValue, maxNoiseValue, params.min, params.max);
        }
    } else {
        // Apply user-specified scaling to the raw noise value
        for (let i = 0; i < noiseValues.length; i++) {
            noiseValues[i] *= 10; // Scale the raw noise value to the 0-10 range
            noiseValues[i] = Math.max(0, Math.min(10, noiseValues[i])); // Cap the noise value within the 0-10 range
        }
    }

    return noiseValues;
}

function generateUnifiedNoise(width, height, params, noiseModule) {
    const noiseValues = new Array(width * height);
    let minNoiseValue = Infinity;
    let maxNoiseValue = -Infinity;

    // Generate noise values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const noiseValue = generateEnvironmentalFactor(noiseModule, x, y, params);
            const index = y * width + x;
            noiseValues[index] = noiseValue;

            if (noiseValue < minNoiseValue) minNoiseValue = noiseValue;
            if (noiseValue > maxNoiseValue) maxNoiseValue = noiseValue;
        }
    }

    console.log(`Raw noise values - Min: ${minNoiseValue}, Max: ${maxNoiseValue}`);

    // Scale and normalize if needed
    for (let i = 0; i < noiseValues.length; i++) {
        if (params.normalize) {
            noiseValues[i] = ((noiseValues[i] - minNoiseValue) / (maxNoiseValue - minNoiseValue)) * (params.max - params.min) + params.min;
        } else {
            noiseValues[i] *= 10; // Scale to 0-10 range
        }
        // Cap values between 0 and 10
        noiseValues[i] = Math.max(0, Math.min(10, noiseValues[i]));
    }

    console.log(`Processed noise values - Min: ${Math.min(...noiseValues)}, Max: ${Math.max(...noiseValues)}`);

    return noiseValues;
}

function normalizeValue(value, min, max, newMin, newMax) {
    if (max === min) {
        return newMin; // Avoid division by zero
    }
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}
function normalizeValue(value, min, max, newMin, newMax) {
    if (max === min) {
        return newMin; // Avoid division by zero
    }
    return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

function renderNoiseValuesToCanvas(ctx, noiseValues, width, height, params) {
    const imageData = ctx.createImageData(width, height);

    // Render noise values to canvas
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const noiseValue = noiseValues[y * width + x];
            const color = Math.floor(255 * (1 - (noiseValue / 10))); // Adjust color to the capped value
            const index = (y * width + x) * 4;
            imageData.data[index] = color;     // Red
            imageData.data[index + 1] = color; // Green
            imageData.data[index + 2] = color; // Blue
            imageData.data[index + 3] = 255;   // Alpha (fully opaque)
        }
    }

    ctx.putImageData(imageData, 0, 0);
}


function normalizeToRange(value, min, max, newMin, newMax) {
    if (max === min) {
        return newMin; // Avoid division by zero, return newMin if range is zero
    }
    // Normalize the value to [0, 1] and then scale to the new range [newMin, newMax]
    let normalizedValue = (((value - min) / (max - min)) * (newMax - newMin)) + newMin;
    // Ensure the value is within the newMin and newMax bounds
    normalizedValue = Math.max(newMin, Math.min(newMax, normalizedValue));
    return normalizedValue;
}



function getNoiseParams(html, factor) {
    return {
        noiseType: html.find(`#${factor}-noiseType`).val(),
        scale: parseFloat(html.find(`#${factor}-scale`).val()),
        octaves: parseInt(html.find(`#${factor}-octaves`).val()),
        lacunarity: parseFloat(html.find(`#${factor}-lacunarity`).val()),
        gain: parseFloat(html.find(`#${factor}-gain`).val()),
        min: parseFloat(html.find(`#${factor}-min`).val()),
        max: parseFloat(html.find(`#${factor}-max`).val()),
        seed: html.find(`#${factor}-seed`).val() ? parseInt(html.find(`#${factor}-seed`).val()) : Math.floor(Math.random() * 1000000),
        normalize: html.find(`#${factor}-normalize`).is(':checked'),
        curve: getCurve(factor)
    };
}

async function generateEnhancedHexMap(html) {
    const sceneId = canvas.scene.id;
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const hexSize = parseInt(html.find('input[name="hex-size"]').val()) || canvas.grid.size;

    const factors = ['elevation', 'precipitation', 'temperature', 'windIntensity'];
    const noiseData = {};

    try {
        // Move noise data from temporary to generated storage
        for (const factor of factors) {
            const tempData = await game.settings.get('procedural-hex-maps', `temp-${factor}`);
            if (tempData) {
                await game.settings.set('procedural-hex-maps', `${sceneId}-${factor}`, tempData);
                await game.settings.set('procedural-hex-maps', `temp-${factor}`, null); // Clear temporary storage
            }
        }

        // Load noise data from generated files
        for (const factor of factors) {
            const loadedData = await loadNoiseData(sceneId, factor);
            if (loadedData) {
                noiseData[factor] = loadedData.noiseData;
                console.log(`Loaded noise data for ${factor}:`, noiseData[factor]);
            } else {
                throw new Error(`Failed to load noise data for ${factor}`);
            }
        }

        const seed = parseInt(html.find('#main-seed').val()) || Math.floor(Math.random() * 1000000);
        console.log(`Generating enhanced hex map: ${width}x${height}, hex size: ${hexSize}, seed: ${seed}`);

        // Load the latest land tile configuration
        const tileMapping = getCurrentLandTileConfiguration();

        console.log("Tile mapping used for generation:", tileMapping);

        const hexGrid = createHexGridData(width, height, hexSize, noiseData, tileMapping, seed);

        const placedTiles = hexGrid.map(hex => ({
            x: hex.x - (hexSize + 10) / 2 + (hex.selectedTile?.xOffset || 0),
            y: hex.y - hexSize / 2 + (hex.selectedTile?.yOffset || 0),
            width: hexSize + 10,
            height: hexSize,
            rotation: 0,
            sort: hex.staggeredRow,
            flags: { hexTile: true, hexId: hex.id },
            texture: {
                src: hex.tilePath,
                scaleX: 2,
                scaleY: 2,
                offsetX: 0,
                offsetY: 0
            }
        }));

        const createdTiles = await canvas.scene.createEmbeddedDocuments("Tile", placedTiles);
        placedTileIds = createdTiles.map(tile => tile.id);

        // Update the hexGridData with the correct tile IDs
        hexGrid.forEach((hex, index) => {
            hex.tileId = placedTileIds[index];
        });

        await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);

        addHexHoverListeners();
        console.log('All tiles placed and images assigned');
    } catch (error) {
        console.error('Error generating enhanced hex map:', error);
        ui.notifications.error(`Error generating hex map: ${error.message}`);
    }
}






function adjustNoiseData(noiseData, originalSize, newWidth, newHeight) {
    const adjustedData = new Array(newWidth * newHeight);
    const scaleX = newWidth / originalSize;
    const scaleY = newHeight / originalSize;

    for (let y = 0; y < newHeight; y++) {
        for (let x = 0; x < newWidth; x++) {
            const sourceX = Math.min(Math.floor(x / scaleX), originalSize - 1);
            const sourceY = Math.min(Math.floor(y / scaleY), originalSize - 1);
            adjustedData[y * newWidth + x] = noiseData[sourceY * originalSize + sourceX];
        }
    }

    return adjustedData;
}

function createHexGridData(width, height, hexSize, noiseData, tileMapping, seed) {
    const hexGrid = [];
    const hexWidth = hexSize + 10;
    const hexHeight = hexSize;
    const horizontalSpacing = hexWidth * 3 / 4;
    const verticalSpacing = hexHeight;

    const columns = Math.ceil(width / horizontalSpacing);
    const rows = Math.ceil(height / hexHeight);

    const random = new SeededRandom(seed);

    let id = 0;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const x = col * horizontalSpacing;
            const y = row * verticalSpacing + (col % 2) * (hexHeight / 2);

            const centerX = x + (hexWidth + 10) / 2;
            const centerY = y + hexHeight / 2;

            if (centerX < width && centerY < height) {
                let staggeredRow = (col % 2 === 0) ? row * 2 : row * 2 + 1;

                id++;
                const hexData = new HexData(id, centerX, centerY, col, row);
                hexData.setStaggeredRow(staggeredRow);

                // Use the adjusted noise data
                const noiseX = Math.floor(centerX / (width / 250));
                const noiseY = Math.floor(centerY / (height / 250));
                const index = noiseY * 250 + noiseX;

                hexData.baseElevation = noiseData.elevation[index] || 0;
                hexData.basePrecipitation = noiseData.precipitation[index] || 0;
                hexData.baseTemperature = noiseData.temperature[index] || 0;
                hexData.baseWindIntensity = noiseData.windIntensity[index] || 0;

                hexData.windDirection = Math.floor(random.random() * 8);
                hexData.updateEnvironment();



                // Add tags if needed (example)
                hexData.tags = ['forest', 'snow']; // Example tags, adjust as needed

                hexData.updateEnvironment();
                hexData.determineTile(tileMapping);

                // Apply offsets if they exist
                if (hexData.selectedTile) {
                    if (hexData.selectedTile.xOffset) {
                        hexData.x += hexData.selectedTile.xOffset;
                    }
                    if (hexData.selectedTile.yOffset) {
                        hexData.y += hexData.selectedTile.yOffset;
                    }
                }

                hexGrid.push(hexData);
            }
        }

    }
    // Generate wind patterns
    generateWindPatterns(hexGrid);

    // Generate moisture map
    generateMoistureMap(hexGrid);

    return hexGrid;
}

function generateWindPatterns(hexGrid) {
    for (let i = 0; i < hexGrid.length; i++) {
        const hex = hexGrid[i];
        const neighbors = getNeighbors(hex, hexGrid);

        // Find the neighbor with the highest temperature difference
        let maxTempDiff = 0;
        let targetDirection = hex.windDirection;

        neighbors.forEach((neighbor, index) => {
            const tempDiff = Math.abs(neighbor.temperature - hex.temperature);
            if (tempDiff > maxTempDiff) {
                maxTempDiff = tempDiff;
                targetDirection = index;
            }
        });

        // Wind can only change by 45 degrees (1 step) per hex
        const directionDiff = (targetDirection - hex.windDirection + 8) % 8;
        if (directionDiff > 4) {
            hex.windDirection = (hex.windDirection - 1 + 8) % 8;
        } else if (directionDiff < 4) {
            hex.windDirection = (hex.windDirection + 1) % 8;
        }

        // Adjust wind intensity based on temperature gradient and elevation
        hex.windIntensity = Math.min(10, hex.windIntensity + maxTempDiff * 0.5);
        hex.windIntensity = Math.max(0, hex.windIntensity - hex.elevation * 0.2);
    }
}

function generateMoistureMap(hexGrid) {
    const iterations = 5; // Number of rainfall simulations

    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < hexGrid.length; i++) {
            const hex = hexGrid[i];
            let rainAmount = hex.precipitation * 0.2; // 20% of precipitation becomes runoff

            while (rainAmount > 0) {
                hex.moisture += rainAmount * 0.1; // 10% of runoff is absorbed
                rainAmount *= 0.9; // Remaining 90% continues flowing

                const neighbors = getNeighbors(hex, hexGrid);
                const lowerNeighbors = neighbors.filter(n => n.elevation < hex.elevation);

                if (lowerNeighbors.length === 0) break; // Water pools here

                const nextHex = lowerNeighbors.reduce((a, b) => a.elevation < b.elevation ? a : b);
                hex = nextHex;
            }
        }
    }

    // Normalize moisture values
    const moistureValues = hexGrid.map(hex => hex.moisture);
    const minMoisture = Math.min(...moistureValues);
    const maxMoisture = Math.max(...moistureValues);

    hexGrid.forEach(hex => {
        hex.moisture = (hex.moisture - minMoisture) / (maxMoisture - minMoisture) * 10;
        hex.isWater = hex.moisture > 7.5; // Threshold for water tiles
    });
}


//Hex map tile generator functions


placedTileIds = [];

// Hex data structure
class HexData {
    constructor(id, x, y, col, row) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.col = col;
        this.row = row;
        this.staggeredRow = 0;

        this.tileType = '';
        this.tileModifier = '';
        this.tileVariant = '';
        this.fullTileName = '';

        // Base environmental characteristics
        this.baseElevation = 0;
        this.basePrecipitation = 0;
        this.baseTemperature = 0;
        this.baseWindIntensity = 0;

        // Current environmental characteristics (can be modified in real-time)
        this.elevation = 0;
        this.precipitation = 0;
        this.temperature = 0;
        this.windIntensity = 0;
        this.isWater = false;

        // Terrain characteristics
        this.humidity = 0;
        this.cloudCover = 0;
        this.windDirection = 0; // 0-7, representing 45-degree increments
        this.moisture = 0;

        // Biome and vegetation
        this.biomeType = '';
        this.vegetationType = '';
        this.vegetationDensity = 0;

        // Water features
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

        // Enemies, items, and notes
        this.potentialEnemies = [];
        this.items = [];
        this.notes = '';

        // Tile information
        this.tilePath = '';
        this.tileName = '';

        // Simulation history
        this.simulationHistory = [];

        // Custom properties
        this.customProperties = {};

        // Tags
        this.tags = [];

        // Selected tile (new property)
        this.selectedTile = null;

        this.finalElevation = 0;
        this.finalTemperature = 0;
        this.finalMoisture = 0;
        this.finalWindIntensity = 0;
    }

    setStaggeredRow(staggeredRow) {
        this.staggeredRow = staggeredRow;
    }

    capValue(value) {
        return Math.max(0, Math.min(10, value));
    }

    updateEnvironment(elevationMod = 0, precipitationMod = 0, temperatureMod = 0, windMod = 0) {
        // Calculate base values
        this.elevation = this.capValue(this.baseElevation + elevationMod);
        this.precipitation = this.capValue(this.basePrecipitation + precipitationMod);
        this.temperature = this.capValue(this.baseTemperature + temperatureMod);
        this.windIntensity = this.capValue(this.baseWindIntensity + windMod);

        // Adjust temperature based on elevation
        const tempAdjustment = this.elevation * 0.5;
        this.temperature = this.capValue(this.temperature - tempAdjustment);

        // Adjust precipitation based on elevation (orographic effect)
        this.precipitation = this.capValue(this.precipitation + this.elevation * 0.3);

        // Determine if the hex is water
        this.isWater = this.elevation <= 2;

        // Update derived characteristics
        this.updateDerivedCharacteristics();

        // Calculate final moisture
        this.calculateMoisture();

        // Calculate vegetation density
        this.calculateVegetationDensity();

        // Store final values
        this.finalElevation = this.elevation;
        this.finalTemperature = this.temperature;
        this.finalWindIntensity = this.windIntensity;
        this.finalMoisture = this.moisture;

        console.log(`Hex ${this.id} final environmental values:`, {
            elevation: this.finalElevation,
            temperature: this.finalTemperature,
            precipitation: this.precipitation,
            moisture: this.finalMoisture,
            windIntensity: this.finalWindIntensity,
            isWater: this.isWater,
            vegDensity: this.vegetationDensity
        });
    }

    updateDerivedCharacteristics() {
        this.humidity = this.capValue((this.precipitation * 2 + (10 - this.temperature)) / 3);
        this.cloudCover = this.capValue(this.precipitation * 0.8 + this.humidity * 0.2);
        this.determineBiomeType();
        this.updateMovementCost();
    }

    determineBiomeType() {
        if (this.isWater) {
            this.biomeType = this.elevation < 2 ? 'ocean' : 'lake';
        } else if (this.elevation > 8) {
            this.biomeType = this.temperature < 2 ? 'snowy_mountains' : 'mountains';
        } else if (this.temperature < 2) {
            this.biomeType = 'tundra';
        } else if (this.moisture < 2) {
            this.biomeType = 'desert';
        } else if (this.temperature > 8 && this.moisture > 8) {
            this.biomeType = 'tropical_rainforest';
        } else if (this.temperature > 8) {
            this.biomeType = 'savanna';
        } else if (this.moisture > 8) {
            this.biomeType = 'temperate_rainforest';
        } else if (this.temperature > 5 && this.moisture > 5) {
            this.biomeType = 'temperate_forest';
        } else {
            this.biomeType = 'grassland';
        }
        console.log(`Hex ${this.id} biome type determined: ${this.biomeType}`);
    }

    updateMovementCost() {
        this.movementCost = 1; // Base cost
        if (this.isWater) this.movementCost = this.waterDepth > 1 ? 2 : 1.5;
        else if (this.elevation > 8) this.movementCost = 3;
        else if (this.elevation > 6) this.movementCost = 2;
        else if (this.vegetationDensity > 7) this.movementCost = 1.5;
    }

    calculateVegetationDensity() {
        // Base calculation
        let density = (this.moisture * 0.4) + ((10 - this.elevation) * 0.2) + ((10 - this.windIntensity) * 0.2) + (this.temperature * 0.2);

        // Adjustments
        if (this.elevation > 8) density *= 0.5; // Reduce density at high elevations
        if (this.temperature < 2) density *= 0.3; // Reduce density in very cold areas
        if (this.temperature > 8) density *= 0.7; // Slightly reduce density in very hot areas
        if (this.moisture < 2) density *= 0.2; // Drastically reduce density in very dry areas

        // Cap the density between 0 and 10
        this.vegetationDensity = Math.max(0, Math.min(10, density));
    }

    calculateMoisture() {
        // Adjust moisture calculation to reduce overall levels
        this.moisture = this.capValue((this.precipitation * 0.6 + this.humidity * 0.4 + (10 - this.elevation) * 0.2) / 3);
        console.log(`Hex ${this.id} moisture calculated: ${this.moisture}`);
    }


    determineTile(tileMapping) {
        console.log(`determineTile called for hex ${this.id}`);
        console.log('Final Hex data:', {
            elevation: this.finalElevation,
            temperature: this.finalTemperature,
            moisture: this.finalMoisture,
            windIntensity: this.finalWindIntensity,
            vegetationDensity: this.vegetationDensity,
            waterDepth: this.waterDepth
        });

        const EPSILON = 0.001;

        const matchingMappings = tileMapping.filter(mapping => {
            const elevationMatch = this.finalElevation >= mapping.elevationLow - EPSILON && this.finalElevation <= mapping.elevationHigh + EPSILON;
            const temperatureMatch = this.finalTemperature >= mapping.temperatureLow - EPSILON && this.finalTemperature <= mapping.temperatureHigh + EPSILON;
            const moistureMatch = this.finalMoisture >= (mapping.moistureLow ?? 0) - EPSILON && this.finalMoisture <= (mapping.moistureHigh ?? 10) + EPSILON;
            const windMatch = this.finalWindIntensity >= mapping.windIntensityLow - EPSILON && this.finalWindIntensity <= mapping.windIntensityHigh + EPSILON;
            const vegetationMatch = this.vegetationDensity >= (mapping.vegetationDensityLow ?? 0) - EPSILON && this.vegetationDensity <= (mapping.vegetationDensityHigh ?? 10) + EPSILON;
            const waterDepthMatch = this.waterDepth >= (mapping.waterDepthLow ?? 0) - EPSILON && this.waterDepth <= (mapping.waterDepthHigh ?? 10) + EPSILON;

            console.log(`Mapping ${mapping.name}:`, {
                elevationMatch,
                temperatureMatch,
                moistureMatch,
                windMatch,
                vegetationMatch,
                waterDepthMatch,
                elevationRange: [mapping.elevationLow, mapping.elevationHigh],
                temperatureRange: [mapping.temperatureLow, mapping.temperatureHigh],
                moistureRange: [mapping.moistureLow, mapping.moistureHigh],
                windRange: [mapping.windIntensityLow, mapping.windIntensityHigh],
                vegetationRange: [mapping.vegetationDensityLow, mapping.vegetationDensityHigh],
                waterDepthRange: [mapping.waterDepthLow, mapping.waterDepthHigh]
            });

            return elevationMatch && temperatureMatch && moistureMatch && windMatch && vegetationMatch && waterDepthMatch;
        });

        console.log('Matching mappings:', matchingMappings);

        if (matchingMappings.length > 0) {
            const selectedMapping = matchingMappings[Math.floor(Math.random() * matchingMappings.length)];
            const selectedTile = selectedMapping.tiles[Math.floor(Math.random() * selectedMapping.tiles.length)];

            this.tilePath = selectedTile.tilePath;
            this.tileName = selectedTile.tileName;
            this.tileType = selectedMapping.name.split(' ')[0] || 'Default';
            this.tileModifier = selectedMapping.name.split(' ')[1] || '';
            this.tileVariant = '';
            this.fullTileName = selectedTile.tileName;
            this.selectedTile = selectedTile;

            console.log(`Selected tile for hex ${this.id}:`, this.tileName);
        } else {
            console.warn(`No matching tile found for hex ${this.id}. Using default tile.`);
            this.setDefaultTile();
        }
    }

    setDefaultTile() {
        this.tilePath = 'modules/procedural-hex-maps/tiles/Hex_-_Base_(blank).png';
        this.tileName = 'Default Blank Tile';
        this.tileType = 'Default';
        this.tileModifier = 'Blank';
        this.tileVariant = '';
        this.fullTileName = this.tileName;
        this.selectedTile = null;
    }

}

function getCurrentLandTileConfiguration() {
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", "currentLandTilemapConfig");
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    console.log("Current land config name:", currentConfigName);
    console.log("Saved configs:", savedConfigs);

    if (currentConfigName && savedConfigs[currentConfigName] && savedConfigs[currentConfigName].type === 'land') {
        console.log("Using saved land configuration:", savedConfigs[currentConfigName].mappings);
        return savedConfigs[currentConfigName].mappings;
    }

    // If no current configuration is set or it's invalid, return the default tileMappings
    const defaultMappings = game.settings.get('procedural-hex-maps', 'tileMappings') || [];
    console.log("Using default tile mappings:", defaultMappings);
    return defaultMappings;
}





// Function to create hex grid data
async function generateEnhancedHexMap(html) {
    const sceneId = canvas.scene.id;
    const width = canvas.dimensions.width;
    const height = canvas.dimensions.height;
    const hexSize = parseInt(html.find('input[name="hex-size"]').val()) || canvas.grid.size;

    const factors = ['elevation', 'precipitation', 'temperature', 'windIntensity'];
    const noiseData = {};

    try {
        // Move noise data from temporary to generated storage
        for (const factor of factors) {
            const tempData = await game.settings.get('procedural-hex-maps', `temp-${factor}`);
            if (tempData) {
                await game.settings.set('procedural-hex-maps', `${sceneId}-${factor}`, tempData);
                await game.settings.set('procedural-hex-maps', `temp-${factor}`, null); // Clear temporary storage
            }
        }

        // Load noise data from generated files
        for (const factor of factors) {
            const loadedData = await loadNoiseData(sceneId, factor);
            if (loadedData) {
                noiseData[factor] = loadedData.noiseData;
                console.log(`Loaded noise data for ${factor}:`, noiseData[factor]);
            } else {
                throw new Error(`Failed to load noise data for ${factor}`);
            }
        }

        const seed = parseInt(html.find('#main-seed').val()) || Math.floor(Math.random() * 1000000);
        console.log(`Generating enhanced hex map: ${width}x${height}, hex size: ${hexSize}, seed: ${seed}`);

        // Load the latest tile mappings
        const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", "currentTileMappingConfig");
        const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};
        let tileMapping;

        if (currentConfigName && savedConfigs[currentConfigName]) {
            tileMapping = JSON.parse(JSON.stringify(savedConfigs[currentConfigName]));
        } else {
            tileMapping = game.settings.get('procedural-hex-maps', 'tileMappings') || [];
        }

        console.log("Tile mapping used for generation:", tileMapping);

        const hexGrid = createHexGridData(width, height, hexSize, noiseData, tileMapping, seed);


        const placedTiles = hexGrid.map(hex => ({
            x: hex.x - (hexSize + 10) / 2 + (hex.selectedTile?.xOffset || 0),
            y: hex.y - hexSize / 2 + (hex.selectedTile?.yOffset || 0),
            width: hexSize + 10,
            height: hexSize,
            rotation: 0,
            sort: hex.staggeredRow,
            flags: { hexTile: true, hexId: hex.id },
            texture: {
                src: hex.tilePath,
                scaleX: 2,
                scaleY: 2,
                offsetX: 0,
                offsetY: 0
            }
        }));

        const createdTiles = await canvas.scene.createEmbeddedDocuments("Tile", placedTiles);
        placedTileIds = createdTiles.map(tile => tile.id);

        // Update the hexGridData with the correct tile IDs
        hexGrid.forEach((hex, index) => {
            hex.tileId = placedTileIds[index];
        });

        await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);

        addHexHoverListeners();
        console.log('All tiles placed and images assigned');
    } catch (error) {
        console.error('Error generating enhanced hex map:', error);
        ui.notifications.error(`Error generating hex map: ${error.message}`);
    }
}



// Function to update the display of a hex's data
async function updateHexMap(elevationMod = 0, precipitationMod = 0, temperatureMod = 0, windMod = 0, simulationName = 'update') {
    const hexGrid = await canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    const tileMapping = await loadTileMapping();

    hexGrid.forEach(hex => {
        hex.updateEnvironment(elevationMod, precipitationMod, temperatureMod, windMod);
        hex.determineTile(tileMapping);
        hex.recordSimulation(simulationName);
    });

    const updatedTiles = hexGrid.map(hex => ({
        _id: placedTileIds[hex.id - 1],
        texture: {
            src: `modules/procedural-hex-maps/tiles/${getTileImage(hex)}`
        }
    }));

    await canvas.scene.updateEmbeddedDocuments("Tile", updatedTiles);
    await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);

    console.log(`Hex map updated with simulation: ${simulationName}`);
}

function updateHexDisplay(hexId) {
    const hexGrid = canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    const hexData = hexGrid.find(hex => hex.id === hexId);

    const hexElement = document.getElementById(`hex-${hexId}`);
    if (!hexElement) return;

    // Update display elements based on hexData
    // This is a basic example, adjust according to your UI needs
    hexElement.innerHTML = `
            <p>Elevation: ${hexData.elevation}</p>
            <p>Temperature: ${hexData.temperature}</p>
            <p>Precipitation: ${hexData.precipitation}</p>
            <p>Wind Intensity: ${hexData.windIntensity}</p>
            <p>Biome: ${hexData.biomeType}</p>
        `;
}

// Helper function to get tile image
function getTileImage(hex, tileMapping) {
    if (!hex || !tileMapping || !Array.isArray(tileMapping) || tileMapping.length === 0) {
        console.error("Invalid hex or tileMapping data");
        return 'Hex_-_Base_(blank).png';
    }

    const matchingTiles = tileMapping.filter(tile =>
        hex.elevation >= tile.elevationLow && hex.elevation <= tile.elevationHigh &&
        hex.temperature >= tile.temperatureLow && hex.temperature <= tile.temperatureHigh &&
        hex.precipitation >= tile.precipitationLow && hex.precipitation <= tile.precipitationHigh &&
        hex.windIntensity >= tile.windLow && hex.windIntensity <= tile.windHigh &&
        tile.settlement === 0
    );

    if (matchingTiles.length > 0) {
        // Randomly select a tile from all matching tiles
        const selectedTile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
        console.log(`Matched tile for hex ${hex.id}:`, selectedTile.fullTileName);
        return selectedTile.fullTileName;
    } else {
        console.warn(`No matching tile found for hex ${hex.id}. Using default tile.`);
        return 'Hex_-_Base_(blank).png';
    }
}

function generateEnvironmentalFactor(noiseModule, x, y, params) {
    const scaledX = x * params.scale;
    const scaledY = y * params.scale;
    let noiseValue;

    try {
        switch (params.noiseType) {
            case 'simplex':
                noiseValue = (noiseModule.simplex(scaledX, scaledY) + 1) / 2;
                break;
            case 'worley':
                noiseValue = noiseModule.worley(scaledX, scaledY);
                break;
            case 'fractalPerlin':
                noiseValue = (noiseModule.fractalPerlin(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain) + 1) / 2;
                break;
            case 'fractalSimplex':
                noiseValue = (noiseModule.fractalSimplex(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain) + 1) / 2;
                break;
            case 'fractalWorley':
                noiseValue = noiseModule.fractalWorley(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain);
                break;
            case 'perlin':
            default:
                noiseValue = (noiseModule.perlin(scaledX, scaledY) + 1) / 2;
        }
    } catch (error) {
        console.error(`Error generating noise at (${x}, ${y}):`, error);
        noiseValue = 0; // Fallback value
    }

    if (isNaN(noiseValue)) {
        console.error(`NaN value generated at (${x}, ${y}) with type ${params.noiseType}`);
        return 0; // Fallback value
    }

    return noiseValue;
}



// Function to retrieve simulation results
function getSimulationResults(simulationName) {
    const hexGrid = canvas.scene.getFlag("procedural-hex-maps", "hexGridData");
    return hexGrid.map(hex => hex.getSimulationResult(simulationName));
}

//function to create new scene directory for generated noise if needed
async function ensureSceneDirectory(sceneId) {
    const baseDir = 'modules/procedural-hex-maps/generatednoise';
    const sceneDir = `${baseDir}/${sceneId}`;

    try {
        const baseDirExists = await FilePicker.browse('data', baseDir);
        if (!baseDirExists.dirs.includes(sceneDir)) {
            await FilePicker.createDirectory('data', sceneDir);
        }
    } catch (error) {
        // Create the directories if they don't exist
        await FilePicker.createDirectory('data', baseDir);
        await FilePicker.createDirectory('data', sceneDir);
    }

    return sceneDir;
}

async function saveNoiseData(sceneId, factor, noiseData, params) {
    const sceneDir = await ensureSceneDirectory(sceneId);
    const fileName = `${factor}_noise.json`;
    const filePath = `${sceneDir}/${fileName}`;
    const fileContent = JSON.stringify({ noiseData, params });

    try {
        await FilePicker.upload('data', sceneDir, new File([fileContent], fileName, { type: 'application/json' }));
        console.log(`Successfully saved noise data for ${factor} to ${filePath}`);
    } catch (error) {
        console.error(`Error saving noise data for ${factor}:`, error);
        throw error;
    }
}

async function loadNoiseData(sceneId, factor) {
    return await game.settings.get('procedural-hex-maps', `${sceneId}-${factor}`);
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


////Fog generator functions////
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

////Background painting functions///
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

function normalizeValue(value, min, max, newMin, newMax) {
    if (max === min) {
        return newMin; // Avoid division by zero, return newMin if range is zero
    }
    let normalizedValue = (((value - min) / (max - min)) * (newMax - newMin)) + newMin;
    // Ensure the value is within the newMin and newMax bounds
    normalizedValue = Math.max(newMin, Math.min(newMax, normalizedValue));
    return normalizedValue;
}

let tileMappings = [];

function showHexMapSettings() {
    let currentTilemapType = canvas.scene.getFlag("procedural-hex-maps", "currentTilemapType") || 'land';
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", `current${currentTilemapType.capitalize()}TilemapConfig`) || "";
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (savedConfigs[currentConfigName] && savedConfigs[currentConfigName].type === currentTilemapType) {
        tileMappings = Array.isArray(savedConfigs[currentConfigName].mappings)
            ? JSON.parse(JSON.stringify(savedConfigs[currentConfigName].mappings))
            : [];
    } else {
        tileMappings = [];
    }

    tileMappings = updateTileMappingStructure(tileMappings);

    console.log(`Tile mappings loaded for ${currentTilemapType}:`, JSON.parse(JSON.stringify(tileMappings)));

    const windowHeight = window.innerHeight;
    const dialogHeight = Math.floor(windowHeight * 0.8);

    const content = `
        <style>
            .hex-settings-dialog { 
                height: ${dialogHeight}px;
                display: flex;
                flex-direction: column;
            }
            .tilemap-type-buttons {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            .tilemap-type-button {
                flex: 1;
                margin: 0 5px;
                padding: 5px;
                background-color: #ddd;
                border: 1px solid #999;
                cursor: pointer;
            }
            .tilemap-type-button.active {
                background-color: #4CAF50;
                color: white;
            }
            #tile-mappings-list { flex-grow: 1; overflow-y: auto; }
            .dialog-buttons { margin-top: auto; }
        </style>
        <div class="hex-settings-dialog">
            <div class="tilemap-type-buttons">
                <button class="tilemap-type-button ${currentTilemapType === 'land' ? 'active' : ''}" data-type="land">Land Tilemaps</button>
                <button class="tilemap-type-button ${currentTilemapType === 'water' ? 'active' : ''}" data-type="water">Water Tilemaps</button>
                <button class="tilemap-type-button ${currentTilemapType === 'object' ? 'active' : ''}" data-type="object">Object Tilemaps</button>
            </div>
            <h2>Hex Map Tile Mappings</h2>
            <div id="tile-mappings-list"></div>
            <button id="add-mapping"><i class="fas fa-plus"></i> Add New Mapping</button>
            <button id="add-directory"><i class="fas fa-folder-plus"></i> Add Directory</button>
            <button id="clear-all-mappings"><i class="fas fa-trash-alt"></i> Clear All Mappings</button>
            <hr>
            <div>
                <label for="config-name">Configuration Name:</label>
                <input type="text" id="config-name">
                <button id="save-config">Save Configuration</button>
            </div>
            <div id="saved-configs"></div>
        </div>
    `;

    new Dialog({
        title: "Hex Map Settings",
        content: content,
        buttons: {
            close: {
                icon: '<i class="fas fa-times"></i>',
                label: "Close",
                callback: () => {
                    saveCurrentTileMappings(currentTilemapType);
                }
            }
        },
        render: (html) => {
            try {
                displayTileMappings(html, tileMappings);
                displaySavedConfigurations(html, currentTilemapType);

                html.find('#add-mapping').click(() => addNewMapping(tileMappings, currentTilemapType));
                html.find('#add-directory').click(() => addMappingsFromDirectory(tileMappings, currentTilemapType));
                html.find('#save-config').click(() => saveConfiguration(html, currentTilemapType));
                html.find('#clear-all-mappings').click(() => clearAllMappings(tileMappings, currentTilemapType));

                html.find('.tilemap-type-button').click((event) => {
                    const $button = $(event.currentTarget);
                    const newTilemapType = $button.data('type');
                    if (newTilemapType !== currentTilemapType) {
                        saveCurrentTileMappings(currentTilemapType);
                        currentTilemapType = newTilemapType;
                        canvas.scene.setFlag("procedural-hex-maps", "currentTilemapType", currentTilemapType);
                        html.find('.tilemap-type-button').removeClass('active');
                        $button.addClass('active');
                        loadTilemapType(html, currentTilemapType);
                    }
                });

                html.closest('.app').css('height', `${dialogHeight}px`);
                html.closest('.app').find('.dialog-buttons').css('height', '30px');
            } catch (error) {
                console.error("Error in dialog render:", error);
                ui.notifications.error("An error occurred while rendering the dialog. Check the console for details.");
            }
        },
        width: 600,
        height: dialogHeight,
    }, {
        resizable: false
    }).render(true);
}


function saveCurrentTileMappings(tilemapType) {
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`) || "";
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (currentConfigName) {
        savedConfigs[currentConfigName] = {
            type: tilemapType,
            mappings: tileMappings
        };
        game.settings.set('procedural-hex-maps', 'savedConfigurations', savedConfigs);
    }
}

function loadTilemapType(html, tilemapType) {
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`) || "";
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (currentConfigName && savedConfigs[currentConfigName] && savedConfigs[currentConfigName].type === tilemapType) {
        tileMappings = JSON.parse(JSON.stringify(savedConfigs[currentConfigName].mappings));
    } else {
        tileMappings = [];
    }

    tileMappings = updateTileMappingStructure(tileMappings);
    displayTileMappings(html, tileMappings);
    displaySavedConfigurations(html, tilemapType);
}


function displayTileMappings(html, tileMappings) {
    const list = html.find('#tile-mappings-list');
    list.empty();

    if (!Array.isArray(tileMappings)) {
        console.warn('tileMappings is not an array, initializing as empty array');
        tileMappings = [];
    }

    const fragment = document.createDocumentFragment();

    if (tileMappings.length > 0) {
        tileMappings.forEach((mapping, index) => {
            console.log(`Displaying mapping: ${mapping.name}`);
            console.log(`Wind Intensity: Low ${mapping.windIntensityLow}, High ${mapping.windIntensityHigh}`);

            const item = $(`
                <div class="mapping-item" data-index="${index}">
                    <div class="mapping-header">
                        <i class="fas fa-chevron-right"></i>
                        <input type="text" class="mapping-name" value="${mapping.name || `Mapping ${index + 1}`}" />
                        <div class="tile-container">
                            ${Array.isArray(mapping.tiles) ? mapping.tiles.map(tile => `
                                <img src="${tile.tilePath}" width="50" height="50" class="draggable-tile" draggable="true" data-path="${tile.tilePath}" data-name="${tile.tileName}">
                            `).join('') : ''}
                        </div>
                    </div>
                    <div class="mapping-content" style="display: none;">
                        <div class="range-slider">
                            <label>Elevation:</label>
                            <input type="range" class="elevation-low" min="0" max="10" step="0.1" value="${mapping.elevationLow.toFixed(1)}">
                            <input type="number" class="elevation-low-value" value="${mapping.elevationLow.toFixed(1)}" min="0" max="10" step="0.1">
                            <input type="range" class="elevation-high" min="0" max="10" step="0.1" value="${mapping.elevationHigh.toFixed(1)}">
                            <input type="number" class="elevation-high-value" value="${mapping.elevationHigh.toFixed(1)}" min="0" max="10" step="0.1">
                        </div>
                        <div class="range-slider">
                            <label>Moisture:</label>
                            <input type="range" class="moisture-low" min="0" max="10" step="0.1" value="${mapping.moistureLow.toFixed(1)}">
                            <input type="number" class="moisture-low-value" value="${mapping.moistureLow.toFixed(1)}" min="0" max="10" step="0.1">
                            <input type="range" class="moisture-high" min="0" max="10" step="0.1" value="${mapping.moistureHigh.toFixed(1)}">
                            <input type="number" class="moisture-high-value" value="${mapping.moistureHigh.toFixed(1)}" min="0" max="10" step="0.1">
                        </div>
                        <div class="range-slider">
                            <label>Temperature:</label>
                            <input type="range" class="temperature-low" min="0" max="10" step="0.1" value="${mapping.temperatureLow.toFixed(1)}">
                            <input type="number" class="temperature-low-value" value="${mapping.temperatureLow.toFixed(1)}" min="0" max="10" step="0.1">
                            <input type="range" class="temperature-high" min="0" max="10" step="0.1" value="${mapping.temperatureHigh.toFixed(1)}">
                            <input type="number" class="temperature-high-value" value="${mapping.temperatureHigh.toFixed(1)}" min="0" max="10" step="0.1">
                        </div>
                        <div class="range-slider">
                            <label>Wind Intensity:</label>
                            <input type="range" class="wind-intensity-low" min="0" max="10" step="0.1" value="${mapping.windIntensityLow !== undefined ? mapping.windIntensityLow.toFixed(1) : '0.0'}">
                            <input type="number" class="wind-intensity-low-value" value="${mapping.windIntensityLow !== undefined ? mapping.windIntensityLow.toFixed(1) : '0.0'}" min="0" max="10" step="0.1">
                            <input type="range" class="wind-intensity-high" min="0" max="10" step="0.1" value="${mapping.windIntensityHigh !== undefined ? mapping.windIntensityHigh.toFixed(1) : '10.0'}">
                            <input type="number" class="wind-intensity-high-value" value="${mapping.windIntensityHigh !== undefined ? mapping.windIntensityHigh.toFixed(1) : '10.0'}" min="0" max="10" step="0.1">
                        </div>
                        <div class="range-slider">
                            <label>Vegetation Density:</label>
                            <input type="range" class="vegetation-density-low" min="0" max="10" step="0.1" value="${mapping.vegetationDensityLow !== undefined ? mapping.vegetationDensityLow.toFixed(1) : '0.0'}">
                            <input type="number" class="vegetation-density-low-value" value="${mapping.vegetationDensityLow !== undefined ? mapping.vegetationDensityLow.toFixed(1) : '0.0'}" min="0" max="10" step="0.1">
                            <input type="range" class="vegetation-density-high" min="0" max="10" step="0.1" value="${mapping.vegetationDensityHigh !== undefined ? mapping.vegetationDensityHigh.toFixed(1) : '10.0'}">
                            <input type="number" class="vegetation-density-high-value" value="${mapping.vegetationDensityHigh !== undefined ? mapping.vegetationDensityHigh.toFixed(1) : '10.0'}" min="0" max="10" step="0.1">
                        </div>
                        <div class="range-slider">
                            <label>Water Depth:</label>
                            <input type="range" class="water-depth-low" min="0" max="10" step="0.1" value="${mapping.waterDepthLow !== undefined ? mapping.waterDepthLow.toFixed(1) : '0.0'}">
                            <input type="number" class="water-depth-low-value" value="${mapping.waterDepthLow !== undefined ? mapping.waterDepthLow.toFixed(1) : '0.0'}" min="0" max="10" step="0.1">
                            <input type="range" class="water-depth-high" min="0" max="10" step="0.1" value="${mapping.waterDepthHigh !== undefined ? mapping.waterDepthHigh.toFixed(1) : '10.0'}">
                            <input type="number" class="water-depth-high-value" value="${mapping.waterDepthHigh !== undefined ? mapping.waterDepthHigh.toFixed(1) : '10.0'}" min="0" max="10" step="0.1">
                        </div>
                        <div class="tag-list">
                            <label>Tags:</label>
                            <input type="text" class="mapping-tags" value="${mapping.tags ? mapping.tags.join(', ') : ''}" placeholder="Enter tags separated by commas">
                        </div>
                        ${mapping.tiles.map((tile, tileIndex) => `
                            <div class="tile-offset">
                                <label>Tile ${tileIndex + 1} Offset:</label>
                                <input type="number" class="x-offset" value="${tile.xOffset || 0}" data-tile-index="${tileIndex}"> X
                                <input type="number" class="y-offset" value="${tile.yOffset || 0}" data-tile-index="${tileIndex}"> Y
                            </div>
                        `).join('')}
                        <button class="delete-mapping-button">Delete Mapping</button>
                    </div>
                </div>
            `)[0];

            fragment.appendChild(item);
        });
    } else {
        fragment.appendChild($('<p>No tile mappings available. Add some using the buttons below.</p>')[0]);
    }

    list.append(fragment);

    // Add event listeners
    list.find('input[type="range"], input[type="number"]').on('input', updateRangeValue);
    list.find('input[type="range"], input[type="number"]').on('change', event => updateMapping(event, tileMappings));
    list.find('.mapping-header').click(toggleMappingContent);
    list.find('.mapping-name').on('change', event => updateMappingName(event, tileMappings));
    list.find('.mapping-tags').on('change', event => updateMappingTags(event, tileMappings));
    list.find('.x-offset, .y-offset').on('change', event => updateTileOffset(event, tileMappings));
    list.find('.delete-mapping-button').click(event => deleteMapping(event, tileMappings));

    // Add tooltip functionality
    list.find('.draggable-tile').on('mouseover', showTileTooltip);
    list.find('.draggable-tile').on('mouseout', hideTileTooltip);
    list.find('.draggable-tile').on('mousemove', updateTooltipPosition);

    // Add drag and drop functionality
    list.find('.draggable-tile').on('dragstart', handleDragStart);
    list.find('.draggable-tile').on('dragend', handleDragEnd);
    list.find('.mapping-item').on('dragover', handleDragOver);
    list.find('.mapping-item').on('dragleave', handleDragLeave);
    list.find('.mapping-item').on('drop', event => handleDrop(event, tileMappings));
}



function updateTileMappingStructure(tileMappings) {
    if (!Array.isArray(tileMappings)) {
        console.warn('tileMappings is not an array, initializing as empty array');
        return [];
    }
    return tileMappings.map(mapping => {
        const updatedMapping = {
            name: mapping.name || 'Unnamed Mapping',
            tiles: Array.isArray(mapping.tiles) ? mapping.tiles : [],
            elevationLow: mapping.elevationLow !== undefined ? mapping.elevationLow : 0,
            elevationHigh: mapping.elevationHigh !== undefined ? mapping.elevationHigh : 10,
            temperatureLow: mapping.temperatureLow !== undefined ? mapping.temperatureLow : 0,
            temperatureHigh: mapping.temperatureHigh !== undefined ? mapping.temperatureHigh : 10,
            moistureLow: mapping.moistureLow !== undefined ? mapping.moistureLow : 0,
            moistureHigh: mapping.moistureHigh !== undefined ? mapping.moistureHigh : 10,
            windIntensityLow: mapping.windIntensityLow !== undefined ? mapping.windIntensityLow : 0,
            windIntensityHigh: mapping.windIntensityHigh !== undefined ? mapping.windIntensityHigh : 10,
            vegetationDensityLow: mapping.vegetationDensityLow !== undefined ? mapping.vegetationDensityLow : 0,
            vegetationDensityHigh: mapping.vegetationDensityHigh !== undefined ? mapping.vegetationDensityHigh : 10,
            waterDepthLow: mapping.waterDepthLow !== undefined ? mapping.waterDepthLow : 0,
            waterDepthHigh: mapping.waterDepthHigh !== undefined ? mapping.waterDepthHigh : 10,
            tags: Array.isArray(mapping.tags) ? mapping.tags : []
        };
        console.log(`Mapping "${updatedMapping.name}" updated`);
        return updatedMapping;
    });
}

function updateTileOffset(event, tileMappings) {
    const $input = $(event.currentTarget);
    const mappingIndex = $input.closest('.mapping-item').data('index');
    const tileIndex = $input.data('tile-index');
    const offsetType = $input.hasClass('x-offset') ? 'xOffset' : 'yOffset';
    const offsetValue = parseInt($input.val()) || 0;

    tileMappings[mappingIndex].tiles[tileIndex][offsetType] = offsetValue;
    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
}

function updateMappingTags(event, tileMappings) {
    const $input = $(event.currentTarget);
    const index = $input.closest('.mapping-item').data('index');
    tileMappings[index].tags = $input.val().split(',').map(tag => tag.trim());
    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);

}

function toggleMappingContent(event) {
    const $header = $(event.currentTarget);
    const $item = $header.closest('.mapping-item');
    const $content = $item.find('.mapping-content');
    const $icon = $header.find('i:first-child');

    $content.slideToggle(200, function () {
        if ($content.is(':visible')) {
            $icon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
            $item.addClass('expanded');
        } else {
            $icon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
            $item.removeClass('expanded');
        }
    });
}

let activeTooltip = null;

function showTileTooltip(event) {
    const tile = event.currentTarget;
    const tileName = tile.dataset.name;

    if (activeTooltip) {
        activeTooltip.remove();
    }

    activeTooltip = document.createElement('div');
    activeTooltip.className = 'tile-tooltip';
    activeTooltip.textContent = tileName;
    document.body.appendChild(activeTooltip);

    updateTooltipPosition(event);
}

function hideTileTooltip() {
    if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
    }
}

function updateTooltipPosition(event) {
    if (activeTooltip) {
        const offset = 10; // Distance from the cursor
        activeTooltip.style.left = `${event.clientX + offset}px`;
        activeTooltip.style.top = `${event.clientY + offset}px`;
    }
}


function toggleMappingContent(event) {
    const $header = $(event.currentTarget);
    const $content = $header.next('.mapping-content');
    const $icon = $header.find('i');

    $content.slideToggle(200, function () {
        if ($content.is(':visible')) {
            $icon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
        } else {
            $icon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
        }
    });
}


function updateRangeValue(event) {
    const $input = $(event.currentTarget);
    const value = parseFloat($input.val()).toFixed(1);
    const isRange = $input.attr('type') === 'range';
    const pair = isRange ? $input.next('input') : $input.prev('input');

    if (isRange) {
        pair.val(value);
    } else {
        pair.val(value);
        $input.val(value);
    }
}

function updateMapping(event) {
    const $input = $(event.currentTarget);
    const index = $input.closest('.mapping-item').data('index');
    const mapping = tileMappings[index];
    const field = $input.attr('class');

    const newValue = parseFloat($input.val());

    console.log(`Updating ${field} for "${mapping.name}" from ${mapping[field]} to ${newValue}`);

    if (field.includes('vegetation-density')) {
        const property = field.includes('-low') ? 'vegetationDensityLow' : 'vegetationDensityHigh';
        mapping[property] = newValue;
    } else if (field.includes('water-depth')) {
        const property = field.includes('-low') ? 'waterDepthLow' : 'waterDepthHigh';
        mapping[property] = newValue;
    } else if (field === 'wind-intensity-low') {
        mapping.windIntensityLow = newValue;
    } else if (field === 'wind-intensity-high') {
        mapping.windIntensityHigh = newValue;
    } else if (field === 'biomeTags') {
        mapping.biomeTags = $input.val().split(',').map(tag => tag.trim());
    } else {
        const propertyName = field.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        mapping[propertyName] = newValue;
    }

    console.log(`Updated mapping:`, JSON.parse(JSON.stringify(mapping)));

    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
}

function updateMappingName(event) {
    const $input = $(event.currentTarget);
    const index = $input.closest('.mapping-item').data('index');
    tileMappings[index].name = $input.val();
    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
}


function addNewMapping(tileMappings, tilemapType) {
    new FilePicker({
        type: "image",
        current: "modules/procedural-hex-maps/tiles",
        callback: (path) => {
            const newMapping = {
                name: `Mapping ${tileMappings.length + 1}`,
                tiles: [{
                    tilePath: path,
                    tileName: path.split('/').pop(),
                    xOffset: 0,
                    yOffset: 0
                }],
                elevationLow: 0.0,
                elevationHigh: 10.0,
                moistureLow: 0.0,
                moistureHigh: 10.0,
                temperatureLow: 0.0,
                temperatureHigh: 10.0,
                windIntensityLow: 0.0,
                windIntensityHigh: 10.0,
                vegetationDensityLow: 0.0,
                vegetationDensityHigh: 10.0,
                waterDepthLow: 0.0,
                waterDepthHigh: 10.0,
                tags: []
            };
            tileMappings.push(newMapping);
            saveCurrentTileMappings(tilemapType);
            displayTileMappings($('.dialog-content'), tileMappings);
        }
    }).render(true);
}

function getNeighbors(hex, hexGrid) {
    const directions = [
        { dx: 1, dy: 0 },    // East
        { dx: 0.5, dy: -0.75 }, // Northeast
        { dx: -0.5, dy: -0.75 }, // Northwest
        { dx: -1, dy: 0 },   // West
        { dx: -0.5, dy: 0.75 }, // Southwest
        { dx: 0.5, dy: 0.75 }  // Southeast
    ];

    return directions.map(dir => {
        const neighborX = hex.x + dir.dx * (hex.col % 2 === 0 ? 1 : -1);
        const neighborY = hex.y + dir.dy;
        return hexGrid.find(h => Math.abs(h.x - neighborX) < 0.1 && Math.abs(h.y - neighborY) < 0.1);
    }).filter(Boolean);
}




function addMappingsFromDirectory(tileMappings, tilemapType) {
    new FilePicker({
        type: "folder",
        callback: async (path) => {
            try {
                const response = await FilePicker.browse("data", path);
                const imageFiles = response.files.filter(file =>
                    file.toLowerCase().endsWith('.png') ||
                    file.toLowerCase().endsWith('.jpg') ||
                    file.toLowerCase().endsWith('.jpeg')
                );

                // Ensure tileMappings is an array
                if (!Array.isArray(tileMappings)) {
                    tileMappings = [];
                }

                imageFiles.forEach(imagePath => {
                    const newMapping = {
                        name: `Mapping ${tileMappings.length + 1}`,
                        tiles: [{
                            tilePath: imagePath,
                            tileName: imagePath.split('/').pop(),
                            xOffset: 0,
                            yOffset: 0
                        }],
                        elevationLow: 0.0,
                        elevationHigh: 10.0,
                        moistureLow: 0.0,
                        moistureHigh: 10.0,
                        temperatureLow: 0.0,
                        temperatureHigh: 10.0,
                        windIntensityLow: 0.0,
                        windIntensityHigh: 10.0,
                        vegetationDensityLow: 0.0,
                        vegetationDensityHigh: 10.0,
                        waterDepthLow: 0.0,
                        waterDepthHigh: 10.0,
                        tags: []
                    };
                    tileMappings.push(newMapping);
                });

                saveCurrentTileMappings(tilemapType);
                displayTileMappings($('.dialog-content'), tileMappings);
                displaySavedConfigurations($('.dialog-content'), tilemapType);
                ui.notifications.info(`Added ${imageFiles.length} new tile mappings.`);
            } catch (error) {
                console.error("Error adding mappings from directory:", error);
                ui.notifications.error("Error adding mappings from directory.");
            }
        }
    }).render(true);
}


function deleteMapping(event, tileMappings) {
    const $mappingItem = $(event.currentTarget).closest('.mapping-item');
    const index = $mappingItem.data('index');

    new Dialog({
        title: "Confirm Deletion",
        content: `<p>Are you sure you want to delete this mapping?</p>`,
        buttons: {
            yes: {
                icon: '<i class="fas fa-check"></i>',
                label: "Yes",
                callback: () => {
                    tileMappings.splice(index, 1);
                    $mappingItem.remove();
                    // Update other mappings' indices
                    $('.mapping-item').each((i, el) => {
                        $(el).data('index', i);
                    });
                    // Save the updated tileMappings
                    saveCurrentTileMappings(getCurrentTilemapType());
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "No"
            }
        },
        default: "no"
    }).render(true);
}

function getCurrentTilemapType() {
    return canvas.scene.getFlag("procedural-hex-maps", "currentTilemapType") || 'land';
}

function clearAllMappings(tileMappings) {
    new Dialog({
        title: "Clear All Mappings",
        content: `<p>Are you sure you want to clear all ${tileMappings.length} tile mappings? This action cannot be undone.</p>`,
        buttons: {
            yes: {
                icon: '<i class="fas fa-trash"></i>',
                label: "Yes, Clear All",
                callback: () => {
                    tileMappings.length = 0; // This clears the array
                    game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
                    displayTileMappings($('.dialog-content'), tileMappings);
                    ui.notifications.info("All tile mappings have been cleared.");
                }
            },
            no: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel"
            }
        },
        default: "no"
    }).render(true);
}

function loadTilemapType(html, tilemapType) {
    const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`) || "";
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (currentConfigName && savedConfigs[currentConfigName] && savedConfigs[currentConfigName].type === tilemapType) {
        tileMappings = Array.isArray(savedConfigs[currentConfigName].mappings)
            ? JSON.parse(JSON.stringify(savedConfigs[currentConfigName].mappings))
            : [];
    } else {
        tileMappings = [];
    }

    tileMappings = updateTileMappingStructure(tileMappings);
    displayTileMappings(html, tileMappings);
    displaySavedConfigurations(html, tilemapType);
}



function saveConfiguration(html, tilemapType) {
    const configName = html.find('#config-name').val();
    if (!configName) {
        ui.notifications.error("Please enter a name for the configuration.");
        return;
    }
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    savedConfigs[configName] = {
        type: tilemapType,
        mappings: JSON.parse(JSON.stringify(tileMappings))
    };
    game.settings.set('procedural-hex-maps', 'savedConfigurations', savedConfigs);

    canvas.scene.setFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`, configName);

    if (tilemapType === 'land') {
        // Update the global tileMappings setting with the new land configuration
        game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
    }

    console.log(`Saved ${tilemapType} configuration:`, configName);
    console.log("Updated saved configs:", savedConfigs);

    displaySavedConfigurations(html, tilemapType);
    displayTileMappings(html, tileMappings);
    ui.notifications.info(`Configuration "${configName}" saved successfully for ${tilemapType} tilemaps.`);
}


function displaySavedConfigurations(html, tilemapType) {
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};
    const container = html.find('#saved-configs');
    container.empty();

    const relevantConfigs = Object.keys(savedConfigs).filter(configName =>
        savedConfigs[configName].type === tilemapType
    );

    if (relevantConfigs.length === 0) {
        container.append('<p>No saved configurations for this tilemap type.</p>');
    } else {
        relevantConfigs.forEach(configName => {
            const configItem = $(`
                <div>
                    <span>${configName}</span>
                    <button class="load-config" data-name="${configName}" data-type="${tilemapType}">Load</button>
                    <button class="delete-config" data-name="${configName}">Delete</button>
                </div>
            `);
            container.append(configItem);
        });
    }

    html.find('.load-config').click(loadConfiguration);
    html.find('.delete-config').click(deleteConfiguration);
}


function loadConfiguration(event) {
    const configName = $(event.currentTarget).data('name');
    const tilemapType = $(event.currentTarget).data('type');
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (savedConfigs[configName] && savedConfigs[configName].type === tilemapType) {
        tileMappings = Array.isArray(savedConfigs[configName].mappings)
            ? JSON.parse(JSON.stringify(savedConfigs[configName].mappings))
            : [];

        console.log(`Loaded ${tilemapType} configuration:`, tileMappings);

        canvas.scene.setFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`, configName);

        if (tilemapType === 'land') {
            // Update the global tileMappings setting with the loaded land configuration
            game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
        }

        const dialogContent = $(event.currentTarget).closest('.hex-settings-dialog');
        displayTileMappings(dialogContent, tileMappings);

        ui.notifications.info(`Configuration "${configName}" loaded successfully for ${tilemapType} tilemaps.`);
    } else {
        ui.notifications.error(`Configuration "${configName}" not found or doesn't match the current tilemap type.`);
    }
}

function deleteConfiguration(event) {
    const configName = $(event.currentTarget).data('name');
    const tilemapType = $(event.currentTarget).closest('.hex-settings-dialog').find('.tilemap-type-button.active').data('type');
    const savedConfigs = game.settings.get('procedural-hex-maps', 'savedConfigurations') || {};

    if (savedConfigs[configName]) {
        delete savedConfigs[configName];
        game.settings.set('procedural-hex-maps', 'savedConfigurations', savedConfigs);

        // If the deleted config was the current one, clear the current config flag
        const currentConfigName = canvas.scene.getFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`);
        if (currentConfigName === configName) {
            canvas.scene.unsetFlag("procedural-hex-maps", `current${tilemapType.capitalize()}TilemapConfig`);
            tileMappings = []; // Clear the current tileMappings
        }

        // Refresh the displays
        const dialogContent = $(event.currentTarget).closest('.hex-settings-dialog');
        displaySavedConfigurations(dialogContent, tilemapType);
        displayTileMappings(dialogContent, tileMappings);

        ui.notifications.info(`Configuration "${configName}" deleted successfully.`);
    } else {
        ui.notifications.error(`Configuration "${configName}" not found.`);
    }
}

function handleDragStart(event) {
    event.originalEvent.dataTransfer.setData('text/plain', event.target.dataset.path);
    event.target.style.opacity = '0.5';
}

function handleDragEnd(event) {
    event.target.style.opacity = '';
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.style.border = '2px dashed #000';
}

function handleDragLeave(event) {
    event.currentTarget.style.border = '';
}

function handleDrop(event, tileMappings) {
    event.preventDefault();
    event.currentTarget.style.border = '';
    const draggedTilePath = event.originalEvent.dataTransfer.getData('text');
    const targetMappingIndex = $(event.currentTarget).closest('.mapping-item').data('index');

    console.log('Dragged tile path:', draggedTilePath);
    console.log('Target mapping index:', targetMappingIndex);

    // Find the mapping that contains the dragged tile
    const sourceMappingIndex = tileMappings.findIndex(mapping =>
        mapping.tiles.some(tile => tile.tilePath === draggedTilePath)
    );

    console.log('Source mapping index:', sourceMappingIndex);

    if (sourceMappingIndex !== -1 && sourceMappingIndex !== targetMappingIndex) {
        try {
            // Remove the tile from the source mapping
            const sourceMapping = tileMappings[sourceMappingIndex];
            const tileIndex = sourceMapping.tiles.findIndex(tile => tile.tilePath === draggedTilePath);
            const [movedTile] = sourceMapping.tiles.splice(tileIndex, 1);

            console.log('Moved tile:', movedTile);

            // Add the tile to the target mapping
            tileMappings[targetMappingIndex].tiles.push(movedTile);

            // If the source mapping is now empty, remove it
            if (sourceMapping.tiles.length === 0) {
                tileMappings.splice(sourceMappingIndex, 1);
                console.log('Removed empty source mapping');
            }

            console.log('Updated tileMappings:', tileMappings);

            // Redisplay the mappings without expanding them
            game.settings.set('procedural-hex-maps', 'tileMappings', tileMappings);
            displayTileMappings($('.dialog-content'), tileMappings);
        } catch (error) {
            console.error('Error during drag and drop operation:', error);
            ui.notifications.error('An error occurred while moving the tile. Please try again.');
        }
    } else {
        console.log('Invalid drag and drop operation');
    }
}

function initializeCurveEditor(container, factor) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let curve = new Array(256).fill(0).map((_, i) => i);

    drawCurve(ctx, curve);

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    let isDrawing = false;

    function startDrawing(e) {
        isDrawing = true;
        draw(e);
    }

    function draw(e) {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) / rect.width * 256);
        const y = Math.floor((1 - (e.clientY - rect.top) / rect.height) * 256);
        curve[x] = y;
        drawCurve(ctx, curve);
    }

    function stopDrawing() {
        isDrawing = false;
        saveCurve(factor, curve);
    }

    // Store the curve in the container for later access
    container.curve = curve;
}

function drawCurve(ctx, curve) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.beginPath();
    ctx.moveTo(0, ctx.canvas.height - curve[0]);
    for (let i = 1; i < 256; i++) {
        ctx.lineTo(i, ctx.canvas.height - curve[i]);
    }
    ctx.strokeStyle = 'black';
    ctx.stroke();
}


function resetCurve(factor) {
    const container = document.querySelector(`#${factor}-curve-editor-container`);
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const curve = new Array(256).fill(0).map((_, i) => i);
    drawCurve(ctx, curve);
    saveCurve(factor, curve);

    // Trigger a preview update
    const previewButton = document.querySelector(`#preview-${factor}`);
    if (previewButton) {
        previewButton.click();
    }
}

function applyPresetCurve(factor, preset) {
    const container = document.getElementById(`${factor}-curve-editor-container`);
    const canvas = container.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    let curve;

    if (preset === 'bell') {
        curve = new Array(256).fill(0).map((_, i) => {
            const x = (i - 128) / 64;
            return Math.floor(255 * Math.exp(-x * x / 2));
        });
    } else if (preset === 's') {
        curve = new Array(256).fill(0).map((_, i) => {
            return Math.floor(255 / (1 + Math.exp(-0.05 * (i - 128))));
        });
    }

    drawCurve(ctx, curve);
    container.curve = curve;
    saveCurve(factor, curve);
}

function saveCurve(factor, curve) {
    game.settings.set('procedural-hex-maps', `${factor}-curve`, curve);

    // Update the temporary storage if it exists
    const tempData = game.settings.get('procedural-hex-maps', `temp-${factor}`);
    if (tempData) {
        tempData.curve = curve;
        game.settings.set('procedural-hex-maps', `temp-${factor}`, tempData);
    }
}


function getCurve(factor) {
    const tempData = game.settings.get('procedural-hex-maps', `temp-${factor}`);
    if (tempData && tempData.curve) {
        return tempData.curve;
    }
    return game.settings.get('procedural-hex-maps', `${factor}-curve`) || new Array(256).fill(0).map((_, i) => i);
}