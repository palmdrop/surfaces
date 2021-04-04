#pragma glslify: FractalNoiseSettings = require(../tools/settings/fractalNoiseSettings.glsl)
#pragma glslify: fractalNoiseSupplier = require(../tools/suppliers/fractalNoiseSupplier.glsl)

#define PI 3.1415926538

vec2 polarWarp(vec2 point, FractalNoiseSettings angleControl, FractalNoiseSettings amountControl, float max) {
    vec3 p = vec3(point.xy, 0);

    float amount = fractalNoiseSupplier(amountControl, p) * max;
    float angle = fractalNoiseSupplier(angleControl, p) * PI * 2.0;
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    return point + offset;
}

#pragma glslify: export(polarWarp)