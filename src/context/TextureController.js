import GLC from './GLC'

// Noise-related imports, these functions and objects
// are adapted to work well with GLSL structs in the warp shader
import { noiseTypes, setNoiseSettings, createNoiseSettings } from '../tools/NoiseSettings';

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'

class TextureController {
    constructor() {
        this.initialized = false;
        this.program = -1;
        this.offset = null;

        this.warpIterations = 2;
        this.warpAmount = 100;
        this.sourceFrequency = 0.01;

        this.animationSpeed = 1.0;
        this.time = 0.0;
        this.previousMillis = 0;
        this.animationFrameId = -1;
    }

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

        // SET SHADER UNIFORMS 
        GLC.setShaderProgram(this.program);

        // Set noise settings
        setNoiseSettings(source, this.program, "source");
        setNoiseSettings(angleControl, this.program, "angleControl");
        setNoiseSettings(amountControl, this.program, "amountControl");

        // Finally, set required states
        this.initialized = true;
        this.offset = offset;

        this.time = 0.0;
        this.previousMillis = Date.now();

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
      GLC.setUniform(this.program, "time", "1f", time);

      //TODO only update variables that needs to be updated!?!?
      GLC.setUniform(this.program, "source.offset",        "3fv", [this.offset[0], this.offset[1], time * 1.0]);
      GLC.setUniform(this.program, "angleControl.offset",  "3fv", [this.offset[0], this.offset[1], time * 0.5]);
      GLC.setUniform(this.program, "amountControl.offset", "3fv", [this.offset[0], this.offset[1], time * 2]);
      GLC.setUniform(this.program, "amount", "1f", this.warpAmount);
      GLC.setUniform(this.program, "source.frequency", "1f", this.sourceFrequency);
      GLC.setUniform(this.program, "iterations", "1i", this.warpIterations);

      GLC.setUniform(this.program, "source.hasModifications", "1i", 1);
      GLC.setUniform(this.program, "source.modifications.isRidged", "1i", 1);
      GLC.setUniform(this.program, "source.modifications.ridgeThreshold", "1f", 0.5);

      GLC.setUniform(this.program, "angleControl.hasModifications", "1i", 1);
      GLC.setUniform(this.program, "angleControl.modifications.isRidged", "1i", 1);
      GLC.setUniform(this.program, "angleControl.modifications.ridgeThreshold", "1f", 0.5);

      GLC.setUniform(this.program, "amountControl.hasModifications", "1i", 1);
      GLC.setUniform(this.program, "amountControl.modifications.isRidged", "1i", 1);
      GLC.setUniform(this.program, "amountControl.modifications.ridgeThreshold", "1f", 0.5);

      // Render
      this.renderQuad();
    }

    // Simple render loop for animating the canvas
    startRenderLoop() {
        // First, stop the render loop (if it's already running)
        this.stopRenderLoop();

        // Define a function which will be used to request an animation frame
        const renderFrame = () => {
            // Calculate the time passed since last frame
            let now = Date.now();
            let deltaMillis = now - this.previousMillis;

            // Increment the "time" based on the time passed since last frame 
            this.time += this.animationSpeed * deltaMillis / 1000;

            // Render (updates uniforms and renders a quad to the screen)
            this.render(this.time);

            // Update the time, will be used in the next frame
            this.previousMillis = now;

            // Finally, recursively request another animation frame
            this.animationFrameId = requestAnimationFrame(renderFrame);
        }

        //  Call the function once to start the loop
        renderFrame();
    }

    stopRenderLoop() {
        cancelAnimationFrame(this.animationFrameId);
    }
}

const TXC = new TextureController();

export default TXC;