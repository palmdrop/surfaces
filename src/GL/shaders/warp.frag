precision mediump float;

#pragma glslify: NoiseSettings = require(../tools/settings/noiseSettings.glsl)
#pragma glslify: FractalNoiseSettings = require(../tools/settings/fractalNoiseSettings.glsl)

#pragma glslify: noiseSupplier = require(../tools/suppliers/simplexNoiseSupplier.glsl)
#pragma glslify: fractalNoiseSupplier = require(../tools/suppliers/fractalNoiseSupplier.glsl)

#pragma glslify: polarWarp = require(../tools/domainWarp.glsl)
#pragma glslify: Modifications = require(../tools/settings/modifications.glsl)

#define PI 3.1415926538

varying vec3 fragColor;

//uniform vec2 viewport;

uniform NoiseSettings source;
uniform NoiseSettings angleControl;
uniform NoiseSettings amountControl;

uniform int octaves;

uniform float time;
uniform float warpAmount;
uniform int iterations;

uniform bool multisampling;

#define RECURSIVE_WARP(p, angle, amount, iterations) for(int i = 0; i < (iterations); i++) { p = polarWarp(p, (angle), (amount), warpAmount); }

vec2 recursiveWarp(vec2 p, FractalNoiseSettings angleControl, FractalNoiseSettings amountControl) {
    if(iterations == 0) {
    } else if(iterations == 1) {
        RECURSIVE_WARP(p, angleControl, amountControl, 1);
    } else if(iterations == 2) {
        RECURSIVE_WARP(p, angleControl, amountControl, 2);
    } else if(iterations == 3) {
        RECURSIVE_WARP(p, angleControl, amountControl, 3);
    } 
    /*else {
        for(int i = 0; i < 4; i++) {
            p = polarWarp(p, angleControl, amountControl, warpAmount);
        }
    }*/
    return p;
}

bool isnan( float val )
{
  return ( val < 0.0 || 0.0 < val || val == 0.0 ) ? false : true;
}

vec3 getColor(vec2 coord, FractalNoiseSettings source, FractalNoiseSettings angle, FractalNoiseSettings amount) {
    vec2 p = recursiveWarp(coord, angle, amount);
    float n = fractalNoiseSupplier(source, vec3(p.xy, time));
    float r = fractalNoiseSupplier(angle, vec3(p.xy, time));
    float g = fractalNoiseSupplier(amount, vec3(p.xy, time));
    return vec3(n, g, r) * n;
    //return vec3(1.0) * n;
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

    if(!multisampling) {
        vec3 color = getColor(gl_FragCoord.xy, fractalSource, fractalAngle, fractalAmount);
        gl_FragColor = vec4(color, 1.0);
    } else {
        float xStep = 1.0;
        //1.0 / float(viewport.x);
        float yStep = 1.0;
        //1.0 / float(viewport.y);

        float xOffset = 3.0 * xStep / 8.0;
        float yOffset = 3.0 * yStep / 8.0;

        vec2 pos = gl_FragCoord.xy;
        vec3 color = getColor(pos + vec2(-xOffset, -yOffset / 2.0), fractalSource, fractalAngle, fractalAmount);
        color +=     getColor(pos + vec2(xOffset / 2.0, -yOffset),  fractalSource, fractalAngle, fractalAmount);
        color +=     getColor(pos + vec2(-xOffset / 2.0, yOffset),  fractalSource, fractalAngle, fractalAmount);
        color +=     getColor(pos + vec2(xOffset, yOffset / 2.0),   fractalSource, fractalAngle, fractalAmount);

        gl_FragColor = vec4(color / 4.0, 1.0);

        //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

    }
    //gl_FragColor = vec4(gl_FragCoord.x / viewport.x, gl_FragCoord.y / viewport.y, 0.0, 1.0);
}
