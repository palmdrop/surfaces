precision mediump float;

varying vec3 fragColor;

#pragma glslify: snoise = require(glsl-noise/simplex/2d);

void main()
{
    float n = 1.0 + snoise(gl_FragCoord.xy * 0.01);
    gl_FragColor = vec4(fragColor * n, 1.0);
}
