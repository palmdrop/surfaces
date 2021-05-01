#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#pragma glslify: hsv2rgb = require(glsl-hsv2rgb)

int ADD = 0;
int MULT = 1;

struct ComponentController {
    bool mult;
    float source;
    float angle;
    float amount;
};

struct ColorBalance {
    float hue;
    float saturation;
    float brightness;
};

//varying vec3 fragColor;
varying vec2 texCoord;
uniform sampler2D texture;

uniform vec2 viewport;

uniform bool multisampling;

uniform float power;
uniform ColorBalance general;

uniform ComponentController hueController;
uniform ComponentController saturationController;
uniform ComponentController brightnessController;

float getComponent(vec4 data, ComponentController controller) {
    float result;
    if(controller.mult) {
        result = pow(data.x, controller.source) *
                 pow(data.y, controller.angle)  *
                 pow(data.z, controller.amount);
    } else {
        float divider = max(1.0, controller.source + controller.angle + controller.amount);
        result = (data.x * controller.source +
                  data.y * controller.angle  +
                  data.z * controller.amount) /
                  divider;
    }
    return max(0.0, min(result, 1.0));
}

vec3 getColor(vec4 data) {
    float h = getComponent(data, hueController);
    float s = getComponent(data, saturationController);
    float b = getComponent(data, brightnessController);

    // Hue modifications
    h += general.hue;

    // Bri modifications
    b = pow(b, power);
    b = b * general.brightness;

    // Sat modifications
    s *= general.saturation;

    vec3 color = hsv2rgb(vec3(h, s, b));

    return color;
}



void main()
{
    vec3 color;
    vec4 data;

    if(!multisampling) {
        data = texture2D(texture, texCoord);
    } else {
        float xStep = 1.0 / viewport.x;
        float yStep = 1.0 / viewport.y;

        float xOffset = 3.0 * xStep / 8.0;
        float yOffset = 3.0 * yStep / 8.0;

        data =  texture2D(texture, texCoord + vec2(-xOffset, -yOffset / 2.0));
        data += texture2D(texture, texCoord + vec2(xOffset / 2.0, -yOffset));
        data += texture2D(texture, texCoord + vec2(-xOffset / 2.0, yOffset));
        data += texture2D(texture, texCoord + vec2(xOffset, yOffset / 2.0));
        data /= 4.0;
    }
    color = getColor(data);

    gl_FragColor = vec4(color, 1.0);
}