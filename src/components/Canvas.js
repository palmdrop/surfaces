import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { Slider } from '@material-ui/core'
import GLC from '../GL/GLC'
import TextureController from '../GL/TextureController'

// Noise-related imports, these functions and objects
// are adapted to work well with GLSL structs in the warp shader
import { noiseTypes, setNoiseSettings, createNoiseSettings } from '../GL/noise/NoiseSettings';

// Shaders imported using glslify
import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'
import TXC from '../GL/TextureController';

///////////////
// COMPONENT //
///////////////
const Canvas = (props) => {
  const canvasRef = useRef();

  //////////////////
  // BASIC STATES //
  //////////////////
  // Shader program used for rendering texture
  const [program, setProgram] = useState(-1);

  // The offset (seed) of the noise functions
  const [offset, setOffset] = useState([0.0, 0.0, 0.0]);

  // Store time in references to avoid triggering rerender on update
  const previousMillis = useRef();
  const time = useRef();

  // True if the openGL context has been initialized and 
  // the GPU has been loaded with vertex data
  const [initialized, setInitialized] = useState(false);


  ///////////////////
  // USER SETTINGS //
  ///////////////////
  const [animationSpeed, setAnimationSpeed] = useState(20);
  const [warpAmount, setWarpAmount] = useState(100);

  ////////////////
  // INITIALIZE //
  ////////////////

  // Initializes the openGL context and loads the GPU with vertex data
  const initialize = (canvas) => {
    if(initialized) return 0;

    // INITIALIZE THE OPENGL CONTEXT

    // Get the canvas object
    //const canvas =  canvasRef.current;

    // If the canvas is null, we cannot proceed. Abort.
    if(!canvas) {
        console.log("The canvas is not initialized")
        return -1;
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
        return -1;
    }

    // INITIALIZE GLC (HELPER CLASS)

    // This class is used as a facade against the webgl context
    GLC.init(canvas, gl);

    // Create the shader program using the imported shaders
    const p = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);

    if(!p) {
      throw new Error("Shader not created");
    }

    // Create triangle data
    // Two triangles are created to form a quad which fills the entire screen
    const triangleVertices = 
    [
       -1.0,  1.0,   //1.0, 1.0, 0.0,
       -1.0, -1.0,   //0.0, 1.0, 1.0,
        1.0, -1.0,   //1.0, 0.0, 1.0,

       -1.0,  1.0,   //1.0, 1.0, 0.0,
        1.0,  1.0,   //0.0, 0.0, 1.0,
        1.0, -1.0,   //1.0, 0.0, 1.0
    ];

    GLC.createBuffer(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    GLC.setAttribLayout(
      p, 
      'vertPosition',
      2,
      gl.FLOAT,
      //5 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT,
      0
    );

    /*GLC.setAttribLayout(
      p,
      'vertColor',
      3,
      gl.FLOAT,
      5 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT
    );*/

    // DEFINE VALUES
    // TODO move this to sliders and user input etc
    const offset = [Math.random() * 1000, Math.random() * 1000, 1.0];
    const source = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.004, offset, 1.0);
    const angleControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 1.0);
    const amountControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 1.0);
    const amount = 100;
    const iterations = 2;

    // SET SHADER UNIFORMS 
    GLC.setShaderProgram(p);

    // Set noise settings
    setNoiseSettings(source, p, "source");
    setNoiseSettings(angleControl, p, "angleControl");
    setNoiseSettings(amountControl, p, "amountControl");
    
    // Set other data
    GLC.setUniform(p, "amount", "1f", amount);
    GLC.setUniform(p, "time", "1f", 0.0);
    GLC.setUniform(p, "iterations", "1i", iterations);

    // Finally, set required states
    setInitialized(true);
    setProgram(p);
    setOffset(offset);

    // Some state information is also returned
    // This ensures that these values can be used in a useEffect hook
    // below (the states are not set until we exit the useEffect hook)
    return {program: p, offset: offset};
  };

  // Change the viewport on resize, to ensure that the 
  // canvas covers all available space
  const handleResize = () => {
    //if(!initialized) return;
    //GLC.setViewport(window.innerWidth, window.innerHeight);
    TXC.handleResize();
  }

  // Short function for rendering the quad to the entire screen
  const renderQuad = () => {
    GLC.clear(0, 0.0, 0.0, 1);
    GLC.draw(6);
  }

  ///////////////////////
  // RENDER AND UPDATE //
  ///////////////////////
  useEffect(() => {
    let p, o;
    // If the canvas has not been initialized yet, initialize
    /*if(!initialized) {
      const r = initialize(canvasRef.current);
      time.current = 0.0;

      if(r === -1) {
        throw new Error("WebGL initialization failed");
      }

      p = r.program;
      o = r.offset;
    } else {
      // Otherwise, use values stored in states
      p = program;
      o = offset;
    }*/
    if(!TXC.isInitialized()) {
      TXC.initialize(canvasRef.current);
      TXC.handleResize();
      time.current = 0.0;
    }
    //p = TXC.program;
    //o = TXC.offset;

    TXC.warpAmount = warpAmount;

    // Request id is stored to enable cancling the animation
    let requestId;

    previousMillis.current = Date.now();

    // Main render loop
    const render = () => {
      let now = Date.now();
      let deltaMillis = now - previousMillis.current;
      time.current += animationSpeed * deltaMillis / 100000;

      // Update shader uniforms
      /*GLC.setUniform(p, "source.offset",        "3fv", [o[0], o[1], time.current * 1.0]);
      GLC.setUniform(p, "angleControl.offset",  "3fv", [o[0], o[1], time.current * 0.5]);
      GLC.setUniform(p, "amountControl.offset", "3fv", [o[0], o[1], time.current * 2]);
      GLC.setUniform(p, "time", "1f", time.current);
      GLC.setUniform(p, "amount", "1f", warpAmount);


      // Render
      renderQuad();*/
      TXC.render(time.current);

      //time += 0.01;
      requestId = requestAnimationFrame(render);

      previousMillis.current = now;

      console.log(time.current);
    }

    // This call starts the render loop
    render();

    return () => {
      // Ensure that the animation is cancelled if the effect is ran again,
      // to prevent us from having multiple active animation frames
      cancelAnimationFrame(requestId);
    }

  }, [animationSpeed, warpAmount]);

  // Create a hook for handling resize events
  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  });

  // Body
  return (
      <div>
        <Slider 
          value={animationSpeed}
          onChange={ (e, a) => setAnimationSpeed(a) }
          aria-labelledby="continuous-slider"
          min={0.0}
          max={100}
        />
        <Slider 
          value={warpAmount}
          onChange={ (e, w) => setWarpAmount(w) }
          aria-labelledby="continuous-slider"
          min={0.0}
          max={1000}
        />
        <canvas 
            ref={canvasRef}
            width="400"
            height="400"    
        />
      </div>
  )
}

export default Canvas;
