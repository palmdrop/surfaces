import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import InputSlider from '../input/InputSlider'
import TXC from '../../context/TextureController'

import './Canvas.css'

///////////////
// COMPONENT //
///////////////
const Canvas = (props) => {
  const canvasRef = useRef();

  ///////////////////
  // USER SETTINGS //
  ///////////////////
  const [animationSpeed, setAnimationSpeed] = useState(0.2);
  useEffect(() => {
    TXC.animationSpeed = animationSpeed;
  });

  // warpAmount: The base level domain warp amount
  const [warpAmount, setWarpAmount] = useState(100);
  useEffect(() => {
    TXC.warpAmount = warpAmount;
  }, [warpAmount]);

  // sourceFrequency: The base noise frequency
  const [sourceFrequency, setSourceFrequency] = useState(() => Math.random() * 0.04);
  useEffect(() => {
    TXC.sourceFrequency = sourceFrequency / 100;
  }, [sourceFrequency]);

  // warpIterations: The number of warp iterations
  const [warpIterations, setWarpIterations] = useState(2);
  useEffect(() => {
    TXC.warpIterations = warpIterations;
  }, [warpIterations]);


  ///////////////////////
  // RENDER AND UPDATE //
  ///////////////////////
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

  // Create a hook for handling resize events
  const handleResize = () => TXC.handleResize();
  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  });

  const sliders = [
    {
      label: "Animation speed",
      state: [animationSpeed, setAnimationSpeed],
      min: 0.0,
      max: 2,
      step: 0.005,
      constrain: true
    },
    {
      label: "Warp amount",
      state: [warpAmount, setWarpAmount],
      min: 0.0,
      max: 1000,
      step: 1,
      constrain: true
    },
    {
      label: "Source frequeny",
      state: [sourceFrequency, setSourceFrequency],
      min: 0.0000001,
      max: 5,
      step: 0.00001,
      constrain: true
    },
    {
      label: "Warp iterations",
      state: [warpIterations, setWarpIterations],
      min: 0,
      max: 4,
      step: 1,
      constrain: true,
      marks: [1, 2, 3, 4],
    },
  ];

  return (
      <div>
        <div className="settings">
          <div className="settings__container">
            {sliders.map((s, i) => (
              <InputSlider 
                key={i}
                label={s.label}
                valueGetter={() => s.state[0]}
                onChange={s.state[1]}
                min={s.min}
                max={s.max}
                step={s.step}
                constrain={s.constrain}
              />))};
          </div>
        </div>
        <canvas className="canvas" ref={canvasRef}/>
      </div>
  )
}

export default Canvas;
