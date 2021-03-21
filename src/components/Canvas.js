import React, { useRef, useEffect, forwardRef } from 'react'
import GLC from '../GL/GLC'
import vertexShaderSource from '../GL/shaders/vertex'
import fragmentShaderSource from '../GL/shaders/fragment'

const Canvas = (props) => {
  const canvasRef = useRef();

  const initialize = (canvasRef) => {

  };

  useEffect(() => {
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
    GLC.setViewport(window.innerWidth, window.innerHeight);
    GLC.clear(0, 0.1, 0.1, 1);

    const program = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);
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

    GLC.draw(program, 6);

  }, [canvasRef]);

    return (
        <canvas 
            ref={canvasRef}
            width="400"
            height="400"    
            style={{ border: '1px solid black'}}
        />
    )
}

export default Canvas;
