// Controllers
import TXC from './TextureController'
import CC from './ColorController'

// Animation
import AM from '../AnimationManager'

// WebGL wrapper
import GLC from '../GLC'

// Shaders
import quadVertShaderSoruce from './GL/shaders/simple.vert'
import textureFragShaderSource from './GL/shaders/warp.frag'
import colorFragShaderSource from './GL/shaders/color.frag'

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

        // Anchored movement
        this.anchored = false; // True if an anchor exists
        this.anchor = null;    // The anchor position specifies which location should be used to calculate 
                               // offsets when using anchored movement (good for moving using mouse)
        this.previousPosition = null; // Is used to calculate offsets

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
            txc: TXC,
            textureController: TXC,

            // Color controller
            cc: CC,
            colorController: CC
        };

        this.canvas = canvas;
        this.initialized = true;
    }


    /////////////////////////
    // ANIMATION/RENDERING //
    /////////////////////////

    // Starts the animation manager
    // This is required for anything to be rendered to the canvas
    start() {
        // If already running, do nothing
        if(AM.isRunning()) return;

        // Set the render callback for the animation manager
        AM.setCallback((delta) => {
            // The texture controller will render to a texture
            // Pass this texture along to the color controller
            const texture = TXC.render(delta)
            // Also tell the color controller if multisampling is enabled
            CC.render(texture, delta, TXC.getValue("multisampling"))
        });
        AM.start();
    }

    // Stops the animation
    stop() {
        AM.stop();
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

    changeScale(amount, position = null) {
        // Get the current scale value
        var scale = TXC.getValue("scale");

        // Calculate a new scale value based on the previous one
        const delta = amount * scale; 
        scale += delta;

        // Update the value in the texture controller
        TXC.updateValue("scale", scale);

        // If a position is supplied, scale around that position
        if(!position) return;

        // Offset the center in the direction of the cursor
        var offset = TXC.screenSpaceToViewSpace([
            (position.x - window.innerWidth  / 2) * delta,
            (position.y - window.innerHeight / 2) * delta,
        ]);

        const position = TXC.getPosition();
        TXC.setPosition([position[0] - offset[0], position[1] + offset[1]]); 
    }

    move(offset) {
        const position = TXC.getPosition(); 
        const scale = TXC.getValue("scale");

        // Translate the offset to view space coordinates
        offset = TXC.screenSpaceToViewSpace(offset);

        // Add offset to current position and scale to ensure expected movement speed
        TXC.setPosition([position[0] + offset[0] * scale, position[1] + offset[1] * scale]);
    }

    setAnchor(position) {
        if(this.anchored) return false; // The current anchor has to be lifted first
        this.anchor = position;
        
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
            (anchor[0] - offset.x) * scale,
            (anchor[1] - offset.y) * scale
        ]);

        // The previous view position
        // This previous position is set when the mouse button is first pressed
        TXC.setPosition([
            this.previousPosition[0] + viewSpaceOffset[0], 
            this.previousPosition[1] + viewSpaceOffset[1]
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
        // TODO include CC settings as well!!
        return TXC.exportSettings();
    }

    importSettings(settingsJSON) {
        //TODO include CC settings
        TXC.importSettings(settingsJSON);
    }

    /////////////
    // GETTERS //
    /////////////

    getFrameRate() {
        return AM.getFrameRate();
    }

    getAverageFrameRate() {
        return AM.getAverageFrameRate();
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
        return this._getController(controllerName)
        .getValue(location);
    }
    getDefault(controllerName, location) {
        return this._getController(controllerName)
        .getDefault(location);
    }

    isAnchored() {
        return this.anchored;
    }

    /////////////
    // SETTERS //
    /////////////

    updateValue(controllerName, location, value) {
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