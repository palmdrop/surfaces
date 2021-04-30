
import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'
import ControlPanel from './components/input/ControlPanel'
import TXC from './context/TextureController'
import AM from './context/AnimationManager'

import { downloadJSON, promptDownload } from './tools/Utils'
import { useMousePosition } from './hooks/MousePositionHook'
import { useKeyboardInput } from './hooks/KeyboardInputHook'

import './App.css';
import DataViewer from './components/tooltip/DataViewer'
import PanelController from './components/input/PanelController'
//import './Canvas.css'

const App = (props) => {
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
  const [, setOnPressed, setOnHeld, executeHeldActions] = useKeyboardInput(); // Custom hook for handling keyboard input

  const [paused, setPaused] = useState(false); // Pauses/unpauses the animation

  const [panelVisible, setPanelVisible] = useState(true); // The visiblity state of the settings panel
  const [autoHide, setAutoHide] = useState(false); // If true, the panel will hide automatically 
  const [dataViewerVisible, setDataViewerVisible] = useState(true); // If true, a popup with render information will be displayed

  // States for handling view change using mouse
  // The user can drag the canvas to move the view
  const [mouseDown, setMouseDown] = useState(false); // True if the primary mouse button is held
  const [anchor, setAnchor] = useState([0, 0]); // The "anchor" is the position where the mouse was first pressed
  const [prevPosition, setPrevPosition] = useState([0, 0]); // A copy of the previous view position

  // A reducer used to force update the panel (required when the settings are changed outside the panel)
  const [, refreshPanel] = useReducer(x => x + 1, 0);

  const [frameRate, setFrameRate] = useState(0);

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
    TXC.updateValue("animationSpeed.general", Math.max(speed * (1 + delta), 0.0));
    refreshPanel();
  };

  const updateScale = (amount) => {
    // Get the current scale value
    var scale = TXC.getValue("scale");

    // Calculate a new scale value based on the previous one
    const delta = amount * scale; 
    scale += delta;

    // Update the value in the texture controller
    TXC.updateValue("scale", scale);

    refreshPanel();

    return delta;
  }


  // KEYBOARD INPUT

  // User input through keyboard shortcuts
  // TODO then use these description for tooltip

  // TODO create better interface for changing values using functions
  // TODO ability to change values using keyboard and having it reflect in panel automatically
  //TODO use array instead since I now iterate over it all the time... will be faster and look better?
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
        onHeld: false,
        description: "Hide or unhide the settings panel"
    })
    .set('c', {
      action: (e) => {
        handleCanvasDownload(e);
      },
      onHeld: false,
      description: "Download the current frame as a PNG image"
    })
    .set(' ', {
      action: (e) => {
        togglePause();
      },
      onHeld: false,
      description: "Toggle pause of the animation"
    })
    .set('-', {
      action: (e) => {
        changeAnimationSpeed(-0.05);
      },
      onHeld: true,
      description: "Slow down animation speed"
    })
    .set('+', {
      action: (e) => {
        changeAnimationSpeed(0.05);
      },
      onHeld: true,
      description: "Speed up animation speed"
    })
    .set('q', {
      action: (e) => {
        updateScale(0.02);
      },
      onHeld: true,
      description: "Zoom out"
    })
    .set('e', {
      action: (e) => {
        updateScale(-0.02);
      },
      onHeld: true,
      description: "Zoom in"
    })
    .set(['ArrowLeft', 'a'], {
      action: () => {
        handleMovement([-10, 0]);
      },
      onHeld: true,
      description: ""
    })
    .set(['ArrowRight', 'd'], {
      action: () => {
        handleMovement([10, 0]);
      },
      onHeld: true,
      description: ""
    })
    .set(['ArrowUp', 'w'], {
      action: () => {
        handleMovement([0, 10]);
      },
      onHeld: true,
      description: ""
    })
    .set(['ArrowDown', 's'], {
      action: () => {
        handleMovement([0, -10]);
      },
      onHeld: true,
      description: ""
    })
  ;


  const handleMovement = (offset) => {
    setMouseDown(false);
    const position = TXC.getPosition(); 
    const scale = TXC.getValue("resolution") * TXC.getValue("scale");
    offset = TXC.screenSpaceToViewSpace(offset);
    TXC.setPosition([position[0] + offset[0] * scale, position[1] + offset[1] * scale]);
  }

  // MOUSE INPUT

  // Zoom the view on user scroll (same effect as in changing the "scale" slider)
  const handleScroll = (event) => {
    const delta = updateScale(Math.sign(event.deltaY) * 0.1);
    
    // Calculate the proportions of the screen
    const proportions = window.innerHeight / window.innerWidth;

    // Offset the center in the direction of the cursor
    var offset = TXC.screenSpaceToViewSpace([
      (mousePosition.x - window.innerWidth  / 2) * delta,
      (mousePosition.y - window.innerHeight / 2) * delta,
    ]);

    var position = TXC.getPosition();
    TXC.setPosition([position[0] - offset[0], position[1] + offset[1]]); 

    // Refresh the panel to ensure that the slider value reflects the change
    refreshPanel();
  }

  // Sets the anchor point and stores the previous offset
  // These values will then be used to calculate the new position of the view
  const handleMouseDown = (event) => {
    if(mouseDown) return;
    setAnchor([mousePosition.x, mousePosition.y]);
    setPrevPosition([TXC.getPosition()[0], TXC.getPosition()[1]]);
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

  const handleDataViewerHide = (event) => {
    setDataViewerVisible(!dataViewerVisible);
    event.currentTarget.blur();
  }

  //////////////////
  // EFFECT HOOKS //
  //////////////////

  // INITIALIZATION

  // Initialize texture controller
  // A hook is used to ensure that the canvas element has been initialized first
  useEffect(() => {
    // If the texture controller hasn't been initialized yet, initialize
    if(!TXC.isInitialized()) {
      if(!TXC.initialize(canvasRef.current)) {
        throw new Error("Texture controller failed to initialize");
      }
      // Immediately resize to fill the available space
      TXC.handleResize();
    }

    if(!AM.isRunning()) {
      AM.setCallback((delta) => {
        TXC.render(delta)
        setFrameRate(AM.getFrameRate());
        executeHeldActions();
      });
      AM.start();
    }
    //return () => AM.stop();

    //TODO this hook runs too often... how to fix?
  });

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
    shortcuts.forEach((keyInfo, keys) => {
      if(!keyInfo.onHeld) {
        setOnPressed(keys, keyInfo.action);
      } else {
        setOnHeld(keys, keyInfo.action);
      }
    });

    // Handle zoom 
    canvasRef.current.addEventListener("wheel", handleScroll);

    // For moving the view (both mouseup and mouseout acts as mouse released)
    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mouseup", handleMouseReleased);
    canvasRef.current.addEventListener("mouseout", handleMouseReleased);

    const canvasCopy = canvasRef.current;

    // Remove all listeners on re-render
    return () => {
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
    const scale = TXC.getValue("scale");

    // The offset from the anchor point 
    var offset = TXC.screenSpaceToViewSpace([
        (anchor[0] - mousePosition.x) * scale,
        (anchor[1] - mousePosition.y) * scale
    ]);

    // The previous view position
    // This previous position is set when the mouse button is first pressed
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

  const textureControlPanel = (
    /* Settings panel */
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
      { /*
      <div className="settings__auto-hide-button-container button-container">
        <button 
          className={"button settings__auto-hide-button-container__button" + (autoHide ? " active" : "")} 
          onClick={handleAutoHide}>
            {!autoHide ? "Hide panel" : "Disable panel hiding"}
        </button>
      </div>
      */ }

      { /* Button for hiding data viewer */}
      <div className="settings__hide-data-viewer-button-container button-container">
        <button 
          className={"button settings__hide-data-viewer-button-container__button" + (!dataViewerVisible ? " active" : "")} 
          onClick={handleDataViewerHide}>
            {dataViewerVisible ? "Hide data viewer" : "Unhide data viewer"}
        </button>
      </div>
    </div> 
    /* Settings panel end */
  );

  //////////
  // BODY //
  //////////
  return (
      /* Root container */
      <div className="canvas-container">
        <PanelController
          panels={[
            {
              name: "Texture Controller",
              content: textureControlPanel
            },
            {
              name: "Color Controller"
            },


          ]}
        />

        { /* Data viewer */
          dataViewerVisible ? (
            <div className="data-tooltip">
              <DataViewer 
                frameRate={Math.round(frameRate)} 
                averageFrameRate={Math.round(AM.getAverageFrameRate())}
                dimensions={
                    Math.round(TXC.getDimensions()[0]) 
                  + "x" 
                  + Math.round(TXC.getDimensions()[1]) 
                  + " px"}
                multisampling={TXC.getValue("multisampling") ? "Enabled" : "Disabled"}
              />
            </div>
            ) : ""

        }

        { /* Canvas for WebGL context */}
        <canvas 
          className="canvas" 
          ref={canvasRef}
        />
      </div>
  )
}

export default App;
