import GLC from './GLC'

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'

import postProcessShaderSource from '../GL/shaders/post.frag'

import { getTextureAttributes, getAttributeValue, setUniforms, updateAttributeValue, mergeAttributes } from './ControllerAttributes';

class TextureController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////
    constructor() {
        // Helper function for calculating a random offset
        // The random offset is used to ensure that the different noise
        // functions do not have the same origin. This also doubles as a random seed
        const randomOffset = () => {
            return [Math.random() * 1000, Math.random() * 1000, 1.0];
        };

        // A reference to the canvas element that holds the WebGL context
        this.canvas = null;

        // Set to true once the controller is initialized
        // Many actions are unavailable until then
        this.initialized = false;

        // Shader program for rendering the texture
        this.program = null;

        // Random offsets for each layer
        this.sourceOffset = randomOffset();
        this.angleOffset  = randomOffset();
        this.amountOffset = randomOffset();

        // The position of the internal view and the dimensions of the canvas
        this.position = [0, 0];
        this.dimensions = [window.innerWidth, window.innerHeight];

        // Time and pause state for animation
        this.paused = false; // No time is updated if paused is set to true
        this.sourceTime = 0.0;
        this.angleControlTime = 0.0;
        this.amountControlTime = 0.0;

        // Current attributes of the texture controller
        // These are the general settings of the shader, and most of them directly correspond
        // to shader uniforms. 
        this.attributes = 
            //getRandomAttributes();
            getTextureAttributes();
        this.defaultAttributes = getTextureAttributes();

        this.previousResolution = 1.0;

        // Used for saving the canvas as an image
        this.captureNext = false; // True if next frame should be captured
        this.dataCallback = null; // The callback function that should be used to return the contents 
                                  // of the render

        // Values used for multisampling
        // A framebuffer is used and a texture with double the size of the canvas is 
        // bound as render texture. This texture is then downsampled using linear filtering
        // to achieve a multisampling effect
        this.multisamplingMultiplier = 2.0; 
        this.multisamplingDimensions = [-1, -1];
        this.fbo = -1;
    }

    isInitialized() {
        return this.initialized;
    }

    _createShader(vertexShaderSource, fragmentShaderSource) {
        const program = GLC.compileAndLinkShader(vertexShaderSource, fragmentShaderSource);
        GLC.flush();
        if(!program) {
            throw new Error("Shader not created");
        }
        return program;
    }

    // Initializes the WebGL context and loads the GPU with vertex data
    initialize(canvas, program, pp) {
        if(this.initialized) {
            console.log("The texture controller is already initialized");
            return true;
        }

        console.log("Initializing texture controller");

        this.canvas = canvas;

        // COMPILE SHADERS
        console.log("Compiling shaders");

        // Create the shader program using the imported shaders
        //this.program = this._createShader(vertexShaderSource, fragmentShaderSource);
        //this.postProcessingProgram = this._createShader(vertexShaderSource, postProcessShaderSource);
        this.program = program;
        this.postProcessingProgram = pp;

        // Setup full screen quad
        console.log("Initializing vertex data");

        GLC.createFullScreenQuad();
        GLC.setQuadAttributeLayout(this.program, "vertPosition");
        GLC.setQuadAttributeLayout(this.postProcessingProgram, "vertPosition", "inTexCoord");

        // SET SHADER UNIFORMS 
        console.log("Setting uniforms");

        GLC.setShaderProgram(this.program);
        setUniforms(this.attributes, this.program);

        // Finally, set internal states
        console.log("Done initializing texture controller");

        this.initialized = true;

        // Sets up frame buffer for multisampling
        this._setupFramebuffer();

        return true;
    };

    // Initialize a frame buffer using the current dimensions
    // Used for multisampling
    _setupFramebuffer() {
        // If initialzied, delete the existing texture and frame buffer
        if(this.renderTexture) {
            GLC.deleteTexture(this.renderTexture);
            GLC.deleteFramebuffer(this.fbo);
        }

        // Calculate the dimensions of the multisample texture
        this.multisamplingDimensions = [
            this.dimensions[0] * this.multisamplingMultiplier,
            this.dimensions[1] * this.multisamplingMultiplier
        ];

        const createRenderTexture = (width, height) => {
            const gl = GLC.getGL();
            return GLC.createTexture(width, height, gl.RGBA, gl.RGBA32F, gl.FLOAT);
        };

        // Create the render texture
        this.renderTexture = 
            this.getValue("multisampling") 
            ? createRenderTexture(this.multisamplingDimensions[0], this.multisamplingDimensions[1])
            : createRenderTexture(this.dimensions[0], this.dimensions[1]);

        // Create the frame buffer
        this.fbo = GLC.createFramebuffer(this.renderTexture);
    }

    ///////////////////
    // IMPORT/EXPORT //
    ///////////////////

    // Exports the attributes as a JSON file
    exportSettings() {
        return JSON.stringify(this.attributes, null, 2);
    }

    // Import new attributes from a JSON string
    importSettings(jsonString) {
        var imported = JSON.parse(jsonString);

        // Use default settings when merging
        this.attributes = mergeAttributes(getTextureAttributes(), imported);

        // Update all uniforms with the new settings
        setUniforms(this.attributes, this.program);
    }

    // Used to capture the next frame of animation
    // The data callback function will be used to return the result
    captureFrame(dataCallback) {
        this.captureNext = true;
        this.dataCallback = dataCallback;
    }

    /////////////////////
    // DATA MANAGEMENT //
    /////////////////////

    // Returns a value from the attribute object
    // Used to query the internal state of the texture controller
    getValue(location) {
        return getAttributeValue(this.attributes, location);
    }

    // Returns the default (initial) value
    getDefault(location) {
        return getAttributeValue(this.defaultAttributes, location);
    }

    getDimensions() {
        return this.dimensions;
    }

    getPosition() {
        return this.position;
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(location, value) {
        //TODO create some form of callback to sliders that force them to re-read when a value is changed?!

        const result = updateAttributeValue(this.attributes, this.program, location, value)

        if(location === "multisampling") { //TODO ugly 
            this._handleUpdate(true);
        }

        return result;
    }

    // Set position of internal view
    setPosition(position) {
        if(!this.initialized) return;

        // Update controller reference
        this.position[0] = position[0];
        this.position[1] = position[1];
        
        // And set the corresponding uniform
        GLC.setShaderProgram(this.program);
        GLC.setUniform(this.program, "position", "2fv", position);
    }

    // Pauses and unpauses the animation
    setPaused(paused) {
        this.paused = paused;
    }

    _handleUpdate(forceFramebufferSetup = false) {
        //TODO add some kind of hook for only updating resolution/scale when necessary
        const oldWidth = this.dimensions[0];
        const oldHeight = this.dimensions[1];

        const resolution = this.getValue("resolution");

        // Set the dimensions to that of the inner window size, since the canvas covers everything
        const newWidth      = resolution * window.innerWidth;
        const newHeight     = resolution * window.innerHeight;
        const newDimensions = [newWidth, newHeight];

        // Update the position to preserve the center of the view on resize
        /*const position = this.getPosition();
        const offset = this.screenSpaceToViewSpace([
            0,
            (newHeight - oldHeight) / 4.0
        ]);

        this.setPosition([position[0] + offset[0], position[1] + offset[1]]);
        */

        // Update values
        GLC.setViewport(newWidth, newHeight);
        this.canvas.style.width = window.innerWidth;
        this.canvas.style.height = window.innerHeight;

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        GLC.setUniform(this.program, "viewport", "2fv", newDimensions);

        this.dimensions = newDimensions;
        this.previousResolution = resolution;

        // Re-create the framebuffer and render texture to fit the new size
        if(forceFramebufferSetup || oldWidth !== newWidth || oldHeight !== newHeight || resolution !== this.previousResolution) {
            this._setupFramebuffer();
        }
    }

    //////////////
    // RESIZING //
    //////////////

    handleResize() {
        if(!this.initialized) return;

        this._handleUpdate();
    }

    screenSpaceToViewSpace(position) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Calculate the proportions of the screen
        const proportions = height / width;

        // Scale and correct for proportions
        return [position[0] / width, position[1] * proportions / height];
    }

    ///////////////
    // RENDERING //
    ///////////////

    // Render to the canvas
    render(delta) {
        GLC.setShaderProgram(this.program);

        // Do not increment time if the animation is paused
        if(!this.paused) {
            // Increment the "time" based on the time passed since last frame 
            const animationSpeed = this.getValue("animationSpeed.general");
            this.sourceTime        += animationSpeed * this.getValue("animationSpeed.source") * delta;
            this.angleControlTime  += animationSpeed * this.getValue("animationSpeed.angleControl") * delta;
            this.amountControlTime += animationSpeed * this.getValue("animationSpeed.amountControl") * delta;
        }

        // Update shader uniforms
        GLC.setUniform(this.program, "source.offset",        "3fv", [this.sourceOffset[0], this.sourceOffset[1], this.sourceTime]);
        GLC.setUniform(this.program, "angleControl.offset",  "3fv", [this.angleOffset[0],  this.angleOffset[1], this.angleControlTime]);
        GLC.setUniform(this.program, "amountControl.offset", "3fv", [this.amountOffset[0], this.amountOffset[1], this.amountControlTime]);

        GLC.bindFramebuffer(this.fbo);

        // Set the view port to the extended dimensions
        if(this.getValue("multisampling")) {
            GLC.setViewport(this.multisamplingDimensions[0], this.multisamplingDimensions[1]); 
            GLC.setUniform(this.program, "viewport", "2fv", this.multisamplingDimensions);
        } else {
            GLC.setViewport(this.dimensions[0], this.dimensions[1]); 
            GLC.setUniform(this.program, "viewport", "2fv", this.dimensions);
        }

        // Render to the frame buffer
        GLC.renderFullScreenQuad(this.program);

        // Bind the default frame buffer
        GLC.bindFramebuffer(null);
        GLC.setViewport(this.canvas.width, this.canvas.height); 

        // Use the post processing program, which will sample the texture which we previously rendered to
        GLC.setShaderProgram(this.postProcessingProgram);

        // Bind and activate the texture
        GLC.setTexture(this.renderTexture, 0);

        // Tell the shader we bound the texture to texture unit 0
        //gl.uniform1i(programInfo.uniformLocations.uSampler, 0);
        GLC.setUniform(this.postProcessingProgram, "texture", "1i", 0);

        GLC.renderFullScreenQuad(this.postProcessingProgram);

        GLC.setShaderProgram(this.program);

        // Capture the frame if requested
        if(this.captureNext) {
            this.captureNext = false;
            var captureData = this.canvas.toDataURL("image/png");
            this.dataCallback(captureData);
        }

        return {
            framebuffer: this.fbo,
            renderTexture: this.renderTexture
        }
    }
}

// Initialize a global instance of the texture controller, and export
const TXC = new TextureController();
export default TXC;