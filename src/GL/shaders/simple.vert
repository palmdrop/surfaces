precision mediump float;

attribute vec2 vertPosition;
attribute vec2 inTexCoord;

attribute vec3 vertColor;

varying vec3 fragColor;
varying vec2 texCoord;

void main() 
{
    fragColor = vertColor;
    texCoord = inTexCoord;
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}