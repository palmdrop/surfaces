import GLC from '../GL/GLC'

// Noise-related imports, these functions and objects
// are adapted to work well with GLSL structs in the warp shader
import { noiseTypes, setNoiseSettings, createNoiseSettings } from '../GL/noise/NoiseSettings';

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'

class TextureController {
    constructor() {
        this.initialized = false;
        this.program = -1;
        this.offset = null;

        this.warpAmount = 100;
        this.sourceFrequency = 0.01;
    }

    /*get initialized() {
        return this.initialized;
    }
    get program() {
        return this.program;
    }

    set warpAmount(warpAmount) {
        this.warpAmount = warpAmount;
    }*/
    isInitialized() {
        return this.initialized;
    }

    // Initializes the openGL context and loads the GPU with vertex data
    initialize(canvas) {
        if(this.initialized) return 0;

        // INITIALIZE THE OPENGL CONTEXT

        // If the canvas is null, we cannot proceed. Abort.
        if(!canvas) {
            console.log("The canvas is not initialized")
            return -1;
        }

        // Get the webgl context
        let gl = canvas.getContext('webgl');

        // If no context was retrieved, try experimental webgl
        if(!gl) {
            console.log('Webgl not supported, falling back on experimental-webgl');
            gl = canvas.getContext('experimental-webgl');
        }

        // If there's still no context, abort
        if(!gl) {
            alert("Your browser does not support WebGL");
            return -1;
        }

        // INITIALIZE GLC (HELPER CLASS)

        // This class is used as a facade against the webgl context
        GLC.init(canvas, gl);

        // Create the shader program using the imported shaders
        this.program = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);

        if(!this.program) {
            throw new Error("Shader not created");
        }

        // Create triangle data
        // Two triangles are created to form a quad which fills the entire screen
        const triangleVertices = 
        [
            -1.0,  1.0,   //1.0, 1.0, 0.0,
            -1.0, -1.0,   //0.0, 1.0, 1.0,
             1.0, -1.0,   //1.0, 0.0, 1.0,

            -1.0,  1.0,   //1.0, 1.0, 0.0,
             1.0,  1.0,   //0.0, 0.0, 1.0,
             1.0, -1.0,   //1.0, 0.0, 1.0
        ];

        GLC.createBuffer(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
        GLC.setAttribLayout(
            this.program, 
            'vertPosition',
            2,
            gl.FLOAT,
            //5 * Float32Array.BYTES_PER_ELEMENT,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        /*GLC.setAttribLayout(
        p,
        'vertColor',
        3,
        gl.FLOAT,
        5 * Float32Array.BYTES_PER_ELEMENT,
        2 * Float32Array.BYTES_PER_ELEMENT
        );*/

        // DEFINE VALUES
        // TODO move this to sliders and user input etc
        const offset = [Math.random() * 1000, Math.random() * 1000, 1.0];
        const source = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.sourceFrequency, offset, 1.0);
        const angleControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 1.0);
        const amountControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 1.0);
        const amount = 100;
        const iterations = 2;

        // SET SHADER UNIFORMS 
        GLC.setShaderProgram(this.program);

        // Set noise settings
        setNoiseSettings(source, this.program, "source");
        setNoiseSettings(angleControl, this.program, "angleControl");
        setNoiseSettings(amountControl, this.program, "amountControl");
        
        // Set other data
        GLC.setUniform(this.program, "amount", "1f", amount);
        GLC.setUniform(this.program, "time", "1f", 0.0);
        GLC.setUniform(this.program, "iterations", "1i", iterations);

        // Finally, set required states
        this.initialized = true;
        this.offset = offset;

        return 0;
    };

    handleResize() {
        if(!this.initialized) return;
        GLC.setViewport(window.innerWidth, window.innerHeight);
    }

    // Short function for rendering the quad to the entire screen
    renderQuad() {
        GLC.setShaderProgram(this.program);
        GLC.clear(0, 0.0, 0.0, 1);
        GLC.draw(6);
    }

    // Render
    render(time) {
      // Update shader uniforms
      GLC.setUniform(this.program, "source.offset",        "3fv", [this.offset[0], this.offset[1], time * 1.0]);
      GLC.setUniform(this.program, "angleControl.offset",  "3fv", [this.offset[0], this.offset[1], time * 0.5]);
      GLC.setUniform(this.program, "amountControl.offset", "3fv", [this.offset[0], this.offset[1], time * 2]);
      GLC.setUniform(this.program, "time", "1f", time);
      GLC.setUniform(this.program, "amount", "1f", this.warpAmount);

      GLC.setUniform(this.program, "source.frequency", "1f", this.sourceFrequency);

      // Render
      this.renderQuad();
    }
}

const TXC = new TextureController();

export default TXC;