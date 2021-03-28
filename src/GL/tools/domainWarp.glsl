#pragma glslify: NoiseSettings = require(../tools/noiseSettings.glsl)
#pragma glslify: noiseSupplier = require(../tools/noiseSupplier.glsl)

#define PI 3.1415926538

vec2 polarWarp(vec2 point, NoiseSettings angleControl, NoiseSettings amountControl, float max) {
    vec3 p = vec3(point.xy, 0);

    float amount = noiseSupplier(amountControl, p) * max;
    float angle = noiseSupplier(angleControl, p) * PI * 2.0;
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    return point + offset;
}

#pragma glslify: export(polarWarp)