import React, { useRef, useEffect, useLayoutEffect } from 'react'
import InputSlider from '../input/InputSlider'
import TXC from '../../context/TextureController'
import { camelToTitle } from '../../tools/Utils'

import './Canvas.css'

const Canvas = (props) => {
  const canvasRef = useRef();

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
          <div className="settings__container">
            {
              Object.entries(TXC.attributes).map(([name, attribute], index) => (
                <InputSlider
                  key={index}
                  label={camelToTitle(name)}
                  valueGetter={() => TXC.getValue(name)}
                  onChange={(v) => TXC.updateValue(name, v)}
                  min={attribute.min}
                  max={attribute.max}
                  step={
                    // If the attribute has a step property, use that
                    attribute.hasOwnProperty("step") ? attribute.step :
                    // Otherwise, check if the attribute is of integer type
                    // If yes, set step to "1", otherwise calculate a small step based on 
                    // the min and max values
                    (attribute.type === "1i" ? 1 : (attribute.max - attribute.min) / 1000)
                  }
                  marks={attribute.marks}
                  constrain={true}
                />
              ))
            }
          </div>
        </div>
        <canvas className="canvas" ref={canvasRef}/>
      </div>
  )
}

export default Canvas;
