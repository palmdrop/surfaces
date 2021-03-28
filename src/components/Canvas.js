import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import GLC from '../GL/GLC'
import { noiseTypes, setNoiseSettings, createNoiseSettings } from '../GL/noise/NoiseSettings';

import vertexShaderSource from '../GL/shaders/simple.vert'
import fragmentShaderSource from '../GL/shaders/warp.frag'



const Canvas = (props) => {
  const canvasRef = useRef();

  const [program, setProgram] = useState(-1);
  const [offset, setOffset] = useState([0.0, 0.0, 0.0]);

  const [initialized, setInitialized] = useState(false);

  const initialize = (canvasRef) => {
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

    const p = GLC.createShaderProgram(vertexShaderSource, fragmentShaderSource);

    if(!p) {
      console.log("UUUH")  ;
      return;
    }

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
      p, 
      'vertPosition',
      2,
      gl.FLOAT,
      5 * Float32Array.BYTES_PER_ELEMENT,
      0
    );

    GLC.setAttribLayout(
      p,
      'vertColor',
      3,
      gl.FLOAT,
      5 * Float32Array.BYTES_PER_ELEMENT,
      2 * Float32Array.BYTES_PER_ELEMENT
    );

    // SET UNIFORMS
    const offset = [Math.random() * 1000, Math.random() * 1000, 1.0];
    const source = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 0.8);
    const angleControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 0.8);
    const amountControl = createNoiseSettings(noiseTypes.SIMPLEX, 3, Math.random() * 0.01, offset, 0.8);
    const amount = 200;

    GLC.setShaderProgram(p);
    setNoiseSettings(source, p, "source");
    setNoiseSettings(angleControl, p, "angleControl");
    setNoiseSettings(amountControl, p, "amountControl");
    GLC.setUniform(p, "amount", "1f", amount);

    setInitialized(true);
    setProgram(p);
    setOffset(offset);

    return {program: p, offset: offset};
  };

  const handleResize = () => {
    if(!initialized) return;
    GLC.setViewport(window.innerWidth, window.innerHeight);
    renderQuad();
  }

  const renderQuad = () => {
    GLC.clear(0, 0.1, 0.1, 1);
    GLC.draw(6);
  }

  useEffect(() => {
    let p, o;
    if(!initialized) {
      const r = initialize(canvasRef);
      p = r.program;
      o = r.offset;
    } else {
      p = program;
      o = offset;
    }

    console.log(offset);

    let requestId;
    let time = 0.0;
    const render = () => {
      GLC.setUniform(p, "source.offset",        "3fv", [o[0], o[1], time * 1.0]);
      GLC.setUniform(p, "angleControl.offset",  "3fv", [o[0], o[1], time * 0.5]);
      GLC.setUniform(p, "amountControl.offset", "3fv", [o[0], o[1], time * 2]);
      //GLC.setUniform(p, "amount", "1f", 100 * time * 2);
      renderQuad();
      time += 0.01;
      requestId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(requestId);
    }

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
