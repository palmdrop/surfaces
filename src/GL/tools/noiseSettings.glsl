struct NoiseSettings {
    int type;
    int dimensions;
    float frequency;
    vec3 offset;
    float pow;
};

#pragma glslify: export(NoiseSettings)