// Controllers
import TXC from './TextureController'
import CC from './ColorController'

// Animation
import { AnimationManager } from '../AnimationManager'

// WebGL wrapper
import GLC from '../GLC'

// Shaders
import quadVertShaderSoruce from '../../GL/shaders/simple.vert'
import textureFragShaderSource from '../../GL/shaders/warp.frag'
import colorFragShaderSource from '../../GL/shaders/color.frag'
import { mergeAttributes, resetAttributesToDefault } from './ControllerAttributes'

// Class for controlling the entire application
class WarpAppController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////

    constructor() {
        // General states
        this.initialized = false; // True once "initialized" has been succesfully called
        this.controllers = null; // Holds all the controllers responsible for managing the domain warp
        this.paused = false; // True if the animation is paused

        this.canvas = null;

        // Anchored movement
        this.anchored = false; // True if an anchor exists
        this.anchor = null;    // The anchor position specifies which location should be used to calculate 
                               // offsets when using anchored movement (good for moving using mouse)
        this.previousPosition = null; // Is used to calculate offsets

        // Controllers and help classes
        this.controllers = null; // Will directly control the warp texture

        this.AM = new AnimationManager();
    }

    initialize(canvas) {
        // Initialize WebGL controller
        if(!GLC.initialize(canvas)) {
            throw new Error("GLC failed to initialize");
        }

        // Compile and link shaders
        const programs = GLC.compileAndLinkShaders([
            [quadVertShaderSoruce, textureFragShaderSource],
            [quadVertShaderSoruce, colorFragShaderSource]
        ]);

        if(!programs) {
            throw new Error("Shader program linking failed");
        }

        const [textureProgram, colorProgram] = programs;

        // Initialize quad that will be used to render to the entire screen
        GLC.createFullScreenQuad();
        GLC.setQuadAttributeLayout(textureProgram, "vertPosition");
        GLC.setQuadAttributeLayout(colorProgram, "vertPosition", "inTexCoord");

        // Initialize texture controller
        if(!TXC.initialize(canvas, textureProgram)) {
            throw new Error("Texture controller failed to initialize");
        }
        TXC.setPaused(this.paused);

        // Initialize color controller
        if(!CC.initialize(canvas, colorProgram)) {
            throw new Error("Color controller failed to initialize");
        }

        this.controllers = {
            // Texture controller
            TXC: TXC,

            // Color controller
            CC: CC,
        };

        this.canvas = canvas;
        this.initialized = true;

        return true;
    }

    isInitialized() {
        return this.initialized;
    }

    /////////////////////////
    // ANIMATION/RENDERING //
    /////////////////////////

    // Starts the animation manager
    // This is required for anything to be rendered to the canvas
    start(callback = null) {
        // If already running, do nothing
        if(this.AM.isRunning()) return;

        // Set the render callback for the animation manager
        this.AM.setCallback((delta) => {
            // The texture controller will render to a texture
            // Pass this texture along to the color controller
            const texture = TXC.render(delta)
            // Also tell the color controller if multisampling is enabled
            CC.render(texture, delta, TXC.getValue("multisampling"))

            callback && callback();
        });

        this.AM.start();
    }

    // Stops the animation
    stop() {
        this.AM.stop();
    }

    animationManager() {
        console.log(this.AM)
        return this.AM;
    }

    startRecording(frameRate = 60) {
        this.AM.startRecording(frameRate, this.canvas);
    }

    stopRecording() {
        this.AM.stopRecording();
    }

    // Resize the canvas (will use the dimensions of the window)
    // TODO allow passing custom dimensions
    handleResize() {
        TXC.handleResize();
        CC.handleResize();
    }

    // Capture the next frame
    // The data callback should be a function that takes a data URL of a PNG
    captureFrame(dataCallback) {
        CC.captureFrame(dataCallback);
    }

    ///////////////////
    // STATE CONTROL //
    ///////////////////
    togglePause() {
        this.setPaused(!this.paused);
    }

    changeAnimationSpeed(delta) {
        const speed = TXC.getValue("animationSpeed.general");
        TXC.updateValue("animationSpeed.general", Math.max(speed * (1 + delta)));
    }

    changeScale(amount, sourcePosition = null) {
        // Get the current scale value
        var scale = TXC.getValue("scale");

        // Calculate a new scale value based on the previous one
        const delta = amount * scale; 
        scale += delta;

        // Update the value in the texture controller
        TXC.updateValue("scale", scale);

        // If a source position is supplied, scale around that position
        if(!sourcePosition) return;

        // Offset the center in the direction of the cursor
        var offset = TXC.screenSpaceToViewSpace([
            (sourcePosition[0] - window.innerWidth  / 2) * delta,
            (sourcePosition[1] - window.innerHeight / 2) * delta,
        ]);

        const position = TXC.getPosition();
        TXC.setPosition([position[0] - offset[0], position[1] + offset[1]]); 
    }

    move(offset) {
        this.anchored = false; // Lift anchor if moving regularly

        const position = TXC.getPosition(); 
        const scale = TXC.getValue("scale");

        // Translate the offset to view space coordinates
        offset = TXC.screenSpaceToViewSpace(offset);

        // Add offset to current position and scale to ensure expected movement speed
        TXC.setPosition([position[0] + offset[0] * scale, position[1] + offset[1] * scale]);
    }

    setAnchor(anchor) {
        if(this.anchored) return false; // The current anchor has to be lifted first
        this.anchor = anchor;
        
        // Store a copy of the previous position, will be used
        // to calculate offsets
        const position = TXC.getPosition();
        this.previousPosition = [position[0], position[1]];

        this.anchored = true;

        return true;
    }

    liftAnchor() {
        if(!this.anchored) return false;
        this.anchored = false;
        return true;
    }

    // Moves the view using the specified offset from the anchor position
    anchorMove(offset) {
        if(!this.anchored) return false;

        // Get the current scale. This is used to correctly translate the view
        const scale = TXC.getValue("scale");

        // The offset from the anchor point 
        const viewSpaceOffset = TXC.screenSpaceToViewSpace([
            (this.anchor[0] - offset[0]) * scale,
            (this.anchor[1] - offset[1]) * scale
        ]);

        // The previous view position
        // This previous position is set when the mouse button is first pressed
        TXC.setPosition([
            this.previousPosition[0] + viewSpaceOffset[0], 
            this.previousPosition[1] - viewSpaceOffset[1]
        ]);

    }

    randomize() {
        TXC.randomize();
        CC.randomize();
    }

    ///////////////////
    // SAVING STATES //
    ///////////////////

    // Exports the relevant settings as a JSON file
    exportSettings() {
        const exported = {};

        // Iterate over all the controllers
        for (const controllerName in this.controllers) {
            const controller = this._getController(controllerName);

            // Set their corresponding attributes
            exported[controllerName] = controller.getAttributes();
        }

        return JSON.stringify(exported, null, 2);
    }

    importSettings(settingsJSON) {
        const imported = JSON.parse(settingsJSON);

        // Iterate over all the controllers
        for (const controllerName in this.controllers) {
            const controller = this._getController(controllerName);

            var importedAttributes = imported[controllerName];
            var oldAttributes = controller.getAttributes();

            // Merge the imported attributes with the default attributes
            // This ensures settings for old remains as compatible as possible
            // with settings for never versions of the application
            var newAttributes = mergeAttributes(
                resetAttributesToDefault(oldAttributes), // Use default values as base
                importedAttributes                       // Override with imported values
            );

            // Set their corresponding attributes
            controller.setAttributes(newAttributes);
        }
    }

    /////////////
    // GETTERS //
    /////////////

    getFrameRate() {
        return this.AM.getFrameRate();
    }

    getAverageFrameRate() {
        return this.AM.getAverageFrameRate();
    }


    getDimensions() {
        return TXC.getDimensions();
    }

    _getController(controllerName) {
        const controller = this.controllers[controllerName];
        if(!controller) throw new Error("No such controller");
        return controller;
    }

    getValue(controllerName, location) {
        if(!this.initialized) return;
        return this._getController(controllerName)
        .getValue(location);
    }
    getDefault(controllerName, location) {
        if(!this.initialized) return;
        return this._getController(controllerName)
        .getDefault(location);
    }

    getAttributes(controllerName) {
        if(!this.initialized) return;
        return this._getController(controllerName).getAttributes();
    }

    isAnchored() {
        return this.anchored;
    }

    isPaused() {
        return this.paused;
    }

    /////////////
    // SETTERS //
    /////////////

    updateValue(controllerName, location, value) {
        if(!this.initialized) return;
        return this._getController(controllerName) 
        .updateValue(location, value);
    }

    setPaused(paused) {
        this.paused = paused;
        TXC.setPaused(this.paused);
    }
}

const WAC = new WarpAppController();

export default WAC;