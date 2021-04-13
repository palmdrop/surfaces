import GLC from './GLC'

// Noise-related imports, these functions and objects
// are adapted to work well with GLSL structs in the warp shader
import { noiseTypes, setNoiseSettings, createDefaultNoiseSettings } from '../tools/NoiseSettings';

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'
import { attributes } from './ControllerAttributes';

class TextureController {
    constructor() {
        this.initialized = false;
        this.program = -1;
        this.offset = null;
        this.canvas = null;

        this.time = 0.0;
        this.sourceTime = 0.0;
        this.angleControlTime = 0.0;
        this.amountControlTime = 0.0;

        this.previousMillis = 0;
        this.animationFrameId = -1;

        this.sourceTime = 0.0;

        this.attributes = attributes;

        this.captureNext = false;
        this.dataCallback = null;
    }

    captureFrame(dataCallback) {
        this.captureNext = true;
        this.dataCallback = dataCallback;
    }

    exportSettings() {
        return JSON.stringify(this.attributes, null, 2);
    }

    importSettings(jsonString) {
        //TODO move to util?
        //TODO allow control which object takes precedence, e.g if old does not have a field, do we exclude or include it?

        // Merge the current settings object, which holds the correct format of the settings,
        // with a saved, possibly older version. 
        // The current object will take precedence: a property not existing in current, but existing in changes,
        // will not be added to the updated object
        const mergeSettings = (current, changes) => {
            // Check if the current object is a single value or an array. In that case, update, if 
            // an updated value exists
            if(typeof current !== "object" || Array.isArray(current)) return changes || current;

            // If the changes are null or undefined, use the current object
            if(!changes) return current;

            var updated = {};

            // Iterate over all the properties in the current object, and merge each
            // property with the corresponding property in the changes object
            for(var prop in current) {
                if(Object.prototype.hasOwnProperty.call(current, prop)) {
                    updated[prop] = mergeSettings(current[prop], changes[prop]);
                }
            }

            return updated;
        }
        
        var imported = JSON.parse(jsonString);

        //TODO possibly add a converter class that can convert between
        //TODO older and newever versions of the settings file 
        this.attributes = mergeSettings(this.attributes, imported);
        this.setUniforms();
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
        const [, v] = this.getAttribute(name);
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

        GLC.flush();

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

        // SET SHADER UNIFORMS 
        console.log("Setting uniforms");

        this.offset = [Math.random() * 1000, Math.random() * 1000, 1.0];
        const source        = createDefaultNoiseSettings(noiseTypes.SIMPLEX, 3);
        const angleControl  = createDefaultNoiseSettings(noiseTypes.SIMPLEX, 3);
        const amountControl = createDefaultNoiseSettings(noiseTypes.SIMPLEX, 3);

        GLC.setShaderProgram(this.program);

        // Set noise settings
        setNoiseSettings(source,        this.program, "source");
        setNoiseSettings(angleControl,  this.program, "angleControl");
        setNoiseSettings(amountControl, this.program, "amountControl");

        // Update uniform values
        this.initialized = true;
        this.setUniforms();

        // Finally, set internal states
        this.time = 0.0;
        this.previousMillis = Date.now();

        console.log("Done initializing texture controller");

        return 0;
    };

    handleResize() {
        if(!this.initialized) return;
        GLC.setViewport(window.innerWidth, window.innerHeight);
        GLC.setUniform(this.program, "viewport", "2fv", [window.innerWidth, window.innerHeight]);
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
      GLC.setUniform(this.program, "source.offset",        "3fv", [this.offset[0], this.offset[1], this.sourceTime]);
      GLC.setUniform(this.program, "angleControl.offset",  "3fv", [this.offset[0], this.offset[1], this.angleControlTime]);
      GLC.setUniform(this.program, "amountControl.offset", "3fv", [this.offset[0], this.offset[1], this.amountControlTime]);

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
            let delta = (now - this.previousMillis) / 1000;

            // Increment the "time" based on the time passed since last frame 
            this.time              += this.getValue("animationSpeed.general") * delta;
            this.sourceTime        += this.getValue("animationSpeed.general") * this.getValue("animationSpeed.source") * delta;
            this.angleControlTime  += this.getValue("animationSpeed.general") * this.getValue("animationSpeed.angleControl") * delta;
            this.amountControlTime += this.getValue("animationSpeed.general") * this.getValue("animationSpeed.amountControl") * delta;

            // Render (updates uniforms and renders a quad to the screen)
            this.render(this.time);

            // Update the time, will be used in the next frame
            this.previousMillis = now;

            // Capture the frame if requested
            if(this.captureNext) {
                this.captureNext = false;
                var captureData = this.canvas.toDataURL("image/png");
                this.dataCallback(captureData);
            }

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