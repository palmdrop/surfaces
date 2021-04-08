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

        //TODO move this to JSON file?
        this.attributes = {
            animationSpeed: {
                value: 0.2,
                isUniform: false,

                min: 0.0,
                max: 2,
            },
            iterations: {
                value: 2,
                isUniform: true,
                type: "1i",

                min: 0,
                max: 4,
            },
            warpAmount: {
                value: 100,
                isUniform: true,
                type: "1f",

                min: 0.0,
                max: 1000
            },
            octaves: {
                value: 5,
                isUniform: true,
                type: "1i",

                min: 1,
                max: 5,
                step: 2,
                marks: [1, 3, 5]
            },
            multisampling: {
                value: 0,
                isUniform: true,
                type: "1i",

                min: 0,
                max: 1
            },
            source: {
                value: {
                    frequency: {
                        value: 0.01,
                        type: "1f",
                        min: 0.0000001,
                        max: 0.035
                    },
                    modifications: {
                        value: {
                            ridgeThreshold: {
                                value: 1.0,
                                type: "1f",
                                min: 0.5,
                                max: 1.0,
                            },
                            pow: {
                                value: 1.0,
                                type: "1f",
                                min: 0.0,
                                max: 5
                            }
                        },
                    }
                },
                isUniform: true,
            },
            angleControl: {
                value: {
                    frequency: {
                        value: Math.random() * 0.01,
                        min: 0.0000001,
                        max: 0.035,
                        type: "1f",
                    },
                    modifications: {
                        value: {
                            ridgeThreshold: {
                                value: 1.0,
                                type: "1f",
                                min: 0.5,
                                max: 1.0,
                            },
                            pow: {
                                value: 1.0,
                                type: "1f",
                                min: 0.0,
                                max: 5
                            }
                        },
                    }
                },
                isUniform: true,
            },
            amountControl: {
                value: {
                    frequency: {
                        value: Math.random() * 0.01,
                        min: 0.0000001,
                        max: 0.035,
                        type: "1f"
                    },
                    modifications: {
                        value: {
                            ridgeThreshold: {
                                value: 1.0,
                                type: "1f",
                                min: 0.5,
                                max: 1.0,
                            },
                            pow: {
                                value: 1.0,
                                type: "1f",
                                min: 0.0,
                                max: 5
                            },
                        },
                    }
                },
                isUniform: true,
            },
        };
    }

    getAttribute(location) {
        // Helper function for checking if an object contains a specific property
        const hasProperty = (object, property) => {
            return Object.prototype.hasOwnProperty.call(object, property);
        }

        var subLocations = location.split(".");

        // Check if attribute exists in main attributes object
        if(!hasProperty(this.attributes, subLocations[0])) return undefined;

        // Get the current attribute
        var currentAttribute = this.attributes[subLocations[0]];

        // If there's more sub-locations in the query, iterate through them
        // until the bottom level is found
        for(var i = 1; i < subLocations.length; i++) {
            // Verify that the new attribute is an object (if not, the query is invalid)
            if(!(typeof currentAttribute === "object")) return undefined;

            // Check if the attribute contains the requested attribute 
            if(!hasProperty(currentAttribute.value, subLocations[i])) return undefined;

            // Get the value property of the attribute, since this will contain the next iteration
            currentAttribute = currentAttribute.value[subLocations[i]];
        }

        return [this.attributes[subLocations[0]].isUniform, currentAttribute];
    }

    // Returns a value 
    getValue(name) {
        const [_, v] = this.getAttribute(name);
        if(typeof v === "undefined") return undefined;
        return v.value;
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(name, v) {
        // Find the requested attribute, or return if it does not exist
        const [isUniform, attribute] = this.getAttribute(name);
        if(typeof v === "undefined") return -1;

        // Do nothing if the value is unchanged
        if(attribute.value === v) return;

        // Set the new value, and set the corresponding uniform
        attribute.value = v;

        //TODO assume an attribute is a uniform if the root level is
        if(isUniform) {
            GLC.setUniform(this.program, name, attribute.type, attribute.value);
        }
    }

    // Set all the uniforms in the "value" object 
    setUniforms() {
        if(!this.initialized) return;
        for (var name in this.attributes) {
            if(Object.prototype.hasOwnProperty.call(this.attributes, name)) {
                this.setUniform(this.attributes[name], name);
            }
        }
    }

    // Set a specific uniform, if it exists
    setUniform(attribute, name) {
        // Return if the value has no corresponding uniform, or if the texture controller is not initialized
        // Also, if the root level object is a uniform, assume all children are too
        if(!attribute.isUniform || !this.initialized) return;

        const setAll = (current, location) => {
            if(typeof current.value === "object") {
                for(var name in current.value) {
                    if(Object.prototype.hasOwnProperty.call(current.value, name)) {
                        setAll(current.value[name], location + "." + name);
                    }
                }
            } else {
                GLC.setUniform(this.program, location, current.type, current.value);
            }
        };

        setAll(attribute, name);
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
        const modifications = createModifications(this.getValue("source.modifications.ridgeThreshold"), 1.0);
            //this.attributes.ridgeThreshold.value);

        const offset = [Math.random() * 1000, Math.random() * 1000, 1.0];

        //TODO add controllers for all fields in noise settings!
        const source        = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.getValue("source.frequency"), offset, modifications);
        const angleControl  = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.getValue("angleControl.frequency"), offset, modifications);
        const amountControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, this.getValue("amountControl.frequency"), offset, modifications);

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

      //TODO add control for separate time increments
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