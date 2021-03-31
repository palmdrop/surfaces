import React, { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { Slider, Grid } from '@material-ui/core'
import TXC from '../GL/TextureController';

///////////////
// COMPONENT //
///////////////
const Canvas = (props) => {
  const canvasRef = useRef();

  //////////////////
  // BASIC STATES //
  //////////////////
  // Store time in references to avoid triggering rerender on update
  const previousMillis = useRef();
  const time = useRef();

  ///////////////////
  // USER SETTINGS //
  ///////////////////
  const [animationSpeed, setAnimationSpeed] = useState(20);

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

  ///////////////////////
  // RENDER AND UPDATE //
  ///////////////////////
  useEffect(() => {
    if(!TXC.isInitialized()) {
      // Initialize the texture controller 
      TXC.initialize(canvasRef.current);

      // Immediatelly resize to fill the available space
      //TXC.handleResize();

      // Set initial time values
      time.current = 0.0;
      previousMillis.current = Date.now();
    }

    // Request id is stored to enable cancling the animation
    let requestId;

    // Main render loop
    const render = () => {
      // Calculate time used by texture controller
      let now = Date.now();
      let deltaMillis = now - previousMillis.current;
      time.current += animationSpeed * deltaMillis / 100000;

      // Render
      TXC.render(time.current);

      previousMillis.current = now;
      requestId = requestAnimationFrame(render);
    }

    // This call starts the render loop
    render();

    return () => {
      // Ensure that the animation is cancelled if the effect is ran again,
      // to prevent us from having multiple active animation frames
      cancelAnimationFrame(requestId);
    }

  }, [animationSpeed]);

  // Create a hook for handling resize events
  /*const handleResize = () => TXC.handleResize();
  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    }
  });*/

  return (
      <Grid
        container
        spacing={2}
        direction='row'
        alignContent='center'
        alignItems='center'
      >
        <Grid
          item
          container
          spacing={2}
          direction='column'
          xs={3}
        >
          <Grid item xs={"auto"}>
            <Slider 
              value={animationSpeed}
              onChange={ (e, a) => setAnimationSpeed(a) }
              aria-labelledby="continuous-slider"
              min={0.0}
              max={100.0}
            />
          </Grid>
          <Grid item xs={"auto"}>
            <Slider 
              value={warpAmount}
              onChange={ (e, w) => setWarpAmount(w) }
              aria-labelledby="continuous-slider"
              min={0.0}
              max={1000.0}
            />
          </Grid>
          <Grid item xs={"auto"}>
            <Slider 
              value={sourceFrequency}
              onChange={ (e, f) => setSourceFrequency(f) }
              aria-labelledby="continuous-slider"
              step={0.00001}
              min={0.0000001}
              max={5.0}
            />
          </Grid>
        </Grid>
        <Grid item xs={2}> 
          <canvas 
              ref={canvasRef}
              //style={{width=}}
          />
        </Grid>
      </Grid>
  )
}

export default Canvas;
