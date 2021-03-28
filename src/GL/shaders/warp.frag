precision mediump float;

#pragma glslify: NoiseSettings = require(../tools/noiseSettings.glsl)
#pragma glslify: noiseSupplier = require(../tools/noiseSupplier.glsl)

#pragma glslify: polarWarp = require(../tools/domainWarp.glsl)
#pragma glslify: noiseSupplier = require(../tools/noiseSupplier.glsl)

#define PI 3.1415926538

varying vec3 fragColor;
uniform NoiseSettings source;
uniform NoiseSettings angleControl;
uniform NoiseSettings amountControl;

uniform float amount;
uniform float time;

vec2 domainWarp(vec2 point, NoiseSettings angleControl, NoiseSettings amountControl, float max) {
    vec3 p = vec3(point.xy, 0);

    float amount = noiseSupplier(amountControl, p) * max;
    float angle = noiseSupplier(angleControl, p) * PI * 2.0;
    vec2 offset = vec2(cos(angle), sin(angle)) * amount;

    return point + offset;
}

void main()
{
    //source.offset.z += time;
    vec2 p = gl_FragCoord.xy;
    p = polarWarp(p, angleControl, amountControl, amount);
    float n = noiseSupplier(source, vec3(p.x, p.y, 0));
    gl_FragColor = vec4(fragColor * n, 1.0);
}
