import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import GLC from '../GL/GLC'

import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'



const Canvas = (props) => {
  const canvasRef = useRef();
  const [program, setProgram] = useState(-1);
  const [initialized, setInitialized] = useState(false);

  const initializeQuad = (canvasRef) => {
    if(initialized) return;

    const canvas =  canvasRef.current;

    if(!canvas) {
        console.log("The canvas is not initialized")
        return;
    }

    var gl = canvas.getContext('webgl');

    if(!gl) {
      console.log('Webgl not supported, falling back on experimental-webgl');
      gl = canvas.getContext('experimental-webgl');
    }

    if(!gl) {
        alert("Your browser does not support WebGL");
        return;
    }


    GLC.init(canvas, gl);
    //GLC.setViewport(window.innerWidth, window.innerHeight);
    handleResize();

    //const program = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);
    setProgram(GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource));
    if(program === -1) return;

    var triangleVertices = 
    [
       -1.0,  1.0,   1.0, 1.0, 0.0,
       -1.0, -1.0,   0.0, 1.0, 1.0,
        1.0, -1.0,   1.0, 0.0, 1.0,

       -1.0,  1.0,   1.0, 1.0, 0.0,
        1.0,  1.0,   0.0, 0.0, 1.0,
        1.0, -1.0,   1.0, 0.0, 1.0
    ];

    var buffer = GLC.createBuffer(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    GLC.setAttribLayout(
      program, 
      'vertPosition',
      2,
      gl.FLOAT,
      5 * Float32Array.BYTES_PER_ELEMENT,
      0
    );

    GLC.setAttribLayout(
      program,
      'vertColor',
      3,
      gl.FLOAT,
      5 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT
    );

    setInitialized(true);
    renderQuad();
  };

  const handleResize = () => {
    if(!initialized) return;
    GLC.setViewport(window.innerWidth, window.innerHeight);
    GLC.draw(program, 6);
  }

  const renderQuad = () => {
    GLC.clear(0, 0.1, 0.1, 1);
    GLC.draw(program, 6);
  }

  useEffect(() => {
    initializeQuad(canvasRef);
  });

  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  });

  return (
      <canvas 
          ref={canvasRef}
          width="400"
          height="400"    
      />
  )
}

export default Canvas;
