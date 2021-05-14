#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

/////////////
// IMPORTS //
/////////////
#pragma glslify: hsv2rgb = require(glsl-hsv2rgb)

///////////////////
// COLOR CONTROL //
///////////////////
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

    float red;
    float green;
    float blue;
};

uniform float power;
uniform ColorBalance general;

uniform ComponentController hueController;
uniform ComponentController saturationController;
uniform ComponentController brightnessController;

///////////////
// DITHERING //
///////////////
uniform float ditheringAmount;
uniform bool hasDitheringTexture;
uniform highp sampler2D ditheringTexture;
uniform vec2  ditheringTextureDimensions;

//////////////////
// MAIN TEXTURE //
//////////////////
varying vec2 texCoord;
uniform highp sampler2D texture;

//////////
// MISC //
//////////
uniform float time;
uniform vec2 viewport;
uniform bool multisampling;

///////////////////
// COLOR CONTROL //
///////////////////

// Returns a single color component
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

vec3 dither(vec3 value) {
    if(hasDitheringTexture) {
        vec2 ditheringCoord = gl_FragCoord.xy / ditheringTextureDimensions + vec2(fract(time * 13.41), fract(time * 3.451));
        vec3 ditherValue = texture2D(ditheringTexture, ditheringCoord).rgb;

        ditherValue = ditherValue * 2.0 - 1.0;
        ditherValue = sign(ditherValue) * (1.0 - sqrt(1.0 - abs(ditherValue)));

        value += ditheringAmount * ditherValue;
    }
    return value;
}

// Converts from linear color space to SRGB
vec3 linearToSRGB(vec3 linearRGB){
    float limit = 0.0031308;
    if(linearRGB.r < limit && linearRGB.g < limit && linearRGB.b < limit) {
        return 12.92 * linearRGB;
    } else {
        return 1.055 * 
            vec3(pow(linearRGB.r, 1.0 / 2.4) - 0.055,
                 pow(linearRGB.g, 1.0 / 2.4) - 0.055,
                 pow(linearRGB.b, 1.0 / 2.4) - 0.055);
    }
}

// Converts from sRGB to linear color space
vec3 sRGBToLinear(vec3 sRGB) {
    float limit = 0.04045;
    if(sRGB.r < limit && sRGB.g < limit && sRGB.b < limit) {
        return sRGB / 12.92;
    } else {
        return vec3(
            pow(sRGB.r * (1.0 / 1.055) + 0.055 / 1.055, 2.4),
            pow(sRGB.g * (1.0 / 1.055) + 0.055 / 1.055, 2.4),
            pow(sRGB.b * (1.0 / 1.055) + 0.055 / 1.055, 2.4)
        );
    }
}

// Returns the resulting color using the data from the previous render pass
vec3 getColor(vec4 data) {
    float h = getComponent(data, hueController);
    if(h > 1.0) h = fract(h);
    else if(h < 1.0) h = 1.0 - fract(h);

    float s = getComponent(data, saturationController);
    s = max(0.0, min(s, 1.0));

    float b = getComponent(data, brightnessController);
    b = max(0.0, min(b, 1.0));

    // Hue modifications
    h += general.hue;

    // Bri modifications
    b = pow(b, power);
    b = b * general.brightness;

    // Sat modifications
    s *= general.saturation;

    vec3 color = hsv2rgb(vec3(h, s, b));

    // RGB modifications
    color.r *= pow(general.red,   general.saturation);
    color.g *= pow(general.green, general.saturation);
    color.b *= pow(general.blue,  general.saturation);

    // Dithering
    if(ditheringAmount > 0.0) {
        return sRGBToLinear(dither(linearToSRGB(color)));
    } else {
        return color;
    }
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
