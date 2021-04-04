import React, { useRef, useEffect, useLayoutEffect } from 'react'
import InputSlider from '../input/InputSlider'
import TXC from '../../context/TextureController'

import './Canvas.css'
import useTXCState from '../../hooks/TXCStateHook';

///////////////
// COMPONENT //
///////////////
const Canvas = (props) => {
  const canvasRef = useRef();

  ///////////////////
  // USER SETTINGS //
  ///////////////////
  const [animationSpeed, setAnimationSpeed] = useTXCState("animationSpeed", 0.2);

  // warpAmount: The base level domain warp amount
  const [warpAmount, setWarpAmount] = useTXCState("warpAmount", 100);

  // sourceFrequency: The base noise frequency
  const [sourceFrequency, setSourceFrequency] = useTXCState("sourceFrequency", Math.random() * 0.002);

  // angleFrequency: The noise frequency of the angle controller
  const [angleFrequency, setAngleFrequency] = useTXCState("angleFrequency", Math.random() * 0.01);

  // amountFrequency: The noise frequency of the amount controller
  const [amountFrequency, setAmountFrequency] = useTXCState("amountFrequency", Math.random() * 0.01);

  // warpIterations: The number of warp iterations
  const [warpIterations, setWarpIterations] = useTXCState("warpIterations", 2);

  // warpIterations: The number of warp iterations
  const [ridgeThreshold, setRidgeThreshold] = useTXCState("ridgeThreshold", 1.0);

  // octaves: The number of fractal noise octaves
  const [octaves, setOctaves] = useTXCState("octaves", 5);

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
      max: 0.035,
      step: 0.00000001,
      constrain: true
    },
    {
      label: "Angle frequeny",
      state: [angleFrequency, setAngleFrequency],
      min: 0.0000001,
      max: 0.035,
      step: 0.00000001,
      constrain: true
    },
    {
      label: "Amount frequeny",
      state: [amountFrequency, setAmountFrequency],
      min: 0.0000001,
      max: 0.035,
      step: 0.00000001,
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
    {
      label: "Ridge threshold",
      state: [ridgeThreshold, setRidgeThreshold],
      min: 0.5,
      max: 1.0,
      step: 0.01,
      constrain: true,
    },
    {
      label: "Octaves",
      state: [octaves, setOctaves],
      min: 1,
      max: 8,
      step: 2,
      constrain: true,
      marks: [1, 3, 5, 8],
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
