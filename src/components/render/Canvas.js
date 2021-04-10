import React, { useRef, useState, useEffect, useLayoutEffect } from 'react'
import ControlPanel from '../input/ControlPanel'
import TXC from '../../context/TextureController'

import './Canvas.css'

const Canvas = (props) => {
  const canvasRef = useRef();

  const [panelVisible, setPanelVisible] = useState(true);
  const [autoHide, setAutoHide] = useState(false);

  const handleKeyPress = (event) => {
    switch(event.key) {
      case 'h':
        setPanelVisible(!panelVisible);
      break;
      case 'd':
        handleDownload();
      break;
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  });

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



  const handleDownload = () => {
    TXC.captureFrame((dataURL) => {
      var link=document.createElement('a');
      link.href = dataURL;
      link.download = "canvas.png";
      link.click();
    });
  };

  return (
      <div>
        <div className={"settings" + (panelVisible ? "" : " settings-hidden")}> 
          <div className="settings__download-button-container">
            <button className="button settings__download-button-container__button" onClick={handleDownload}>Download</button>
          </div>
          <ControlPanel 
            attributes={TXC.attributes}
            getter={(name) => TXC.getValue(name)}
            setter={(name, value) => TXC.updateValue(name, value)}
            separator={"."}
          />
          <div className="settings__auto-hide-button-container">
            <button 
              className={"button settings__auto-hide-button-container__button" + (autoHide ? " active" : "")} 
              onClick={() => setAutoHide(!autoHide)}>
                {
                  !autoHide ? "Enable auto hide" : "Disable auto hide"
                }
            </button>
          </div>
        </div>
        <canvas className="canvas" ref={canvasRef}/>
      </div>
  )
}

export default Canvas;
