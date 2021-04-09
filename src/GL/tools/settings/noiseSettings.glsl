#pragma glslify: Modifications = require(./modifications.glsl)

struct NoiseSettings {
    int type;
    int dimensions;
    float frequency;
    vec3 offset;

    int octaves;
    float lacunarity;
    float persistence;
    bool normalize;
    
    bool hasModifications;
    Modifications modifications;
};

#pragma glslify: export(NoiseSettings)