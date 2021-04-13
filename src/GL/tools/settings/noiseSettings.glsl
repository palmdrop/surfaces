#pragma glslify: Modifications = require(./modifications.glsl)

struct NoiseSettings {
    int type;
    int dimensions;
    float frequency;
    float amplitude;
    vec3 offset;

    int octaves;
    float lacunarity;
    float persistence;
    
    Modifications modifications;
};

#pragma glslify: export(NoiseSettings)