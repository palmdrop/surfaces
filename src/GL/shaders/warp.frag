precision mediump float;

varying vec3 fragColor;

#pragma glslify: NoiseSettings = require(../tools/noiseSettings.glsl)
#pragma glslify: noiseSupplier = require(../tools/noiseSupplier.glsl)

#pragma glslify: warp = require(../tools/domainWarp.glsl)
#pragma glslify: noiseSupplier = require(../tools/noiseSupplier.glsl)

void main()
{
    NoiseSettings ns = NoiseSettings (
        1,
        2,
        0.01,
        vec3(0, 0, 0)
    );

    vec2 p = gl_FragCoord.xy;

    p = warp(p, 0.01, 0.01, 1.0);

    float n = 1.0 + noiseSupplier(ns, vec3(p.xy, 0));

    gl_FragColor = vec4(fragColor * n, 1.0);
}
