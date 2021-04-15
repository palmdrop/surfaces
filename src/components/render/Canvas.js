import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'
import ControlPanel from '../input/ControlPanel'
import TXC from '../../context/TextureController'

import { downloadJSON, promptDownload } from '../../tools/Utils'
import { useMousePosition } from '../../hooks/MousePositionHook'

import './Canvas.css'

const Canvas = (props) => {
  const canvasRef = useRef();

  const settingsRef = useRef();

  const fileInputRef = useRef();

  const mousePosition = useMousePosition();
  const [panelVisible, setPanelVisible] = useState(true);
  const [autoHide, setAutoHide] = useState(false);

  //const [panelRefresh, refreshPanel] = useReducer(x => x + 1, 0);

  // User input through keyboard shortcuts
  const handleKeyPress = (event) => {
    switch(event.key) {
      case 'h': // Toggle settings panel
        setPanelVisible(!panelVisible);
        setAutoHide(false);
      break;
      case 'd': // Download shortcut
        handleCanvasDownload();
      break;
      default:
      break;
    }
  }

  // Listen for keyboard events 
  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);

    canvasRef.current.addEventListener("wheel", handleScroll);
    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mouseup", handleMouseReleased);
    canvasRef.current.addEventListener("mouseout", handleMouseReleased);

    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      canvasRef.current.removeEventListener("wheel", handleScroll);
      canvasRef.current.removeEventListener("mousedown", handleMouseDown);
      canvasRef.current.removeEventListener("mouseup", handleMouseReleased);
      canvasRef.current.removeEventListener("mouseout", handleMouseReleased);
    };
  });

  const handleScroll = (event) => {
    var scale = TXC.getValue("scale");
    const delta = Math.sign(event.deltaY) * scale * 0.1;
    scale += delta;
    TXC.updateValue("scale", scale);
    //refreshPanel();
  }

  //TODO remove offset from TXC, not needed when I have pos?
  const [mouseDown, setMouseDown] = useState(false);
  const [anchor, setAnchor] = useState([0, 0]);
  const [prevPosition, setPrevPosition] = useState([0, 0]);

  const handleMouseDown = (event) => {
    if(mouseDown) return;
    setAnchor([mousePosition.x, mousePosition.y]);
    setPrevPosition([TXC.position[0], TXC.position[1]]);
    setMouseDown(true);
  }
  const handleMouseReleased = (event) => {
    if(!mouseDown) return;
    setMouseDown(false);
  }

  useEffect(() => {
    if(!mouseDown) return;
    var scale = TXC.getValue("scale");

    const offset = [(anchor[0] - mousePosition.x) * scale, (anchor[1] - mousePosition.y) * scale];

    TXC.setPosition([
      prevPosition[0] + offset[0], 
      prevPosition[1] - offset[1]
    ]);

    //TXC.setPosition([mousePosition.x, window.innerHeight - mousePosition.y]);
  }, [mousePosition, mouseDown]);

  // Handle resize events
  const handleResize = () => TXC.handleResize();
  useLayoutEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  });

  // Handle canvas download 
  const handleCanvasDownload = () => {
    TXC.captureFrame((dataURL) => {
      promptDownload(dataURL, "canvas.png");
    });
  };

  // Handle settings download
  const handleSettingsDownload = () => {
    downloadJSON(TXC.exportSettings(), "settings.json");
  };

  // Sets the current settings file from an input event
  const handleInputChange = (event) => {
    const file = event.target.files[0];

    if(file) {
      // Read file, and import the contents to the texture controller
      var reader = new FileReader();
      reader.onload = (f) => {
        TXC.importSettings(f.target.result);
        // Refresh the panel to set the correct slider values
        //refreshPanel();
      };
      reader.readAsText(file);
    }
  };

  // Function for prompting the user with a file chooser window
  const handleSettingsImport = () => {
    fileInputRef.current.click();
  };

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
    TXC.startRenderLoop();
    return () => TXC.stopRenderLoop();
  }, []);

  // Effect for hiding the settings panel if 
  // the mouse is not hovering over it
  useEffect(() => {
    // Check if the mouse is inside a rectangle
    const insideRect = (position, rect) => {
      var x = position.x;
      var y = position.y;
      return x >= rect.x && x < rect.x + rect.width && y >= rect.y  && y < rect.y + rect.height;
    };

    // If auto hide is enabled, check the mouse position against the settings panel
    // Hide if outside, unhide if close to the border
    if(autoHide) {
      // Get the bounding rect of the settings panel
      var rect = settingsRef.current.getBoundingClientRect();
      // Create small offset and expand the rectangle using this offset
      // This ensures that the panel can be unhidden by sliding the mouse close to its regular spot
      var offset = rect.width / 10;
      var expandedRect = { x: rect.x - offset, y: rect.y - offset, width: rect.width + 2 * offset, height: rect.height + 2 * offset};

      // If the settings panel is currently visible and the mouse is outside its rectangle, hide
      if(panelVisible && !insideRect(mousePosition, expandedRect)) {
        setPanelVisible(false);
      // If the settingsp anel is hidden and the mouse is inside its expanded rectangle (close to the window border), unhide
      } else if(!panelVisible && insideRect(mousePosition, expandedRect)) {
        setPanelVisible(true);
      }
    }
  },[mousePosition, autoHide, panelVisible]);

  return (
      <div className="canvas-container">

        { /* Settings panel */}
        <div 
          className={"settings" + (panelVisible ? "" : " settings-hidden")}
          ref={settingsRef}
        > 

          { /* Download canvas button */}
          <div className="button-container settings__capture-button-container">
            <button className="button settings__capture-button-container__button" onClick={handleCanvasDownload}>Capture frame</button>
          </div>

          { /* Container for export and import buttons */ }
          <div className="settings__import-export-container">

            { /* Export settings button */}
            <div className="button-container settings__export-button-container">
              <button className="button settings__export-button-container__button" onClick={handleSettingsDownload}>Export</button>
            </div>

            { /* Import settings button */}
            <div className="button-container settings__import-button-container">
              <button className="button settings__import-button-container__button" onClick={handleSettingsImport}>Import</button>
              <input 
                ref={fileInputRef} 
                type="file" 
                style={{ display: "none" }}
                onChange={handleInputChange}
                accept="application/JSON"
              />
            </div>
          </div>

          { /* General control panel */}
          <ControlPanel 
            attributes={TXC.attributes}
            getter={(name) => TXC.getValue(name)}
            setter={(name, value) => TXC.updateValue(name, value)}
            separator={"."}
            //key={panelRefresh}
          />

          { /* Button for auto hinding settings panel */}
          <div className="settings__auto-hide-button-container">
            <button 
              className={"button settings__auto-hide-button-container__button" + (autoHide ? " active" : "")} 
              onClick={() => setAutoHide(!autoHide)}>
                {!autoHide ? "Enable auto hide" : "Disable auto hide"}
            </button>
          </div>
        </div>

        { /* Canvas for WebGL context */}
        <canvas 
          className="canvas" 
          ref={canvasRef}
        />
      </div>
  )
}

export default Canvas;
