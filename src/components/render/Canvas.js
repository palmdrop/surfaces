import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'
import ControlPanel from '../input/ControlPanel'
import TXC from '../../context/TextureController'

import { downloadJSON, promptDownload } from '../../tools/Utils'
import { useMousePosition } from '../../hooks/MousePositionHook'

import './Canvas.css'

const Canvas = (props) => {
  ////////////////
  // REFERENCES //
  ////////////////
  const canvasRef    = useRef(); // The canvas object who holds the WebGL context
  const settingsRef  = useRef(); // The settings panel
  const fileInputRef = useRef(); // The file input tag that is used to handle user file choosing

  ////////////
  // STATES //
  ////////////
  const mousePosition = useMousePosition(); // Custom state/hook which tracks the current mouse position
  const [paused, setPaused] = useState(false); // Pauses/unpauses the animation

  const [panelVisible, setPanelVisible] = useState(true); // The visiblity state of the settings panel
  const [autoHide, setAutoHide] = useState(false); // If true, the panel will hide automatically 

  // States for handling view change using mouse
  // The user can drag the canvas to move the view
  const [mouseDown, setMouseDown] = useState(false); // True if the primary mouse button is held
  const [anchor, setAnchor] = useState([0, 0]); // The "anchor" is the position where the mouse was first pressed
  const [prevPosition, setPrevPosition] = useState([0, 0]); // A copy of the previous view position

  // A reducer used to force update the panel (required when the settings are changed outside the panel)
  const [, refreshPanel] = useReducer(x => x + 1, 0);

  ////////////////////
  // EVENT HANDLERS //
  ////////////////////

  // GENERAL

  // Pauses the animation entirely (same effect as setting the general animation speed to 0.0)
  const togglePause = () => {
    TXC.setPaused(!paused);
    setPaused(!paused);
  };

  const changeAnimationSpeed = (delta) => {
    var speed = TXC.getValue("animationSpeed.general");
    TXC.updateValue("animationSpeed.general", Math.max(speed + delta, 0.0));
    refreshPanel();
  };

  // KEYBOARD INPUT

  // User input through keyboard shortcuts
  // TODO abstract all user input to a separate object, containing descriptions etc 
  // TODO then use these description for tooltip

  // TODO create better interface for changing values using functions
  // TODO ability to change values using keyboard and having it reflect in panel automatically
  const shortcuts = new Map()
    .set('h', {
        action: (e) => {
          if(autoHide) {
            setAutoHide(false);
            setPanelVisible(true);
          } else {
            setAutoHide(true);
          }
        },
        description: "Hide or unhide the settings panel"
    })
    .set('d', {
      action: (e) => {
        handleCanvasDownload(e);
      },
      description: "Download the current frame as a PNG image"
    })
    .set(' ', {
      action: (e) => {
        e.preventDefault();
        togglePause();
      },
      description: "Toggle pause of the animation"
    })
    .set('-', {
      action: (e) => {
        changeAnimationSpeed(-0.01);
      },
      description: "Slow down animation speed"
    })
    .set('+', {
      action: (e) => {
        changeAnimationSpeed(0.01);
      },
      description: "Speed up animation speed"
    })
    
    ;
  

  const handleKeyPress = (event) => {
    if(shortcuts.has(event.key)) {
      shortcuts.get(event.key).action(event); 
    }
  }

  // MOUSE INPUT

  // Zoom the view on user scroll (same effect as in changing the "scale" slider)
  const handleScroll = (event) => {
    // Get the current scale value
    var scale = TXC.getValue("scale");

    // Calculate a new scale value based on the previous one
    const delta = Math.sign(event.deltaY) * scale * 0.1; 
    scale += delta;

    // Update the value in the texture controller
    TXC.updateValue("scale", scale);

    // Refresh the panel to ensure that the slider value reflects the change
    refreshPanel();
  }

  // Sets the anchor point and stores the previous offset
  // These values will then be used to calculate the new position of the view
  const handleMouseDown = (event) => {
    if(mouseDown) return;
    setAnchor([mousePosition.x, mousePosition.y]);
    setPrevPosition([TXC.position[0], TXC.position[1]]);
    setMouseDown(true);
  }

  // Register when the mouse is released
  // This will be triggered if the mouse button is let go, or if the
  // mouse leaves the canvas area
  const handleMouseReleased = (event) => {
    if(!mouseDown) return;
    setMouseDown(false);
  }

  // IMPORT/EXPORT

  // Handle canvas download 
  const handleCanvasDownload = (event) => {
    // Capture the next frame and prompt a download using a callback function
    // This is required since the canvas has to be captured after the render
    // Otherwise, the resulting image will be blank
    TXC.captureFrame((dataURL) => {
      promptDownload(dataURL, "canvas.png");
      //event.currentTarget.blur();
    });
  };

  // Handle settings download
  const handleSettingsDownload = (event) => {
    // Downloads the current settings of the texture controller
    downloadJSON(TXC.exportSettings(), "settings.json");

    event.currentTarget.blur();
  };

  // Function for prompting the user with a file chooser window
  const handleSettingsImport = (event) => {
    fileInputRef.current.click();
    event.currentTarget.blur();
  };

  // Sets the current settings file from an input event
  // Is called when the user chooses a file in the dialog prompted by 
  // the handleSettingsImport function
  const handleInputChange = (event) => {
    // The selected file
    const file = event.target.files[0];

    // If non-null...
    if(file) {
      // Read file, and import the contents to the texture controller
      var reader = new FileReader();
      reader.onload = (f) => {
        TXC.importSettings(f.target.result);
        // Refresh the panel to set the correct slider values
        refreshPanel();
      };

      reader.readAsText(file);
    }
  };

  // Changes the auto hide state
  const handleAutoHide = (event) => {
    setAutoHide(!autoHide);
    event.currentTarget.blur();
  };

  //////////////////
  // EFFECT HOOKS //
  //////////////////

  // INITIALIZATION

  // Initialize texture controller
  // A hook is used to ensure that the canvas element has been initialized first
  useEffect(() => {
    // If the texture controller hasn't been initialized yet, initialize
    if(!TXC.isInitialized()) {
      if(TXC.initialize(canvasRef.current) === -1) {
        // TODO better error handling with suitable messages
        throw new Error("Texture controller failed to initialize");
      }
      // Immediately resize to fill the available space
      TXC.handleResize();
    }

    // Start the render loop immediately
    TXC.startRenderLoop();
    return () => TXC.stopRenderLoop();
  }, []);

  // WINDOW RESIZE

  // Handle resize events
  useLayoutEffect(() => {
    // Let the texture controller handle the resize
    const handleResize = () => TXC.handleResize();

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  });

  // INPUT LISTENERS

  // Register all global listeners
  useEffect(() => {

    // Handle keyboard shortcuts
    document.addEventListener("keydown", handleKeyPress);

    // Handle zoom 
    canvasRef.current.addEventListener("wheel", handleScroll);

    // For moving the view (both mouseup and mouseout acts as mouse released)
    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mouseup", handleMouseReleased);
    canvasRef.current.addEventListener("mouseout", handleMouseReleased);

    const canvasCopy = canvasRef.current;

    // Remove all listeners on re-render
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
      canvasCopy.removeEventListener("wheel", handleScroll);
      canvasCopy.removeEventListener("mousedown", handleMouseDown);
      canvasCopy.removeEventListener("mouseup", handleMouseReleased);
      canvasCopy.removeEventListener("mouseout", handleMouseReleased);
    };
  });

  // MOUSE MOVEMENT

  //  Effect for handling view movement using mouse drag
  useEffect(() => {
    // If the mouse is not held, do nothing
    if(!mouseDown) return;

    // Get the current scale. This is used to correctly translate the view
    var scale = TXC.getValue("scale");

    // The offset from the anchor point 
    const offset = [(anchor[0] - mousePosition.x) * scale, (anchor[1] - mousePosition.y) * scale];

    // The previous view position
    // This previous position is set once the mouse button is first pressed
    TXC.setPosition([
      prevPosition[0] + offset[0], 
      prevPosition[1] - offset[1]
    ]);
  }, [mousePosition, mouseDown, anchor, prevPosition]);

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


  //////////
  // BODY //
  //////////
  return (
      /* Root container */
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

          { /* Pause button */}
          <div className="button-container settings__pause-button-container">
            <button 
              className={"button settings__pause-button-container__button" + (paused ? " active " : "")}
              onClick={togglePause}>{paused ? "Unpause" : "Pause" }</button>
          </div>

          { /* General control panel */}
          <ControlPanel 
            attributes={TXC.attributes}
            getter={(name) => TXC.getValue(name)}
            setter={(name, value) => TXC.updateValue(name, value)}
            defaults={(name) => TXC.getDefault(name)}
            separator={"."}
            //key={panelRefresh}
          />

          { /* Button for auto hinding settings panel */}
          <div className="settings__auto-hide-button-container">
            <button 
              className={"button settings__auto-hide-button-container__button" + (autoHide ? " active" : "")} 
              onClick={handleAutoHide}>
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
