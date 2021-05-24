import { 
    getRenderAttributes, 
    AttributeController, 
} from './ControllerAttributes';

class RenderController extends AttributeController {
    constructor() {
        super(getRenderAttributes);
        this.initialized = false;

        // Render dimensions
        this.dimensions = [window.innerWidth, window.innerHeight];

        // Resolution controls the relationship between the canvas size and the
        // actual texture resolution
        this.previousResolution = 1.0;
        this.resolution = 1.0;

        this.canvas = null;

        this.resizeCallback = null;
        
        // Multisample handling
        this.multisamplingMultiplier = 2.0; 
        this.multisamplingDimensions = [-1, -1];

        // FBO and texture control
        this.fbo = null;
        this.renderTexture = null;

        this.initialized = false;
    }
    
    initialize(canvas, GLC) {
        if(this.initialized) {
            console.log("The render controller is already initialized");
            return true;
        }

        this.canvas = canvas;
        this.GLC = GLC;

        // Update dimensions and create a new FBO
        this._handleUpdate(true);

        this.initialized = true;

        return true;
    }

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

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(location, value) {
        //TODO create some form of callback to sliders that force them to re-read when a value is changed?!
        const result = super.updateValue(location, value);
        //updateAttributeValue(this.attributes, this.program, location, value, this.GLC)

        if(location === "multisampling" || location === "resolution") { //TODO ugly 
            this._handleUpdate(true);
        }

        return result;
    }

    getDimensions() {
        return this.dimensions;
    }

    getRenderTextureDimensions() {
        // The size of the render texture depends on if multisampling is used or not
        return this.getValue("multisampling") 
            ? this.multisamplingDimensions
            : this.dimensions;
    }

    getRenderTexture() {
        return this.renderTexture;
    }

    getFrameBuffer() {
        return this.fbo;
    }


    //////////////
    // RESIZING //
    //////////////

    _handleUpdate(forceFramebufferSetup = false) {
        //TODO add some kind of hook for only updating resolution/scale when necessary
        const oldWidth = this.dimensions[0];
        const oldHeight = this.dimensions[1];

        const resolution = this.getValue("resolution");

        // Set the dimensions to that of the inner window size, since the canvas covers everything
        const newWidth      = resolution * window.innerWidth;
        const newHeight     = resolution * window.innerHeight;
        const newDimensions = [newWidth, newHeight];

        // Update values
        this.GLC.setViewport(newWidth, newHeight);
        this.canvas.style.width = window.innerWidth;
        this.canvas.style.height = window.innerHeight;

        this.canvas.width = newWidth;
        this.canvas.height = newHeight;

        this.dimensions = newDimensions;
        this.previousResolution = resolution;

        // Re-create the framebuffer and render texture to fit the new size
        if(forceFramebufferSetup || oldWidth !== newWidth || oldHeight !== newHeight || resolution !== this.previousResolution) {
            this._setupFramebuffer();
            this.resizeCallback && this.resizeCallback(this.dimensions);
        }
    }

    handleResize() {
        if(!this.initialized) return;
        this._handleUpdate();
    }

    addResizeCallback(callback) {
        callback(this.dimensions);

        const previousCallback = this.resizeCallback;
        this.resizeCallback = (dimensions) => {
            previousCallback && previousCallback(dimensions);
            callback(dimensions);
        }
    }

    screenSpaceToViewSpace(position) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Calculate the proportions of the screen
        const proportions = height / width;

        // Scale and correct for proportions
        return [position[0] / width, position[1] * proportions / height];
    }
}

export {
    RenderController
};