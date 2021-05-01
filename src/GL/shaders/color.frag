#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#pragma glslify: hsv2rgb = require(glsl-hsv2rgb)

int ADD = 0;
int MULT = 1;

struct ComponentController {
    int operation;
    float source;
    float angle;
    float amount;
};

varying vec3 fragColor;
varying vec2 texCoord;

uniform sampler2D texture;

uniform float power;
uniform float brightness;

uniform float hueOffset;

void main()
{
    vec4 data = texture2D(texture, texCoord);

    float n = data.x;
    float angle = data.y;
    float amount = data.z;


    float hue = angle * n;
    float sat = amount + angle;
    float bri = n;

    hue += hueOffset;

    bri = pow(bri, power);
    bri = bri * brightness;
    //bri = 0.0;

    vec3 color = hsv2rgb(vec3(hue, sat, bri));

    gl_FragColor = vec4(color, 1.0);
}