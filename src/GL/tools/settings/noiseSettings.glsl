#pragma glslify: Modifications = require(./modifications.glsl)

struct NoiseSettings {
    int type;
    int dimensions;
    float frequency;
    vec3 offset;
    float pow;
    bool hasModifications;
    Modifications modifications;
};

#pragma glslify: export(NoiseSettings)