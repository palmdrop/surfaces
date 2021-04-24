class AnimationController {
    constructor() {
        this.previousMillis = Date.now(); // The global time in millisecond for when the the previous frame 
                                 // was rendered

        // The animation frame ID of the current frame
        // Used to cancel the animation if necessary
        this.animationFrameId = -1;

        // Callback function that will be called each update
        this.callback = null;

        // True if the animation loop is currently running
        this.running = false;

        // Frame rate
        this.lastSecond = this.previousMillis;
        this.framesSinceLastSecond = 0;

        this.currentFrameRate = 0;

        this.frameRateAlpha = 0.3;
        this.averageFrameRate = 0;
    }

    setCallback(callback) {
        this.callback = callback;
    }

    isRunning() {
        return this.running;
    }

    start() {
        // Stop the animatioin frame, to avoid two loops running simulatenously
        this.stop();

        this.running = true;

        const update = () => {
            // Calculate the time passed since last frame
            const now = Date.now();
            const delta = (now - this.previousMillis) / 1000;

            if(this.callback) {
                this.callback(delta);
            }

            // Update the time
            this.previousMillis = now;

            // Request the next animation frame
            this.animationFrameId = requestAnimationFrame(update);

            // Calculate framerate
            this.framesSinceLastSecond++;

            //TODO calculate each update not just every second
            if(now - this.lastSecond > 1000) {
                this.currentFrameRate = this.framesSinceLastSecond;
                this.framesSinceLastSecond = 0;
                this.lastSecond = now;

                // Calculate a weighted frame rate average
                this.averageFrameRate = 
                    this.frameRateAlpha * this.currentFrameRate +
                    (1.0 - this.frameRateAlpha) * this.averageFrameRate;
            }
        }

        // Call update, which will recursively request animation frames
        update();
    }

    stop() {
        this.running = false;
        cancelAnimationFrame(this.animationFrameId);
    }

    getFrameRate() {
        return this.currentFrameRate;
    }

    getAverageFrameRate() {
        return this.averageFrameRate;
    }
}


const AC = new AnimationController();
export default AC;