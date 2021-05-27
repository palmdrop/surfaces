class GLController {
    ////////////////////
    // INITIALIZATION //
    ////////////////////

    constructor() {
        this.canvas = null;
        this.gl = null;
        this.initialized = false;

        // Map for storing uniform locations
        this.uniformLocations = new WeakMap();

        // Extensions
        this.EXT_color_buffer_float = null; // For rendering to float textures
        this.KHR_parallel_shader_compile = null; // For paralell shader ocmpilation
    }

    initializeWebGL() {

    }

    // Initialize the canvas and webgl context variables
    initialize(canvas) {
        // INITIALIZE THE WEBGL CONTEXT
        console.log("Initializing webgl context");

        // If the canvas is null, we cannot proceed. Abort.
        if(!canvas) {
            console.log("The canvas is not initialized")
            return false;
        }

        // Get the webgl context
        let gl = canvas.getContext('webgl2');

        if(!gl) {
            console.log("WebGL2 not supported, falling back on WebGL1");
            gl = canvas.getContext('webgl');
            this.hasWebGL2 = false;
        }  else {
            this.hasWebGL2 = true;
        }

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

        // Acquire the color buffer float extension
        this.EXT_color_buffer_float = gl.getExtension("EXT_color_buffer_float");
        if (!this.EXT_color_buffer_float) {
            alert("need EXT_color_buffer_float");
            //return false;
            this.hasFloatColorBuffers = false;
        } else {
            this.hasFloatColorBuffers = true;
        }

        // Acquire extension for parallel shader compilation (not required)
        /*this.KHR_parallel_shader_compile = gl.getExtension("KHR_parallel_shader_compile");
        if(!this.KHR_parallel_shader_compile) {
            console.log("no support for parallel shader compilation")
        }*/

        gl.enableVertexAttribArray(0);

        this.canvas = canvas;
        this.gl = gl;
        this.initialized = true;

        return true;
    }

    

    isInitialized() {
        return this.initialized;
    }

    ///////////////////////
    // DATA/OBJECT SETUP //
    ///////////////////////

    setQuadAttributeLayout(program, positionLocation, texCoordLocation = null) {
        // Set and enable the corresponding position attribute 
        this.setAttribLayout(
            program, 
            positionLocation,
            2,
            this.gl.FLOAT,
            4 * Float32Array.BYTES_PER_ELEMENT,
            0
        );

        // If supplied, also set the location for texture coords
        if(texCoordLocation) {
            this.setAttribLayout(
                program, 
                texCoordLocation,
                2,
                this.gl.FLOAT,
                4 * Float32Array.BYTES_PER_ELEMENT,
                2 * Float32Array.BYTES_PER_ELEMENT
            );
        }
    }

    // Setup a two triangles that cover the entire screen
    createFullScreenQuad(program = null, positionLocation = null, texCoordLocation = null) {
        const triangleVertices = 
        [
            // Triangle 1
            -1.0,  1.0,     0, 1,
            -1.0, -1.0,     0, 0,
             1.0, -1.0,     1, 0,

            // Triangle 2
            -1.0,  1.0,     0, 1, 
             1.0,  1.0,     1, 1,
             1.0, -1.0,     1, 0
        ];

        // Array buffer for triangle vertices
        this.quadBuffer = this.createBuffer(this.gl.ARRAY_BUFFER, triangleVertices, this.gl.STATIC_DRAW);

        // Set attribute layouts if supplied
        if(program && positionLocation) {
            this.setQuadAttributeLayout(program, positionLocation, texCoordLocation);
        }
    }

    // Creates an arbitrary webgl buffer and loads it with data
    createBuffer(bufferType, data, drawMode) {
        var buffer = this.gl.createBuffer();
        this.bindBuffer(bufferType, buffer);
        this.gl.bufferData(bufferType, new Float32Array(data), drawMode);
    }

    // Create frame buffer
    createFramebuffer(colorTexture) {
        const fb = this.gl.createFramebuffer();
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fb);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            colorTexture,
            0
        );
        this.gl.drawBuffers([this.gl.COLOR_ATTACHMENT0]);

        return fb;
    }

    // Create empty texture
    createTexture(width, height, format = this.gl.RGBA, internalFormat = this.gl.RGBA, type = this.gl.UNSIGNED_BYTE) {
        // Create and bind a new texture buffer
        const texture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Define default values and initialize texture
        const level = 0;
        const border = 0;
        const data = null;
        this.gl.texImage2D(this.gl.TEXTURE_2D,
            level, internalFormat,
            width, height, border,
            format, type, data);

        // Set linear filtering and clamping
        if(type !== this.gl.FLOAT) {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        }

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

        return texture;
    }

    // Creates a texture using an image url
    createImageTexture(src, wrap = this.gl.CLAMP_TO_EDGE, filtering = this.gl.LINEAR, onLoad = null, onError = null) {
        // Load empty texture
        const texture = this.createTexture(1, 1, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE);

        // Load image
        var image = new Image();
        image.onload = () => {
            // Bind and set image as texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);

            // Set wrapping and filtering
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, wrap);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, wrap);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, filtering);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filtering);

            // Callback on load
            onLoad && onLoad(image.width, image.height);
        };
        image.onerror = () => {
            // Callback on error
            onError && onError();
        }

        image.src = src;
        return texture;
    }

    /////////////
    // SHADERS //
    /////////////

    // Creates shader programs, loads with shader source, compiles and links 
    // Allows for parallel compilation/linking if browser supports it
    compileAndLinkShaders(sources) {
        // Create a list of tuples: [vertexShader, fragmentShader, shaderProgram]
        // If the browser supports it, these will then be compiled and linked in parallell
        const programs = [];
        for (const [vertexSource, fragmentSource] of sources) {
            const vs = this._createShader(vertexSource, this.gl.VERTEX_SHADER);
            const fs = this._createShader(fragmentSource, this.gl.FRAGMENT_SHADER);
            const program = this._createShaderProgram(vs, fs);
            programs.push([vs, fs, program]);
        }

        // Compile all shaders
        for (const [vs, fs, ] of programs) {
            this._compileShader(vs);
            this._compileShader(fs);
        }

        // Link all programs
        for (const [, , program] of programs) {
            this.gl.linkProgram(program);
        }

        // Check for link errors        
        for (const [vs, fs, program] of programs) {
            if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
                console.error('Link failed: ' + this.gl.getProgramInfoLog(program));
                console.error('vs info-log: ' + this.gl.getShaderInfoLog(vs));
                console.error('fs info-log: ' + this.gl.getShaderInfoLog(fs));

                return null;
            }
        }

        // Only return the actual shader programs
        return programs.map(([,,program]) => program);
    }

    compileAndLinkShader(vertexSource, fragmentSource) {
        return this.compileAndLinkShaders([[vertexSource, fragmentSource]])[0];
    }

    _createShader(source, type) {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        return shader;
    }

    _compileShader(shader) {
        if (shader.compiled) return;
        this.gl.compileShader(shader);
        shader.compiled = true;
    }

    _createShaderProgram(vs, fs) {
        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        return program;
    }

    ////////////
    // RENDER //
    ////////////

    bindFramebuffer(fbo) {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
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

    // Clear the canvas (both color and depth information)
    clear(r, g, b, a) {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    // Draws a specified number of vertices
    draw(numberOfVertices) {
        this.gl.drawArrays(this.gl.TRIANGLES,  0, numberOfVertices);
    }

    // Sets the viewport of the webgl context
    setViewport(width, height) {
        //this.canvas.width = width;
        //this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

    /////////////
    // SHADERS //
    /////////////

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
        if(this.currentProgram === program) return;
        this.currentProgram = program;
        this.gl.useProgram(program);
    }

    // Sets the uniform value of a specific shader
    // Type corresponds to the webgl API uniform setters
    // For example, if "value" is an integer, then "type" should be "1i"
    // If "value" is a float array with three elements, "type" should be "3fv", and so on
    setUniform(program, name, type, value) {
        this.setShaderProgram(program);

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

    setTexture(texture, unit) {
        // Tell WebGL we want to affect texture unit "unit"
        this.gl.activeTexture(this.gl["TEXTURE" + unit]);

        // Bind the texture 
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    }

    //////////////
    // DELETING //
    //////////////

    deleteTexture(texture) {
        this.gl.deleteTexture(texture);
    }

    deleteFramebuffer(fbo) {
        this.gl.deleteFramebuffer(fbo);
    }

    //////////
    // UTIL //
    //////////
    flush() {
        this.gl.flush();
    }

    // Binds a buffer
    bindBuffer(bufferType, buffer) {
        this.gl.bindBuffer(bufferType, buffer);
    }

    // Returns the webgl context
    getGL() {
        return this.gl;
    }
}

// Create and export a static GLC instance which can be used globally
//const GLC = new GLCommander();
export {
    GLController
}