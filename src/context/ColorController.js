import GLC from './GLC'


import { getColorAttributes, getAttributeValue, getAttributeDefault, setUniforms, updateAttributeValue, mergeAttributes } from './ControllerAttributes';

class ColorController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////
    constructor() {
        // A reference to the canvas element that holds the WebGL context
        this.canvas = null;

        // Set to true once the controller is initialized
        this.initialized = false;

        // Shader program for applying color 
        this.program = null;

        // Current color attributes
        this.attributes = getColorAttributes();
        this.defaultAttributes = getColorAttributes();

        // Used for saving the canvas as an image
        this.captureNext = false; // True if next frame should be captured
        this.dataCallback = null; // The callback function that should be used to return the contents 
                                  // of the render

        this.handleResize();
    }

    // Used to capture the next frame of animation
    // The data callback function will be used to return the result
    captureFrame(dataCallback) {
        this.captureNext = true;
        this.dataCallback = dataCallback;
    }

    // Initializes the color controller
    initialize(canvas, program) {
        if(this.initialized) {
            console.log("The color controller is already initialized");
            return true;
        }

        console.log("Initializing color controller");

        this.canvas = canvas;
        this.program = program;

        GLC.setShaderProgram(this.program);
        setUniforms(this.attributes, this.program);

        this.initialized = true;

        return true;
    }

    isInitialized() {
        return this.initialized;
    }

    handleResize() {
        if(!this.initialized) return;
        GLC.setUniform(this.program, "viewport", "2fv", [this.canvas.width, this.canvas.height]);
    }

    // Updates a value and it's corresponding uniform (if such exists)
    updateValue(location, value) {
        //TODO create some form of callback to sliders that force them to re-read when a value is changed?!
        return updateAttributeValue(this.attributes, this.program, location, value)
    }

    getValue(location) {
        return getAttributeValue(this.attributes, location);
    }

    // Returns the default (initial) value
    getDefault(location) {
        return getAttributeDefault(this.attributes, location);
    }


    // Renders and modifies a source textures and exports the result to default frame buffer
    render(sourceTexture, delta, multisampling) {
        // Bind the default frame buffer
        GLC.bindFramebuffer(null);
        GLC.setViewport(this.canvas.width, this.canvas.height); 

        // Use the post processing program, which will sample the texture which we previously rendered to
        GLC.setShaderProgram(this.program);

        // Bind and activate the texture
        GLC.setTexture(sourceTexture, 0);

        // Tell the shader we bound the texture to texture unit 0
        GLC.setUniform(this.program, "texture", "1i", 0);

        GLC.setUniform(this.program, "multisampling", "1i", multisampling);

        GLC.renderFullScreenQuad(this.program);

        // Capture the frame if requested
        if(this.captureNext) {
            this.captureNext = false;
            var captureData = this.canvas.toDataURL("image/png");
            this.dataCallback(captureData);
        }
    }
}

const CC = new ColorController();
export default CC;