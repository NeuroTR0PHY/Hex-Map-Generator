// Register the module and add a button to the UI
Hooks.once('ready', () => {
    const buttonHtml = `
    <div class="control-icon hex-map-generator">
      <img src="path/to/icon.png" title="Hex Map Generator">
    </div>
  `;

    $('.scene-control-tools').append(buttonHtml);

    $('.control-icon.hex-map-generator').click(() => {
        new HexMapGenerator().render(true);
    });
});

// test

// test 
class HexMapGenerator extends FormApplication {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: 'hex-map-generator',
            title: 'Hex Map Generator',
            template: 'modules/hex-map-generator/templates/template.html',
            width: 400
        });
    }

    async _updateObject(event, formData) {
        const config = {
            mapSize: formData.mapSize,
            elevationSeed: formData.elevationSeed,
            moistureSeed: formData.moistureSeed,
            temperatureSeed: formData.temperatureSeed,
            vegetationSeed: formData.vegetationSeed,
            biome: formData.biome
        };

        generateHexMap(config);
    }
}

function generatePerlinNoise(width, height, seed) {
    // Implement Perlin noise generation based on seed
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
        img: `modules/hex-map-generator/tiles/${tileType}.png`,
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
