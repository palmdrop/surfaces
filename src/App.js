
import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'
import ControlPanel from './components/input/ControlPanel'

import WAC from './context/warp/WarpAppController'

import { downloadJSON, promptDownload } from './tools/Utils'
import { useKeyboardInput } from './hooks/KeyboardInputHook'

import './App.css';
import DataViewer from './components/tooltip/DataViewer'
import PanelController from './components/input/PanelController'

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
  const [, setOnPressed, setOnHeld, executeHeldActions] = useKeyboardInput(); // Custom hook for handling keyboard input

  const [paused, setPaused] = useState(false); // Pauses/unpauses the animation
  const [recording, setRecording] = useState(false); // True if recording
  const [frameRate, setFrameRate] = useState(0);

  const [dataViewerVisible, setDataViewerVisible] = useState(true); // If true, a popup with render information will be displayed
  // A reducer used to force update the panel (required when the settings are changed outside the panel)
  const [, refreshPanel] = useReducer(x => x + 1, 0);

  ////////////////////
  // EVENT HANDLERS //
  ////////////////////

  // GENERAL

  // Pauses the animation entirely (same effect as setting the general animation speed to 0.0)
  const togglePause = (e) => {
    if(e) e.currentTarget.blur();
    WAC.togglePause();
    setPaused(WAC.isPaused());
  };

  const changeAnimationSpeed = (delta) => {
    WAC.changeAnimationSpeed(delta);
  };

  const updateScale = (amount) => {
    WAC.changeScale(amount);
  }

  const randomize = (e) => {
    if(e) e.currentTarget.blur();
    WAC.randomize();
  }

  const handleRecording = (e) => {
    if(e) e.currentTarget.blur();
    if(recording) {
      WAC.stopRecording();
      setRecording(false);
    } else {
      WAC.startRecording(60);
      setRecording(true);
    }
  }

  // KEYBOARD INPUT

  // User input through keyboard shortcuts
  // TODO then use these description for tooltip

  // TODO create better interface for changing values using functions
  // TODO ability to change values using keyboard and having it reflect in panel automatically
  const shortcuts = [
    {
      keys: 'c',
      action: (e) => {
        handleCanvasDownload(e);
      },
      onHeld: false,
      description: "Download current frame as PNG"
    },
    {
      keys: ' ', 
      action: (e) => {
        togglePause();
      },
      onHeld: false,
      description: "Toggle pause"
    },
    {
      keys: '-',
      action: (e) => {
        changeAnimationSpeed(-0.05);
      },
      onHeld: true,
      description: "Decrease animation speed"
    },
    { 
      keys: '+', 
      action: (e) => {
        changeAnimationSpeed(0.05);
      },
      onHeld: true,
      description: "Increase animation speed"
    },
    { 
      keys: 'q', 
      action: (e) => {
        updateScale(0.02);
      },
      onHeld: true,
      description: "Zoom out"
    },
    { 
      keys: 'e', 
      action: (e) => {
        updateScale(-0.02);
      },
      onHeld: true,
      description: "Zoom in"
    },
    { 
      keys: ['ArrowLeft', 'a'], 
      action: () => {
        handleMovement([-10, 0]);
      },
      onHeld: true,
      description: "Move left"
    },
    { 
      keys: ['ArrowRight', 'd'], 
      action: () => {
        handleMovement([10, 0]);
      },
      onHeld: true,
      description: "Move right"
    },
    { 
      keys: ['ArrowUp', 'w'], 
      action: () => {
        handleMovement([0, 10]);
      },
      onHeld: true,
      description: "Move upwards"
    },
    { 
      keys: ['ArrowDown', 's'], 
      action: () => {
        handleMovement([0, -10]);
      },
      onHeld: true,
      description: "Move downwards"
    },
    { 
      keys: 'r', 
      action: () => {
        randomize();
      },
      onHeld: false,
      description: "Randomize controller parameters"
    },
    { 
      keys: 'n', 
      action: () => {
        handleRecording();
      },
      onHeld: false,
      description: "Start/stop recording"
    }
  ];

  const handleMovement = (offset) => {
    WAC.move(offset);
  }

  // MOUSE INPUT

  // Zoom the view on user scroll (same effect as in changing the "scale" slider)
  const handleScroll = (event) => {
    WAC.changeScale(Math.sign(event.deltaY) * 0.1, [event.clientX, event.clientY]);
  }

  // Sets the anchor point and stores the previous offset
  // These values will then be used to calculate the new position of the view
  const handleMouseDown = (event) => {
    WAC.setAnchor([event.clientX, event.clientY]);
  }

  // Register when the mouse is released
  // This will be triggered if the mouse button is let go, or if the
  // mouse leaves the canvas area
  const handleMouseReleased = (event) => {
    WAC.liftAnchor();
  }

  // Will be called if the mouse is moved
  // Handles anchor movement (action will only be performed if the anchor position is set)
  const handleMouseMoved = (event) => {
    WAC.anchorMove([event.clientX, event.clientY]);
  }

  // IMPORT/EXPORT

  // Handle canvas download 
  const handleCanvasDownload = (event) => {
    // Capture the next frame and prompt a download using a callback function
    // This is required since the canvas has to be captured after the render
    // Otherwise, the resulting image will be blank
    //CC.captureFrame((dataURL) => {
    WAC.captureFrame((dataURL) => {
      promptDownload(dataURL, "canvas.png");
    });
  };

  // Handle settings download
  const handleSettingsDownload = (event) => {
    // Downloads the current settings of the texture controller
    //downloadJSON(TXC.exportSettings(), "settings.json");
    downloadJSON(WAC.exportSettings(), "settings.json");
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
        //TXC.importSettings(f.target.result);
        WAC.importSettings(f.target.result);
      };

      reader.readAsText(file);
    }
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
    if(!WAC.isInitialized()) {
      const canvas = canvasRef.current;

      if(!WAC.initialize(canvas, () => refreshPanel())) {
        throw new Error("Warp controlleer failed to intiialize");
      }

      WAC.start((delta) => {
        executeHeldActions();
        setFrameRate(WAC.getFrameRate());
      });
    }

    

    //return () => AM.stop();
    //TODO this hook runs too often... how to fix?
  });

  // WINDOW RESIZE

  // Handle resize events
  useLayoutEffect(() => {
    // Let the warp controller handle the resize
    const handleResize = () => WAC.handleResize();

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  });

  // INPUT LISTENERS

  // Register all global listeners
  useEffect(() => {
    // Handle keyboard shortcuts
    shortcuts.forEach((keyInfo) => {
      if(!keyInfo.onHeld) {
        setOnPressed(keyInfo.keys, keyInfo.action);
      } else {
        setOnHeld(keyInfo.keys, keyInfo.action);
      }
    });

    // Handle zoom 
    canvasRef.current.addEventListener("wheel", handleScroll);

    // For moving the view (both mouseup and mouseout acts as mouse released)
    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    canvasRef.current.addEventListener("mouseup", handleMouseReleased);
    canvasRef.current.addEventListener("mouseout", handleMouseReleased);
    canvasRef.current.addEventListener("mousemove", handleMouseMoved);

    const canvasCopy = canvasRef.current;

    // Remove all listeners on re-render
    return () => {
      canvasCopy.removeEventListener("wheel", handleScroll);
      canvasCopy.removeEventListener("mousedown", handleMouseDown);
      canvasCopy.removeEventListener("mouseup", handleMouseReleased);
      canvasCopy.removeEventListener("mouseout", handleMouseReleased);
      canvasCopy.removeEventListener("mousemove", handleMouseMoved);
    };
  });

  // CONTROL PANELS
  const textureControlPanel = (
    !WAC.isInitialized() ? "" : // Only form if the warp controller is initialized

    /* Settings panel */
    <div 
      className={"settings"}
      ref={settingsRef}
    > 
      { /* General control panel */}
      <ControlPanel 
        attributes={WAC.getAttributes("TXC")}
        getter={(name) => WAC.getValue("TXC", name)}
        setter={(name, value) => WAC.updateValue("TXC", name, value)}
        defaults={(name) => WAC.getDefault("TXC", name)}
        separator={"."}
      />
    </div> 
  );

  const colorControlPanel = (
    !WAC.isInitialized() ? "" : // Only form if the warp controller is initialized

    <div 
      className={"settings"}
    > 
      { /* General control panel */}
      <ControlPanel 
        attributes={WAC.getAttributes("CC")}
        getter={(name) => WAC.getValue("CC", name)}
        setter={(name, value) => WAC.updateValue("CC", name, value)}
        defaults={(name) => WAC.getDefault("CC", name)}
        separator={"."}
      />
    </div>
  );

  const renderControlPanel = (
    !WAC.isInitialized() ? "" :
    <div
      className={"settings"}
    >
      { /* General control panel */}
      <ControlPanel 
        attributes={WAC.getAttributes("RC")}
        getter={(name) => WAC.getValue("RC", name)}
        setter={(name, value) => WAC.updateValue("RC", name, value)}
        defaults={(name) => WAC.getDefault("RC", name)}
        separator={"."}
      />

      <div className="settings__record-button-container button-container">
        <button 
          className={"button settings__record-button-container__button" + (recording ? " active" : "")} 
          onClick={handleRecording}>
            {!recording ? "Record" : "Stop recording"}
        </button>
      </div>
    </div>
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
              name: "Texture",
              content: textureControlPanel
            },
            {
              name: "Color",
              content: colorControlPanel
            },
            {
              name: "Render",
              content: renderControlPanel
            }
          ]}
        >
          { /* Button for hiding data viewer */}
          <div className="settings__hide-data-viewer-button-container button-container">
            <button 
              className={"button settings__hide-data-viewer-button-container__button" + (!dataViewerVisible ? " active" : "")} 
              onClick={handleDataViewerHide}>
                {dataViewerVisible ? "Hide data viewer" : "Unhide data viewer"}
            </button>
          </div>

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

          { /* Button for randomizing settings */}
          <div className="settings__randomize-button-container button-container">
            <button 
              className={"button settings__randomize-button-container__button"} 
              onClick={randomize}>
                Randomize
            </button>
          </div>
        </PanelController>


        { /* Data viewer */
          dataViewerVisible ? (
            <div className="data-tooltip">
              <DataViewer 
                frameRate={Math.round(frameRate)} 
                averageFrameRate={Math.round(WAC.getAverageFrameRate())}
                dimensions={
                    Math.round(WAC.getDimensions()[0])
                  + "x" 
                  + Math.round(WAC.getDimensions()[1])
                  + " px"}
                multisampling={WAC.getValue("RC", "multisampling") ? "Enabled" : "Disabled"}
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
