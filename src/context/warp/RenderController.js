

class RenderController {
    constructor() {
        this.initialized = false;
        this.dimensions = [window.innerWidth, window.innerHeight];

        this.previousResolution = 1.0;
        this.resolution = 1.0;
        
        this.multisamplingMultiplier = 2.0; 
        this.multisamplingDimensions = [-1, -1];
        this.fbo = null;
    }
    
    






}

const RC = new RenderController();

export default RC;