import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'

import ControlPanel from '../input/ControlPanel'

import TXC from '../../context/TextureController'


import './Canvas.css'

const Canvas = (props) => {
  const canvasRef = useRef();

  // Initialize texture controller in use effect hook to ensure that
  // the canvas element has been initialized first
  useEffect(() => {
    if(!TXC.isInitialized()) {
      // Initialize the texture controller 
      if(TXC.initialize(canvasRef.current) === -1) {
        throw new Error("Texture controller failed to initialize");
      }

      // Immediately resize to fill the available space
      TXC.handleResize();
    }

    // Start the render loop
    TXC.startRenderLoop();

    return () => {
      // Stop the render loop
      TXC.stopRenderLoop();
    }

  }, []);

  // Handle resize events
  const handleResize = () => TXC.handleResize();
  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  });

  return (
      <div>
        <div className="settings"> 
          <ControlPanel 
            attributes={TXC.attributes}
            getter={(name) => TXC.getValue(name)}
            setter={(name, value) => TXC.updateValue(name, value)}
            separator={"."}
          />
        </div>
        <canvas className="canvas" ref={canvasRef}/>
      </div>
  )
}

export default Canvas;
