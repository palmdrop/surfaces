import GLC from './GLC'

// Noise-related imports, these functions and objects
// are adapted to work well with GLSL structs in the warp shader
import { noiseTypes, setNoiseSettings, createNoiseSettings, createModifications } from '../tools/NoiseSettings';

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'

class TextureController {
    constructor() {
        this.initialized = false;
        this.program = -1;
        this.offset = null;
        this.canvas = null;

        this.time = 0.0;
        this.previousMillis = 0;
        this.animationFrameId = -1;

        this.attributes = {
            animationSpeed: {
                value: 0.2,
                isUniform: false,

                min: 0.0,
                max: 2,
            },
            warpIterations: {
                value: 2,
                isUniform: true,
                location: "iterations",
                type: "1i",

                min: 0,
                max: 4,
            },
            warpAmount: {
                value: 100,
                isUniform: true,
                location: "warpAmount",
                type: "1f",

                min: 0.0,
                max: 1000
            },
            sourceFrequency: {
                value: 0.01,
                isUniform: true,
                location: "source.frequency",
                type: "1f" ,

                min: 0.0000001,
                max: 0.035
            },
            angleFrequency: {
                value: Math.random() * 0.01,
                isUniform: true,
                location: "angleControl.frequency",
                type: "1f",

                min: 0.0000001,
                max: 0.035
            },
            amountFrequency: {
                value: Math.random() * 0.01,
                isUniform: true,
                location: "amountControl.frequency",
                type: "1f",

                min: 0.0000001,
                max: 0.035
            },
            ridgeThreshold: {
                value: 1.0,
                isUniform: true,
                location: [
                    "source.modifications.ridgeThreshold",
                    "angleControl.modifications.ridgeThreshold",
                    "amountControl.modifications.ridgeThreshold"
                ],
                type: "1f",

                min: 0.5,
                max: 1.0
            },            
            octaves: {
                value: 5,
                isUniform: true,
                location: "octaves",
                type: "1i",

                min: 1,
                max: 5,
                step: 2,
                marks: [1, 3, 5]
            },
            multisampling: {
                value: 0,
                isUniform: true,
                location: "multisampling",
                type: "1i",

                min: 0,
                max: 1
            }
        };
    }

    // Set all the uniforms in the "value" object 
    setUniforms() {
        if(!this.initialized) return;
        for (var name in this.attributes) {
            if(Object.prototype.hasOwnProperty.call(this.attributes, name)) {
                this.setUniform(this.attributes[name]);
            }
        }
    }

    // Set a specific uniform, if it exists
    setUniform(attribute) {
        // Return if the value has no corresponding uniform, or if the texture controller is not initialized
        if(!attribute.isUniform || !this.initialized) return;

        // Check if "location" is an array 
        if(attribute.location.constructor === Array) {
            // Iterate over all the locations in the array, and set the uniform
            for(const l of attribute.location) {
                GLC.setUniform(this.program, l, attribute.type, attribute.value);
            }
        } else {
            // Otherwise, just set the one uniform
            GLC.setUniform(this.program, attribute.location, attribute.type, attribute.value);
        }
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(name, v) {
        var attribute = this.attributes[name];
        if(attribute.value === v) return;

        attribute.value = v;
        this.setUniform(attribute);
    }

    // Returns a value 
    getValue(name) {
        if(Object.prototype.hasOwnProperty.call(this.attributes, name)) {
            return this.attributes[name].value;
        }
        return undefined;
    }

    isInitialized() {
        return this.initialized;
    }

    // Initializes the openGL context and loads the GPU with vertex data
    initialize(canvas) {
        if(this.initialized) {
            console.log("The texture controller is already initialized");
            return 0;
        }

        // INITIALIZE THE OPENGL CONTEXT
        console.log("Initializing webgl context");

        // If the canvas is null, we cannot proceed. Abort.
        if(!canvas) {
            console.log("The canvas is not initialized")
            return -1;
        }

        this.canvas = canvas;

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
        console.log("Initializing webgl controller (GLC)");

        // This class is used as a facade against the webgl context
        GLC.init(canvas, gl);


        // COMPILE SHADERS
        console.log("Compiling shaders");

        // Create the shader program using the imported shaders
        this.program = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);

        if(!this.program) {
            throw new Error("Shader not created");
        }

        // INITIIALIZE VERTEX DATA
        console.log("Initializing vertex data");

        // Create triangle data
        // Two triangles are created to form a quad which fills the entire screen
        const triangleVertices = 
        [
            -1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,

            -1.0,  1.0,
             1.0,  1.0,
             1.0, -1.0,
        ];

        GLC.createBuffer(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
        GLC.setAttribLayout(
            this.program, 
            'vertPosition',
            2,
            gl.FLOAT,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        // DEFINE VALUES
        console.log("Setting uniforms");

        // TODO move this to sliders and user input etc
        const modifications = createModifications(this.attributes.ridgeThreshold.value);

        const offset = [Math.random() * 1000, Math.random() * 1000, 1.0];
        const source        = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.attributes.sourceFrequency.value, offset, 1.0, modifications);
        const angleControl  = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.attributes.angleFrequency.value, offset, 1.0, modifications);
        const amountControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.attributes.amountFrequency.value, offset, 1.0, modifications);

        // SET SHADER UNIFORMS 
        GLC.setShaderProgram(this.program);

        // Set noise settings
        setNoiseSettings(source,        this.program, "source");
        setNoiseSettings(angleControl,  this.program, "angleControl");
        setNoiseSettings(amountControl, this.program, "amountControl");

        this.setUniform(this.attributes.octaves);

        // Finally, set required states
        this.initialized = true;
        this.offset = offset;

        this.time = 0.0;
        this.previousMillis = Date.now();

        // Update uniform values
        this.setUniforms();

        console.log("Done initializing texture controller");

        return 0;
    };

    handleResize() {
        if(!this.initialized) return;
        GLC.setViewport(window.innerWidth, window.innerHeight);
        //GLC.setUniform(this.program, "viewport", "2fv", [window.innerWidth, window.innerHeight]);
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
            this.time += this.attributes.animationSpeed.value * deltaMillis / 1000;

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