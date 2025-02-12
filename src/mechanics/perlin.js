// https://www.michaelbromley.co.uk/blog/simple-1d-noise-in-javascript/

export class PerlinNoise {
    MAX_VERTICES = 256;
    MAX_VERTICES_MASK = this.MAX_VERTICES - 1;
    amplitude = 1;
    scale = 1;
    r = [];

    constructor(amplitude, scale) {
        this.amplitude = amplitude;
        this.scale = scale;
        for (let i = 0; i < this.MAX_VERTICES; ++i) {
            this.r.push(Math.random());
        }
    }

    getVal(x) {
        const scaledX = x * this.scale;
        const xFloor = Math.floor(scaledX);
        const t = scaledX - xFloor;
        const tRemapSmoothstep = t * t * (3 - 2 * t);

        // Modulo using &
        const xMin = xFloor & this.MAX_VERTICES_MASK;
        const xMax = (xMin + 1) & this.MAX_VERTICES_MASK;
        const y = this.lerp(this.r[xMin], this.r[xMax], tRemapSmoothstep);

        return y * this.amplitude;
    };

    lerp(lower, upper, between) {
        return lower * (1 - between) + upper * between;
    };
};