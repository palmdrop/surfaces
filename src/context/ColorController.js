import GLC from './GLC'


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
        this.attributes = null; //TODO
    }

    isInitialized() {
        return this.initialized;
    }

    initialize(canvas, program) {
        if(this.initialized) {
            console.log("The color controller is already initialized");
            return true;
        }

        console.log("Initializing color controller");

        this.canvas = canvas;
        this.program = program;



        this.initialized = true;

        return true;
    }




}

const CC = new ColorController();
export default CC;