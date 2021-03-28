class GLCommander {
    constructor() {
        this.initialized = false;
    }

    init(canvas, gl) {
        this.canvas = canvas;
        this.gl = gl;
        this.initialized = true;
    }

    isInitialized() {
        return this.initialized;
    }

    clear = (r, g, b, a) => {
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setViewport(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }

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

    createBuffer(bufferType, data, drawMode) {
        var buffer = this.gl.createBuffer();
        this.bindBuffer(bufferType, buffer);
        this.gl.bufferData(bufferType, new Float32Array(data), drawMode);
    }

    bindBuffer(bufferType, buffer) {
        this.gl.bindBuffer(bufferType, buffer);
    }

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

    setShaderProgram(program) {
        this.gl.useProgram(program);
    }

    setUniform(program, name, funcName, value) {
        //TODO cache location ((program, name) => location map)to avoid doing name lookups every time
        const location = this.gl.getUniformLocation(program, name);
        //TODO use function name or suffix to find function!!!!!!!!!!!! pass that instead of lambda function etc
        this.gl["uniform" + funcName](location, value);
    }

    draw(numberOfVertices) {
        //this.setShaderProgram(program);
        this.gl.drawArrays(this.gl.TRIANGLES,  0, numberOfVertices);
    }

    getGL() {
        return this.gl;
    }
}

const GLC = new GLCommander();

export default GLC;