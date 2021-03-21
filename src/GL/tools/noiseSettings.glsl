struct NoiseSettings {
    int type;
    int dimensions;
    float frequency;
    vec3 offset;
};

#pragma glslify: export(NoiseSettings)