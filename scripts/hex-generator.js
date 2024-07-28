    let hexInfoBoxCreated = false;

    Hooks.once('ready', () => {
        createHexInfoBox();
        createHoverInfoBox(); // Create the hover info box when the application is ready

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

            // Log the hex data to the console
            console.log(`Hex ${hexId} Data:`);
            console.log(`Elevation: ${hexData.elevation}`);
            console.log(`Temperature: ${hexData.temperature}`);
            console.log(`Precipitation: ${hexData.precipitation}`);
            console.log(`Wind Intensity: ${hexData.windIntensity}`);
            console.log(`Biome: ${hexData.biomeType}`);
            console.log(`Vegetation Density: ${hexData.vegetationDensity}`);
            console.log(`Humidity: ${hexData.humidity}`);

            const hexInfoContent = `
        <div style="display: flex; flex-wrap: wrap;">
            <div style="width: 100%;"><strong>ID:</strong> ${hexData.id} x= ${hexData.x} y= ${hexData.y} <strong>Type:</strong> ${hexData.tileType} <strong>Modifier:</strong> ${hexData.tileModifier} <strong>Variant:</strong> ${hexData.tileVariant}</div>
            <div style="width: 50%;"><strong>Elevation:</strong> ${hexData.elevation}</div>
            <div style="width: 50%;"><strong>Temperature:</strong> ${hexData.temperature}</div>
            <div style="width: 50%;"><strong>Humidity:</strong> ${hexData.humidity}</div>
            <div style="width: 50%;"><strong>Precipitation:</strong> ${hexData.precipitation}</div>
            <div style="width: 50%;"><strong>Wind Direction:</strong> ${hexData.windDirection}</div>
            <div style="width: 50%;"><strong>Wind Intensity:</strong> ${hexData.windIntensity}</div>
            <div style="width: 50%;"><strong>Vegetation Density:</strong> ${hexData.vegetationDensity}</div>
            <div style="width: 50%;"><strong>isWater:</strong> ${hexData.isWater}</div>
            <div style="width: 50%;"><strong>Water Depth:</strong> ${hexData.waterDepth}</div>
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
            for (const factor of ['elevation', 'precipitation', 'temperature', 'windIntensity']) {
                html.find(`#preview-${factor}`).on('click', () => previewNoise(html, factor));
            }
        },
        default: "generate",
        width: 2000,
        height: 800
    }).render(true);
}

function previewNoise(html, factor) {
    try {
        const params = getNoiseParams(html, factor);
        const previewCanvas = html.find(`#${factor}-preview`)[0];
        if (!previewCanvas) {
            throw new Error('Preview canvas not found');
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

        const noiseData = generateUnifiedNoise(previewWidth, previewHeight, params, noiseModule);

        // Render preview
        const imageData = ctx.createImageData(previewWidth, previewHeight);

        for (let y = 0; y < previewHeight; y++) {
            for (let x = 0; x < previewWidth; x++) {
                const noiseValue = noiseData[y * previewWidth + x];

                const color = Math.floor(255 * (1 - (noiseValue / 10)));
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

        // Store the generated noise data in the html element for later use
        html.data(`${factor}-noiseData`, noiseData);
        html.data(`${factor}-noiseParams`, params);

        console.log(`${factor} noise data stored:`, noiseData);
    } catch (error) {
        console.error(`Error in previewNoise for ${factor}:`, error);
        if (previewCanvas) {
            const ctx = previewCanvas.getContext('2d');
            ctx.fillStyle = 'red';
            ctx.font = '12px Arial';
            ctx.fillText(`Error generating preview for ${factor}`, 10, 20);
            ctx.fillText(error.message, 10, 40);
        }
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

    // Normalize if needed
    const range = maxNoiseValue - minNoiseValue;
    const scaleFactor = params.normalize ? (params.max - params.min) / range : 10;
    const offset = params.normalize ? params.min - minNoiseValue * scaleFactor : 0;

    for (let i = 0; i < noiseValues.length; i++) {
        let scaledValue = noiseValues[i] * scaleFactor + offset;
        noiseValues[i] = Math.max(0, Math.min(10, scaledValue));
    }

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
        normalize: html.find(`#${factor}-normalize`).is(':checked')
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
        for (const factor of factors) {
            const generatedNoiseData = html.data(`${factor}-noiseData`);
            const generatedNoiseParams = html.data(`${factor}-noiseParams`);

            if (generatedNoiseData && generatedNoiseParams) {
                console.log(`Saving generated noise data for ${factor}`);
                await saveNoiseData(sceneId, factor, generatedNoiseData, generatedNoiseParams);
            } else {
                console.error(`No generated noise data found for ${factor}`);
                throw new Error(`No generated noise data found for ${factor}`);
            }
        }

        // Load noise data from files
        for (const factor of factors) {
            const loadedData = await loadNoiseData(sceneId, factor);
            if (loadedData) {
                noiseData[factor] = loadedData.noiseData;
                console.log(`Loaded noise data for ${factor}`);
            } else {
                throw new Error(`Failed to load noise data for ${factor}`);
            }
        }

        const seed = parseInt(html.find('#main-seed').val()) || Math.floor(Math.random() * 1000000);
        console.log(`Generating enhanced hex map: ${width}x${height}, hex size: ${hexSize}, seed: ${seed}`);

        const tileMapping = await loadTileMapping();
        const hexGrid = createHexGridData(width, height, hexSize, noiseData, tileMapping, seed);

        const placedTiles = hexGrid.map(hex => ({
            x: hex.x - (hexSize + 10) / 2,
            y: hex.y - hexSize / 2,
            width: hexSize + 10,
            height: hexSize,
            rotation: 0,
            sort: hex.staggeredRow,
            flags: { hexTile: true, hexId: hex.id },
            texture: {
                src: `modules/procedural-hex-maps/tiles/${getTileImage(hex, tileMapping)}`,
                scaleX: 2,
                scaleY: 2,
                offsetX: 0,
                offsetY: 0
            }
        }));

        const createdTiles = await canvas.scene.createEmbeddedDocuments("Tile", placedTiles);
        placedTileIds = createdTiles.map(tile => tile.id);

        await canvas.scene.setFlag("procedural-hex-maps", "hexGridData", hexGrid);
        await updateHexTilesWithIds();

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

        // Terrain characteristics
        this.humidity = 0;
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

        // Enemies, items, and notes
        this.potentialEnemies = [];
        this.items = [];
        this.notes = '';

        // Tile information
        this.tileType = '';
        this.tileModifier = '';
        this.tileVariant = '';

        // Simulation history
        this.simulationHistory = [];

        // Custom properties
        this.customProperties = {};
    }

    setStaggeredRow(staggeredRow) {
        this.staggeredRow = staggeredRow;
    }

    updateEnvironment(elevationMod = 0, precipitationMod = 0, temperatureMod = 0, windMod = 0) {
        this.elevation = Math.max(0, Math.min(10, this.baseElevation + elevationMod));
        this.precipitation = Math.max(0, Math.min(10, this.basePrecipitation + precipitationMod));
        this.temperature = Math.max(0, Math.min(10, this.baseTemperature + temperatureMod));
        this.windIntensity = Math.max(0, Math.min(10, this.baseWindIntensity + windMod));
        this.isWater = this.elevation <= 2; // Assuming water level is 2

        console.log(`Hex ${this.id} updated environment:`, {
            elevation: this.elevation,
            precipitation: this.precipitation,
            temperature: this.temperature,
            windIntensity: this.windIntensity,
            isWater: this.isWater
        });

        this.updateDerivedCharacteristics();
    }

    updateDerivedCharacteristics() {
        this.humidity = (this.precipitation * 2 + (10 - this.temperature)) / 3;
        this.vegetationDensity = (this.precipitation + this.temperature - this.elevation / 2) / 2;
        if (this.isWater) this.vegetationDensity = 0;
        this.determineBiomeType();
        this.updateMovementCost();
    }

    determineBiomeType() {
        if (this.isWater) {
            this.biomeType = this.elevation === 1 ? 'ocean' : 'lake';
        } else if (this.elevation > 8) {
            this.biomeType = 'mountain';
        } else if (this.temperature < 3) {
            this.biomeType = 'tundra';
        } else if (this.precipitation < 3) {
            this.biomeType = 'desert';
        } else if (this.temperature > 7 && this.precipitation > 7) {
            this.biomeType = 'tropical rainforest';
        } else if (this.temperature > 7) {
            this.biomeType = 'savanna';
        } else if (this.precipitation > 7) {
            this.biomeType = 'temperate rainforest';
        } else {
            this.biomeType = 'temperate forest';
        }
    }

    updateMovementCost() {
        this.movementCost = 1; // Base cost
        if (this.isWater) this.movementCost = this.waterDepth > 1 ? 2 : 1.5;
        else if (this.elevation > 8) this.movementCost = 3;
        else if (this.elevation > 6) this.movementCost = 2;
        else if (this.vegetationDensity > 7) this.movementCost = 1.5;
    }

    determineTile(tileMapping) {
        console.log('determineTile called');
        console.log('this:', {
            elevation: this.elevation,
            temperature: this.temperature,
            precipitation: this.precipitation,
            windIntensity: this.windIntensity
        });

        const matchingTiles = tileMapping.filter(tile =>
            this.elevation >= tile.elevationLow && this.elevation <= tile.elevationHigh &&
            this.temperature >= tile.temperatureLow && this.temperature <= tile.temperatureHigh &&
            this.precipitation >= tile.precipitationLow && this.precipitation <= tile.precipitationHigh &&
            this.windIntensity >= tile.windLow && this.windIntensity <= tile.windHigh &&
            tile.settlement === 0
        );

        if (matchingTiles.length > 0) {
            // Randomly select a tile from all matching tiles
            const selectedTile = matchingTiles[Math.floor(Math.random() * matchingTiles.length)];
            this.tileType = selectedTile.tileType;
            this.tileModifier = selectedTile.modifier;
            this.tileVariant = selectedTile.variant;
            console.log(`Selected tile for hex ${this.id}:`, selectedTile.fullTileName);
        } else {
            console.warn(`No matching tile found for hex ${this.id}. Using default tile.`);
            this.tileType = 'Base';
            this.tileModifier = 'blank';
            this.tileVariant = '';
        }
    }

    recordSimulation(simulationName) {
        this.simulationHistory.push({
            name: simulationName,
            timestamp: Date.now(),
            elevation: this.elevation,
            precipitation: this.precipitation,
            temperature: this.temperature,
            windIntensity: this.windIntensity,
            humidity: this.humidity,
            biomeType: this.biomeType,
            vegetationDensity: this.vegetationDensity,
            isWater: this.isWater,
            movementCost: this.movementCost,
            tileType: this.tileType,
            tileModifier: this.tileModifier,
            tileVariant: this.tileVariant
        });
    }

    getSimulationResult(simulationName) {
        return this.simulationHistory.find(sim => sim.name === simulationName);
    }

    setCustomProperty(key, value) {
        this.customProperties[key] = value;
    }

    getCustomProperty(key) {
        return this.customProperties[key];
    }
}

    // Function to create hex grid data
function createHexGridData(width, height, hexSize, noiseData, tileMapping, seed) {
    const hexGrid = [];
    const hexWidth = hexSize + 10;
    const hexHeight = hexSize;
    const horizontalSpacing = hexWidth * 3 / 4;
    const verticalSpacing = hexHeight;

    const columns = Math.ceil(width / horizontalSpacing);
    const rows = Math.ceil(height / hexHeight);

    const random = new SeededRandom(seed);

    let id = 1;

    for (let col = 0; col < columns; col++) {
        for (let row = 0; row < rows; row++) {
            const x = col * horizontalSpacing;
            const y = row * verticalSpacing + (col % 2) * (hexHeight / 2);

            const centerX = x + (hexWidth + 10) / 2;
            const centerY = y + hexHeight / 2;

            if (centerX < width && centerY < height) {
                let staggeredRow = (col % 2 === 0) ? row * 2 + 1 : row * 2 + 2;

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

                hexData.updateEnvironment();
                hexData.determineTile(tileMapping);
                hexData.recordSimulation('initial');

                hexGrid.push(hexData);
                id++;
            }
        }
    }

    return hexGrid;
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

    switch (params.noiseType) {
        case 'simplex':
            return (noiseModule.simplex(scaledX, scaledY) + 1) / 2;
        case 'worley':
            return noiseModule.worley(scaledX, scaledY);
        case 'fractalPerlin':
            return (noiseModule.fractalPerlin(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain) + 1) / 2;
        case 'fractalSimplex':
            return (noiseModule.fractalSimplex(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain) + 1) / 2;
        case 'fractalWorley':
            return noiseModule.fractalWorley(scaledX, scaledY, 0, params.octaves, params.lacunarity, params.gain);
        case 'perlin':
        default:
            return (noiseModule.perlin(scaledX, scaledY) + 1) / 2;
    }
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
    console.log(`Attempting to save noise data for ${factor}`);
    const sceneDir = await ensureSceneDirectory(sceneId);
    console.log(`Scene directory: ${sceneDir}`);
    const fileName = `${factor}_noise.json`;
    const filePath = `${sceneDir}/${fileName}`;
    console.log(`File path: ${filePath}`);
    const fileContent = JSON.stringify({ noiseData, params });

    try {
        console.log(`Uploading file for ${factor}`);
        const file = new File([fileContent], fileName, { type: 'application/json' });
        await FilePicker.upload('data', sceneDir, file);
        console.log(`Successfully saved noise data for ${factor} to ${filePath}`);
    } catch (error) {
        console.error(`Error saving noise data for ${factor}:`, error);
        throw error;
    }
}


//function to load noise data that has been saved
async function loadNoiseData(sceneId, factor) {
    const sceneDir = await ensureSceneDirectory(sceneId);
    const filePath = `${sceneDir}/${factor}_noise.json`;

    try {
        const response = await fetch(filePath);
        if (response.ok) {
            const data = await response.json();
            console.log(`Loaded noise data for ${factor} from ${filePath}`);
            return data;
        } else {
            console.error(`Failed to load noise data for ${factor}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Error loading noise data for ${factor}:`, error);
    }

    return null;
}

    // Function to load tile mapping from CSV
    async function loadTileMapping() {
        try {
            const response = await fetch('modules/procedural-hex-maps/TileMapping.csv');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const text = await response.text();
            console.log('TileMapping CSV loaded:', text);

            // Split the text into lines and remove the header
            const lines = text.split('\n').slice(1);

            // Parse each line into an object
            const tileMapping = lines.map(line => {
                const [fullTileName, tileType, modifier, variant, elevationLow, elevationHigh, temperatureLow, temperatureHigh, precipitationLow, precipitationHigh, windLow, windHigh, settlement] = line.split(',').map(field => field.trim());

                const tileData = {
                    fullTileName,
                    tileType: tileType.replace(/ /g, '_'),
                    modifier: modifier.replace(/ /g, '_'),
                    variant: variant.replace(/ /g, '_'),
                    elevationLow: parseInt(elevationLow),
                    elevationHigh: parseInt(elevationHigh),
                    temperatureLow: parseInt(temperatureLow),
                    temperatureHigh: parseInt(temperatureHigh),
                    precipitationLow: parseInt(precipitationLow),
                    precipitationHigh: parseInt(precipitationHigh),
                    windLow: parseInt(windLow),
                    windHigh: parseInt(windHigh),
                    settlement: parseInt(settlement)
                };

                console.log('Processed tile data:', tileData);
                return tileData;
            });

            console.log('Processed tileMapping:', tileMapping);
            return tileMapping;
        } catch (error) {
            console.error("Error loading tile mapping:", error);
            throw error;
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





