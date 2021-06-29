//import GLC from '../GLC'

import { 
    getTextureAttributes, 
    AttributeController, 
} from '../ControllerAttributes';

class TextureController extends AttributeController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////
    constructor() {
        super(getTextureAttributes);

        // Helper function for calculating a random offset
        // The random offset is used to ensure that the different noise
        // functions do not have the same origin. This also doubles as a random seed
        const randomOffset = () => {
            return [Math.random() * 1000, Math.random() * 1000, 1.0];
        };

        // A reference to the canvas element that holds the WebGL context
        this.canvas = null;
        this.GLC = null;

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

        this.previousResolution = 1.0;

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

    // Initializes the WebGL context and loads the GPU with vertex data
    initialize(canvas, program, GLC) {
        if(this.initialized) {
            console.log("The texture controller is already initialized");
            return true;
        }

        console.log("Initializing texture controller");

        this.GLC = GLC;
        this.canvas = canvas;

        // COMPILE SHADERS
        console.log("Compiling shaders");

        // Create the shader program using the imported shaders
        this.program = program;

        // SET SHADER UNIFORMS 
        console.log("Setting uniforms");

        this.GLC.setShaderProgram(this.program);
        this._setUniforms();

        // Finally, set internal states
        console.log("Done initializing texture controller");

        this.initialized = true;

        // Update necessary values
        //this._handleUpdate(true);

        return true;
    };

    // Initialize a frame buffer using the current dimensions
    // Used for multisampling
    _setupFramebuffer() {
        // If initialzied, delete the existing texture and frame buffer
        if(this.renderTexture) {
            this.GLC.deleteTexture(this.renderTexture);
            this.GLC.deleteFramebuffer(this.fbo);
        }

        // Calculate the dimensions of the multisample texture
        this.multisamplingDimensions = [
            this.dimensions[0] * this.multisamplingMultiplier,
            this.dimensions[1] * this.multisamplingMultiplier
        ];

        const createRenderTexture = (width, height) => {
            const gl = this.GLC.getGL();
            return this.GLC.createTexture(width, height, gl.RGBA, gl.RGBA32F, gl.FLOAT);
            //return GLC.createTexture(width, height, gl.RGBA, gl.RGBA8, gl.UNSINGED_BYTE);
        };

        // Create the render texture
        this.renderTexture = 
            this.getValue("multisampling") 
            ? createRenderTexture(this.multisamplingDimensions[0], this.multisamplingDimensions[1])
            : createRenderTexture(this.dimensions[0], this.dimensions[1]);

        // Create the frame buffer
        this.fbo = this.GLC.createFramebuffer(this.renderTexture);
    }

    /////////////////////
    // DATA MANAGEMENT //
    /////////////////////
    getDimensions() {
        return this.dimensions;
    }

    getPosition() {
        return this.position;
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(location, value) {
        //TODO create some form of callback to sliders that force them to re-read when a value is changed?!
        const result = super.updateValue(location, value);
        //updateAttributeValue(this.attributes, this.program, location, value, this.GLC)

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
        this.GLC.setShaderProgram(this.program);
        this.GLC.setUniform(this.program, "position", "2fv", position);
    }

    // Pauses and unpauses the animation
    setPaused(paused) {
        this.paused = paused;
    }

    ///////////////
    // RENDERING //
    ///////////////

    // Render to the canvas
    render(fbo, dimensions, delta) {
        const GLC = this.GLC;
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

        //GLC.bindFramebuffer(this.fbo);
        GLC.bindFramebuffer(fbo);

        GLC.setViewport(dimensions[0], dimensions[1]);
        GLC.setUniform(this.program, "viewport", "2fv", dimensions);

        // Render to render texture
        GLC.renderFullScreenQuad(this.program);

        return this.renderTexture;
    }
}

// Initialize a global instance of the texture controller, and export
export {
    TextureController
};