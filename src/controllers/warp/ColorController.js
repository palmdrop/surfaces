import { 
    getColorAttributes, 
    setUniforms, 

    AttributeController
} from '../ControllerAttributes';

class ColorController extends AttributeController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////
    constructor() {
        super(getColorAttributes);
        // A reference to the canvas element that holds the WebGL context
        this.canvas = null;
        this.GLC = null;

        // Set to true once the controller is initialized
        this.initialized = false;

        // Shader program for applying color 
        this.program = null;

        // Dithering texture
        this.ditheringTexture = null;

        // Used for saving the canvas as an image
        this.captureNext = false; // True if next frame should be captured
        this.dataCallback = null; // The callback function that should be used to return the contents 
                                  // of the render

        this.time = 0.0;
    }

    // Used to capture the next frame of animation
    // The data callback function will be used to return the result
    captureFrame(dataCallback) {
        this.captureNext = true;
        this.dataCallback = dataCallback;
    }

    // Initializes the color controller
    initialize(canvas, program, GLC, ditheringTexture) {
        if(this.initialized) {
            console.log("The color controller is already initialized");
            return true;
        }

        console.log("Initializing color controller");

        this.GLC = GLC;
        this.canvas = canvas;
        this.program = program;

        this.GLC.setShaderProgram(this.program);
        setUniforms(this.attributes, this.program, this.GLC);

        // Create texture for dithering
        this.ditheringTexture = this.GLC.createImageTexture(
            ditheringTexture,
            this.GLC.getGL().REPEAT,  // Repeat to ensure that a texture of any size can be used
            this.GLC.getGL().NEAREST, // No linear filtering, although sampling shader should sample at scale
            // Callback for when the image is loaded
            (width, height) => {
                // Bind texture and set related values
                this.GLC.setUniform(this.program, "hasDitheringTexture", "1i", 1);
                this.GLC.setTexture(this.ditheringTexture, 1);
                this.GLC.setUniform(this.program, "ditheringTexture", "1i", 1);
                this.GLC.setUniform(this.program, "ditheringTextureDimensions", "2fv", [width, height]);
            },
            // Callback if image fails loading
            () => {
                console.error("Dithering texture failed to load");
            }
        );

        this.initialized = true;

        return true;
    }

    isInitialized() {
        return this.initialized;
    }

    // Renders and modifies a source textures and exports the result to default frame buffer
    render(sourceTexture, dimensions, multisampling, ditheringAmount, delta) {
        this.time += delta;
        const GLC = this.GLC;

        // Bind the default frame buffer
        GLC.bindFramebuffer(null);
        GLC.setViewport(dimensions[0], dimensions[1]);
        this.GLC.setUniform(this.program, "viewport", "2fv", dimensions);
        this.GLC.setUniform(this.program, "time", "1f", this.time);
        this.GLC.setUniform(this.program, "ditheringAmount", "1f", ditheringAmount);

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

export {
    ColorController,
};