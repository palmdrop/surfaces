precision mediump float;

varying vec3 fragColor;
varying vec2 texCoord;

uniform sampler2D texture;

void main()
{
    //gl_FragColor = vec4(texCoord, 1.0, 1.0);
    gl_FragColor = texture2D(texture, texCoord);
}