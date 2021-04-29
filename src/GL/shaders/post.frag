precision mediump float;

#pragma glslify: hsv2rgb = require(glsl-hsv2rgb)

varying vec3 fragColor;
varying vec2 texCoord;

uniform sampler2D texture;

void main()
{
    vec4 data = texture2D(texture, texCoord);

    float n = data.x;
    float angle = data.y;
    float amount = data.z;

    vec3 color = hsv2rgb(vec3(angle * n, amount + angle, n));



    gl_FragColor = vec4(color, 1.0);
}