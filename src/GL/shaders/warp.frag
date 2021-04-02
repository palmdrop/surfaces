precision mediump float;

#pragma glslify: NoiseSettings = require(../tools/settings/noiseSettings.glsl)
#pragma glslify: FractalNoiseSettings = require(../tools/settings/fractalNoiseSettings.glsl)

#pragma glslify: noiseSupplier = require(../tools/suppliers/noiseSupplier.glsl)
#pragma glslify: fractalNoiseSupplier = require(../tools/suppliers/fractalNoiseSupplier.glsl)

#pragma glslify: polarWarp = require(../tools/domainWarp.glsl)
#pragma glslify: Modifications = require(../tools/settings/modifications.glsl)

#define PI 3.1415926538

varying vec3 fragColor;
uniform NoiseSettings source;
uniform NoiseSettings angleControl;
uniform NoiseSettings amountControl;

uniform float time;
uniform float amount;
uniform int iterations;

vec2 recursiveWarp(vec2 p) {
    if(iterations == 0) {
    } else if(iterations == 1) {
        p = polarWarp(p, angleControl, amountControl, amount);
    } else if(iterations == 2) {
        for(int i = 0; i < 2; i++) {
            p = polarWarp(p, angleControl, amountControl, amount);
        }
    } else if(iterations == 3) {
        for(int i = 0; i < 3; i++) {
            p = polarWarp(p, angleControl, amountControl, amount);
        }
    } else {
        for(int i = 0; i < 4; i++) {
            p = polarWarp(p, angleControl, amountControl, amount);
        }
    }
    return p;
}

bool isnan( float val )
{
  return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
}

void main()
{

    FractalNoiseSettings fns = FractalNoiseSettings(
        source,
        5,
        2.1,
        0.5,
        true
    );

    FractalNoiseSettings fns2 = FractalNoiseSettings(
        angleControl,
        5,
        2.04,
        0.5,
        true
    );

    FractalNoiseSettings fns3 = FractalNoiseSettings(
        amountControl,
        5,
        2.3,
        0.7,
        true
    );

    vec2 p = recursiveWarp(vec2(gl_FragCoord.x, gl_FragCoord.y));
    float n = fractalNoiseSupplier(fns, vec3(p.x, p.y, time));
    float r = fractalNoiseSupplier(fns2, vec3(p.x, p.y, 0));
    float g = fractalNoiseSupplier(fns3, vec3(p.x, p.y, 0));

    gl_FragColor = vec4(vec3(n, g, r) * n, 1.0);
}
