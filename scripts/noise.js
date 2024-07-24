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

// Expose the NoiseModule to the global scope
window.NoiseModule = NoiseModule;