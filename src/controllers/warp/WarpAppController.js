// Controllers
import { TextureController } from './TextureController'
import { ColorController } from './ColorController'

// Animation
import { AnimationManager } from '../AnimationManager'

// WebGL wrapper
//import GLC from '../GLC'
import { GLController } from '../GLC'

// Shaders
import quadVertShaderSoruce from '../../GL/shaders/simple.vert'
import textureFragShaderSource from '../../GL/shaders/warp.frag'
import colorFragShaderSource from '../../GL/shaders/color.frag'
import { mergeAttributes, resetAttributesToDefault } from './ControllerAttributes'
import { RenderController } from './RenderController'

// Resources
import ditheringTexture from '../../resources/blue-noise/LDR_RGBA_7.png'

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
        this.GLC = new GLController();
        this.AM = new AnimationManager();

        this.RC = new RenderController();
        this.TXC = new TextureController();
        this.CC  = new ColorController();

        this.controllers = {
            RC: this.RC,
            TXC: this.TXC,
            CC:  this.CC
        }; 

        this.updateCallbacks = new Map();

        // Will be called when any of the attributes are updated
        this.onUpdate = null;
    }

    initialize(canvas, onUpdate) {
        if(this.initialized) return;

        // Initialize WebGL controller
        if(!(this.GLC.initialize(canvas))) {
            throw new Error("GLC failed to initialize");
        }

        // Compile and link shaders
        const programs = this.GLC.compileAndLinkShaders([
            [quadVertShaderSoruce, textureFragShaderSource],
            [quadVertShaderSoruce, colorFragShaderSource]
        ]);

        if(!programs) {
            throw new Error("Shader program linking failed");
        }

        const [textureProgram, colorProgram] = programs;

        // Initialize quad that will be used to render to the entire screen
        this.GLC.createFullScreenQuad();
        this.GLC.setQuadAttributeLayout(textureProgram, "vertPosition");
        this.GLC.setQuadAttributeLayout(colorProgram, "vertPosition", "inTexCoord");

        // Initialize render controller
        if(!(this.RC.initialize(canvas, this.GLC))) {
            throw new Error("Render controller failed to initialize");
        }

        // Initialize texture controller
        if(!(this.TXC.initialize(canvas, textureProgram, this.GLC))) {
            throw new Error("Texture controller failed to initialize");
        }
        this.TXC.setPaused(this.paused);

        // Initialize color controller
        if(!this.CC.initialize(canvas, colorProgram, this.GLC, ditheringTexture)) {
            throw new Error("Color controller failed to initialize");
        }

        this.onUpdate = onUpdate;
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

    _render(delta) {
        const fbo = this.RC.getFrameBuffer();

        const renderTexture = this.RC.getRenderTexture();
        const renderTextureDimensions = this.RC.getRenderTextureDimensions();

        const dimensions = this.RC.getDimensions();

        const ditheringAmount = this.RC.getValue("ditheringAmount");

        // The texture controller will render to a texture
        this.TXC.render(fbo, renderTextureDimensions, delta);

        // Pass this texture along to the color controller
        // Also tell the color controller if multisampling is enabled
        this.CC.render(renderTexture, dimensions, 
            this.RC.getValue("multisampling"), ditheringAmount,
            this.paused ? 0.0 : delta);
    }

    // Starts the animation manager
    // This is required for anything to be rendered to the canvas
    start(callback = null) {
        // If already running, do nothing
        if(this.AM.isRunning()) return;

        // Set the render callback for the animation manager
        this.AM.setCallback((delta) => {
            this._render(delta);
            callback && callback();
        });

        this.AM.start();
    }

    addUpdateCallback(callback) {
        const previousCallback = this.AM.callback;
        this.AM.setCallback((delta) => {
            callback(delta);
            previousCallback(delta);
        });
    }

    // Stops the animation
    stop() {
        this.AM.stop();
    }

    animationManager() {
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
        this.RC.handleResize();
        this.resizeCallback && this.resizeCallback(this.getDimensions());
    }

    addResizeCallback(callback) {
        this.RC.addResizeCallback(callback);
    }

    // Capture the next frame
    // The data callback should be a function that takes a data URL of a PNG
    captureFrame(dataCallback) {
        this.CC.captureFrame(dataCallback);
    }

    ///////////////////
    // STATE CONTROL //
    ///////////////////
    changeAnimationSpeed(delta) {
        const speed = this.TXC.getValue("animationSpeed.general");
        this.updateValue("TXC", "animationSpeed.general", Math.max(speed * (1 + delta)));
    }

    changeScale(amount, sourcePosition = null) {
        // Get the current scale value
        var scale = this.TXC.getValue("scale");

        // Calculate a new scale value based on the previous one
        const delta = amount * scale; 
        scale += delta;

        // Update the value in the texture controller
        this.updateValue("TXC", "scale", scale);

        // If a source position is supplied, scale around that position
        if(!sourcePosition) return;

        // Offset the center in the direction of the cursor
        var offset = this._screenSpaceToViewSpace([
            (sourcePosition[0] - window.innerWidth  / 2) * delta,
            (sourcePosition[1] - window.innerHeight / 2) * delta,
        ]);

        const position = this.TXC.getPosition();
        this.TXC.setPosition([position[0] - offset[0], position[1] + offset[1]]); 
    }

    move(offset) {
        this.anchored = false; // Lift anchor if moving regularly

        const position = this.TXC.getPosition(); 
        const scale = this.TXC.getValue("scale");

        // Translate the offset to view space coordinates
        offset = this._screenSpaceToViewSpace(offset);

        // Add offset to current position and scale to ensure expected movement speed
        this.TXC.setPosition([position[0] + offset[0] * scale, position[1] + offset[1] * scale]);
    }

    setAnchor(anchor) {
        if(this.anchored) return false; // The current anchor has to be lifted first
        this.anchor = anchor;
        
        // Store a copy of the previous position, will be used
        // to calculate offsets
        const position = this.TXC.getPosition();
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
        const scale = this.TXC.getValue("scale");

        // The offset from the anchor point 
        const viewSpaceOffset = this._screenSpaceToViewSpace([
            (this.anchor[0] - offset[0]) * scale,
            (this.anchor[1] - offset[1]) * scale
        ]);

        // The previous view position
        // This previous position is set when the mouse button is first pressed
        this.TXC.setPosition([
            this.previousPosition[0] + viewSpaceOffset[0], 
            this.previousPosition[1] - viewSpaceOffset[1]
        ]);

    }

    randomize() {
        this.TXC.randomize();
        this.CC.randomize();
        this.onUpdate && this.onUpdate();
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

            const importedAttributes = imported[controllerName];
            const oldAttributes = controller.getAttributes();

            // Merge the imported attributes with the default attributes
            // This ensures settings for old remains as compatible as possible
            // with settings for never versions of the application
            const newAttributes = mergeAttributes(
                resetAttributesToDefault(oldAttributes), // Use default values as base
                importedAttributes                       // Override with imported values
            );

            // Set their corresponding attributes
            controller.setAttributes(newAttributes);
        }

        this.onUpdate && this.onUpdate();
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
        return this.RC.getDimensions();
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

        this.onUpdate && this.onUpdate();

        const result = this._getController(controllerName).updateValue(location, value);

        const key = controllerName + ":" + location;
        const callback = this.updateCallbacks.get(key);
        if(callback) callback(controllerName, location, value);

        return result;
    }

    setPaused(paused) {
        this.paused = paused;
        this.TXC.setPaused(this.paused);
    }

    setUpdateCallback(controllerName, location, callback) {
        const key = controllerName + ":" + location;
        this.updateCallbacks.set(key, callback)
    }

    //////////
    // UTIL //
    //////////
    _screenSpaceToViewSpace(position) {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Calculate the proportions of the screen
        const proportions = height / width;

        // Scale and correct for proportions
        return [position[0] / width, position[1] * proportions / height];
    }
}

const WAC = new WarpAppController();

export default WAC;