﻿console.log("Procedural Hex Maps module script starting");

// Perlin noise generation
class PerlinNoise {
    constructor(seed) {
        this.p = [];
        this.permutation = [];
        this.seed(seed);
    }

    seed(seed) {
        this.permutation = [];
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(seed * Math.random());
        }

        this.p = new Array(512);
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i % 256];
        }
    }

    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
        return a + t * (b - a);
    }

    grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.p[X] + Y;
        const AA = this.p[A];
        const AB = this.p[A + 1];
        const B = this.p[X + 1] + Y;
        const BA = this.p[B];
        const BB = this.p[B + 1];

        return this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y), this.grad(this.p[BA], x - 1, y)),
            this.lerp(u, this.grad(this.p[AB], x, y - 1), this.grad(this.p[BB], x - 1, y - 1)));
    }

    generate(width, height, scale) {
        const noiseMap = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const noiseValue = this.noise(x * scale, y * scale);
                row.push((noiseValue + 1) / 2); // Normalize to [0, 1]
            }
            noiseMap.push(row);
        }
        return noiseMap;
    }
}

class HexMapGenerator extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'hex-map-generator',
            title: 'Generate New Hex Map',
            template: 'modules/procedural-hex-maps/templates/hex-generator-config.html',
            width: 400,
            height: 'auto',
            closeOnSubmit: true
        });
    }

    async _updateObject(event, formData) {
        event.preventDefault();
        const config = {
            mapSize: formData.mapSize,
            elevationSeed: formData.elevationSeed,
            moistureSeed: formData.moistureSeed,
            temperatureSeed: formData.temperatureSeed,
            vegetationSeed: formData.vegetationSeed,
            biome: formData.biome
        };

        await generateHexMap(config);
        ui.notifications.info("Hex map generated successfully!");
    }
}

function generatePerlinNoise(width, height, seed, scale = 0.1) {
    const perlin = new PerlinNoise(seed);
    return perlin.generate(width, height, scale);
}

function generateHexMap(config) {
    const { mapSize, elevationSeed, moistureSeed, temperatureSeed, vegetationSeed, biome } = config;
    const elevationMap = generatePerlinNoise(mapSize, mapSize, elevationSeed);
    const moistureMap = generatePerlinNoise(mapSize, mapSize, moistureSeed);
    const temperatureMap = generatePerlinNoise(mapSize, mapSize, temperatureSeed);
    const vegetationMap = generatePerlinNoise(mapSize, mapSize, vegetationSeed);

    const profile = biomeProfiles[biome];

    for (let x = 0; x < mapSize; x++) {
        for (let y = 0; y < mapSize; y++) {
            let elevation = elevationMap[x][y];
            let moisture = moistureMap[x][y];
            let temperature = temperatureMap[x][y];
            let vegetationDensity = vegetationMap[x][y];

            temperature = adjustTemperatureByElevation(temperature, elevation);
            moisture = adjustMoistureByElevation(moisture, elevation);
            vegetationDensity = adjustVegetationByMoistureAndTemperature(vegetationDensity, moisture, temperature);

            if (elevation >= profile.elevation.min && elevation <= profile.elevation.max &&
                moisture >= profile.moisture.min && moisture <= profile.moisture.max &&
                temperature >= profile.temperature.min && temperature <= profile.temperature.max &&
                vegetationDensity >= profile.vegetationDensity.min && vegetationDensity <= profile.vegetationDensity.max) {

                const tileType = determineTileType(biome, elevation, moisture, temperature, vegetationDensity);
                placeHexTile(x, y, tileType);
            }
        }
    }
}

function adjustTemperatureByElevation(temperature, elevation) {
    const elevationFactor = 0.2;
    return temperature - elevation * elevationFactor;
}

function adjustMoistureByElevation(moisture, elevation) {
    const elevationFactor = 0.1;
    return moisture - elevation * elevationFactor;
}

function adjustVegetationByMoistureAndTemperature(vegetationDensity, moisture, temperature) {
    const moistureFactor = 0.5;
    const temperatureFactor = 0.5;
    const optimalTemperature = 0.6;
    const temperatureEffect = Math.max(0, 1 - Math.abs(temperature - optimalTemperature) * temperatureFactor);
    return vegetationDensity * moisture * moistureFactor * temperatureEffect;
}

function determineTileType(biome, elevation, moisture, temperature, vegetationDensity) {
    if (vegetationDensity > 0.8) {
        return `${biome}-dense-forest`;
    } else if (vegetationDensity > 0.5) {
        return `${biome}-sparse-forest`;
    } else {
        return `${biome}-grassland`;
    }
}

function placeHexTile(x, y, tileType) {
    const tileData = {
        img: `modules/procedural-hex-maps/tiles/${tileType}.png`,
        x: x * canvas.grid.size,
        y: y * canvas.grid.size,
        width: canvas.grid.size,
        height: canvas.grid.size
    };

    canvas.scene.createEmbeddedDocuments('Tile', [tileData]);
}

const biomeProfiles = {
    forest: {
        elevation: { min: 0.2, max: 0.8 },
        moisture: { min: 0.5, max: 1.0 },
        temperature: { min: 0.4, max: 0.8 },
        vegetationDensity: { min: 0.7, max: 1.0 }
    },
    desert: {
        elevation: { min: 0.1, max: 0.5 },
        moisture: { min: 0.0, max: 0.3 },
        temperature: { min: 0.7, max: 1.0 },
        vegetationDensity: { min: 0.0, max: 0.2 }
    },
    tundra: {
        elevation: { min: 0.3, max: 0.7 },
        moisture: { min: 0.2, max: 0.6 },
        temperature: { min: 0.0, max: 0.3 },
        vegetationDensity: { min: 0.1, max: 0.5 }
    }
};

function onHexMapSelect() {
    // Implement your hex selection logic here
    console.log("Hex Map Select tool activated");
}

// Add this new class at the end of your existing code:
class HexMapTool extends Tool {
    static get namespace() {
        return 'procedural-hex-maps';
    }

    static get id() {
        return 'hex-map-tool';
    }

    static get layer() {
        return 'tiles';
    }

    constructor(options = {}) {
        super(options);
        this.generateButton = null;
    }

    static getIcon() {
        return "modules/procedural-hex-maps/icons/hex.png";
    }

    static getName() {
        return "Hex Map Tool";
    }

    async getButtons() {
        this.generateButton = await new Promise((resolve) => {
            Hooks.once('renderHexMapTool', (app, html) => {
                const button = html.find('button[data-action="generate"]');
                resolve(button);
            });
        });

        return [{
            name: "generate",
            title: "Generate New Hex Map",
            icon: "fas fa-plus",
            button: true,
            onClick: () => new HexMapGenerator().render(true)
        }];
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find('.control-tool[data-action="generate"]').click(this._onClickGenerate.bind(this));
    }

    async _onClickGenerate(event) {
        event.preventDefault();
        new HexMapGenerator().render(true);
    }
}

Hooks.on('getSceneControlButtons', (controls) => {
    console.log("Procedural Hex Maps module: getSceneControlButtons hook fired");

    const hexMapControls = {
        name: "hex-map-generator",
        title: "Hex Map Generator",
        layer: "tiles",
        icon: "modules/procedural-hex-maps/icons/hex.png",
        tools: [
            {
                name: "select",
                title: "Hex Map Tool",
                icon: "modules/procedural-hex-maps/icons/hex.png",
                class: HexMapTool,
                active: true,
                button: true,
                toggle: true
            }
        ],
        activeTool: "select"
    };

    controls.push(hexMapControls);
});

console.log("Procedural Hex Maps module script finished");