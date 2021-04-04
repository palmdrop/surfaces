precision mediump float;

#pragma glslify: NoiseSettings = require(../tools/settings/noiseSettings.glsl)
#pragma glslify: FractalNoiseSettings = require(../tools/settings/fractalNoiseSettings.glsl)

#pragma glslify: noiseSupplier = require(../tools/suppliers/noiseSupplier.glsl)
#pragma glslify: fractalNoiseSupplier = require(../tools/suppliers/fractalNoiseSupplier.glsl)

#pragma glslify: polarWarp = require(../tools/domainWarp.glsl)
#pragma glslify: Modifications = require(../tools/settings/modifications.glsl)

#define PI 3.1415926538

varying vec3 fragColor;

uniform vec2 viewport;

uniform NoiseSettings source;
uniform NoiseSettings angleControl;
uniform NoiseSettings amountControl;

uniform int octaves;

uniform float time;
uniform float warpAmount;
uniform int iterations;

vec2 recursiveWarp(vec2 p, FractalNoiseSettings angleControl, FractalNoiseSettings amountControl) {
    if(iterations == 0) {
    } else if(iterations == 1) {
        p = polarWarp(p, angleControl, amountControl, warpAmount);
    } else if(iterations == 2) {
        for(int i = 0; i < 2; i++) {
            p = polarWarp(p, angleControl, amountControl, warpAmount);
        }
    } else if(iterations == 3) {
        for(int i = 0; i < 3; i++) {
            p = polarWarp(p, angleControl, amountControl, warpAmount);
        }
    } else {
        for(int i = 0; i < 4; i++) {
            p = polarWarp(p, angleControl, amountControl, warpAmount);
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

    FractalNoiseSettings fractalSource = FractalNoiseSettings(
        source,
        octaves,
        2.1,
        0.5,
        true
    );

    FractalNoiseSettings fractalAngle = FractalNoiseSettings(
        angleControl,
        octaves,
        2.04,
        0.5,
        true
    );

    FractalNoiseSettings fractalAmount = FractalNoiseSettings(
        amountControl,
        octaves,
        2.3,
        0.7,
        true
    );

    vec2 p = recursiveWarp(gl_FragCoord.xy, fractalAngle, fractalAmount);
    float n = fractalNoiseSupplier(fractalSource, vec3(p.xy, time));
    float r = fractalNoiseSupplier(fractalAngle, vec3(p.xy, 0));
    float g = fractalNoiseSupplier(fractalAmount, vec3(p.xy, 0));

    gl_FragColor = vec4(vec3(n, g, r) * n, 1.0);
    //gl_FragColor = vec4(gl_FragCoord.x / viewport.x, gl_FragCoord.y / viewport.y, 0.0, 1.0);
}
