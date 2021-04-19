class GLCommander {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.initialized = false;

        // Map for storing uniform locations
        this.uniformLocations = new Map();
    }

    // Initialize the canvas and webgl context variables
    init(canvas) {
        // INITIALIZE THE WEBGL CONTEXT
        console.log("Initializing webgl context");

        // If the canvas is null, we cannot proceed. Abort.
        if(!canvas) {
            console.log("The canvas is not initialized")
            return false;
        }

        // Get the webgl context
        let gl = canvas.getContext('webgl');

        // If no context was retrieved, try experimental webgl
        if(!gl) {
            console.log('Webgl not supported, falling back on experimental-webgl');
            gl = canvas.getContext('experimental-webgl');
        }

        // If there's still no context, abort
        if(!gl) {
            alert("Your browser does not support WebGL");
            return false;
        }

        this.canvas = canvas;
        this.gl = gl;
        this.initialized = true;

        return true;
    }

    // Setup a two triangles that cover the entire screen
    createFullScreenQuad(program, vertexLocation) {
        const triangleVertices = 
        [
            // Triangle 1
            -1.0,  1.0,
            -1.0, -1.0,
             1.0, -1.0,

            // Triangle 2
            -1.0,  1.0,
             1.0,  1.0,
             1.0, -1.0,
        ];

        // Array buffer for triangle vertices
        this.quadBuffer = GLC.createBuffer(this.gl.ARRAY_BUFFER, triangleVertices, this.gl.STATIC_DRAW);

        // Set and enable the corresponding attribute 
        GLC.setAttribLayout(
            program, 
            vertexLocation,
            2,
            this.gl.FLOAT,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0
        );
    }

    // Render the default full screen quad
    renderFullScreenQuad(program) {
        this.setShaderProgram(program);

        // Bind the data
        this.bindBuffer(this.gl.ARRAY_BUFFER, this.quadBuffer);

        // Clear and draw 
        this.clear(0.0, 0.0, 0.0, 1.0);
        this.draw(6);
    }

    isInitialized() {
        return this.initialized;
    }

    // Clear the canvas (both color and depth information)
    clear(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    flush() {
        this.gl.flush();
    }

    // Sets the viewport of the webgl context
    setViewport(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    // Creates a shader program, loads with shader source, compiles, links, and verifies
    createShaderProgram(vertexSource, fragmentSource) {
        const validateShader = (shader, shaderType) => {
            if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
                console.error('ERROR compiling ' + shaderType + ' shader', this.gl.getShaderInfoLog(shader));
                return false;
            }
            return true;
        }

        var vs = this.gl.createShader(this.gl.VERTEX_SHADER);
        var fs = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(vs, vertexSource);
        this.gl.shaderSource(fs, fragmentSource);

        this.gl.compileShader(vs);

        if(!validateShader(vs, 'vertex')) return -1;

        this.gl.compileShader(fs);

        if(!validateShader(fs, 'fragment')) return -1;

        var program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);

        this.gl.linkProgram(program);

        if(!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
            console.error('ERROR linking program', this.gl.getProgramInfoLog(program));
            return -1;
        }

        this.gl.validateProgram(program);
        if(!this.gl.getProgramParameter(program, this.gl.VALIDATE_STATUS)) {
            console.error('ERROR validating program', this.gl.getProgramInfoLog(program));
            return -1;
        }

        return program;
    }

    // Creates an arbitrary webgl buffer and loads it with data
    createBuffer(bufferType, data, drawMode) {
        var buffer = this.gl.createBuffer();
        this.bindBuffer(bufferType, buffer);
        this.gl.bufferData(bufferType, new Float32Array(data), drawMode);
    }

    // Binds a buffer
    bindBuffer(bufferType, buffer) {
        this.gl.bindBuffer(bufferType, buffer);
    }

    // Sets and enables a shader attribute
    setAttribLayout(program, name, numberOfElements, type, vertexSize, offset) {
        var location = this.gl.getAttribLocation(program, name);

        if(location === -1) {
            return -1;
        }

        this.gl.vertexAttribPointer(
            location,
            numberOfElements,
            type,
            this.gl.FALSE,
            vertexSize,
            offset
        );
        this.gl.enableVertexAttribArray(location);
    }

    // Enables a specific shader
    setShaderProgram(program) {
        this.gl.useProgram(program);
    }

    // Sets the uniform value of a specific shader
    // Type corresponds to the webgl API uniform setters
    // For example, if "value" is an integer, then "type" should be "1i"
    // If "value" is a float array with three elements, "type" should be "3fv", and so on
    setUniform(program, name, type, value) {
        // Store the locations in a map, to avoid having to unnecessary uniform location lookups
        const key = { program, name };
        var location = this.uniformLocations.get(key);
        if(typeof location === 'undefined') {
            location = this.gl.getUniformLocation(program, name);
            this.uniformLocations.set(key, location);
        }

        // Set value
        this.gl["uniform" + type](location, value);
    }

    // Draws a specified number of vertices
    draw(numberOfVertices) {
        this.gl.drawArrays(this.gl.TRIANGLES,  0, numberOfVertices);
    }

    // Returns the webgl context
    getGL() {
        return this.gl;
    }
}

// Create and export a static GLC instance which can be used globally
const GLC = new GLCommander();
export default GLC;