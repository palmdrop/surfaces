#pragma glslify: NoiseSettings = require(./noiseSettings.glsl);

struct FractalNoiseSettings {
    NoiseSettings noise;
    int octaves;
    float lacunarity;
    float persistence;
    bool normalize;
};

#pragma glslify: export(FractalNoiseSettings)