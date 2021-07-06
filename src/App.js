import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'

import WAC from './controllers/warp/WarpAppController'

import { downloadJSON, promptDownload } from './tools/Utils'
import { useKeyboardInput } from './hooks/KeyboardInputHook'

import './App.css';
import HelpPage from './pages/HelpPage'
import ControlPanel from './components/control/ControlPanel'
import Button from './components/input/button/Button';
import DataPanel from './components/data/panel/DataPanel';

//import defaultSettings from './resources/settings/hearts.json'

import githubIcon from './resources/icons/github.svg'
import instagramIcon from './resources/icons/instagram.svg'
import emailIcon from './resources/icons/email.svg'

const repositoryLink = "https://github.com/palmdrop/webgl-domain-warping-controller";
const instagramLink = "https://www.instagram.com/palmdrop/"; 
const emailLink = "mailto:anton@exlex.se"; 

const App = (props) => {
  ////////////////
  // REFERENCES //
  ////////////////
  const canvasRef      = useRef(); // Reference to canvas for texture generation
  const threeCanvasRef = useRef(); // Reference to canvas for 3D render mode
  const fileInputRef   = useRef(); // The file input tag that is used to handle user file choosing

  ////////////
  // STATES //
  ////////////
  const [, refresh] = useReducer(x => x + 1, 0);

  const [, setOnPressed, setOnHeld, executeHeldActions] = useKeyboardInput(); // Custom hook for handling keyboard input

  const [paused, setPaused] = useState(false); // Pauses/unpauses the animation
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipsVisible, setTooltipsVisible] = useState(false);

  const [render3D, setRender3D] = useState(false);

  ////////////////////
  // EVENT HANDLERS //
  ////////////////////

  // GENERAL

  // Pauses the animation entirely (same effect as setting the general animation speed to 0.0)
  const togglePause = (e) => {
    if(e) e.target.blur();
    WAC.setPaused(!paused);
    setPaused(!paused);
  };

  const changeAnimationSpeed = (delta) => {
    WAC.changeAnimationSpeed(delta);
  };

  const updateScale = (amount) => {
    WAC.changeScale(amount);
  }

  const randomize = (e) => {
    if(e) e.target.blur();
    WAC.randomize();
    refresh();
  }

  const handleRecording = (e, recording) => {
    if(e) e.target.blur();
    if(recording) {
      WAC.startRecording(60);
    } else {
      WAC.stopRecording();
    }
  }

  const set3D = (state) => {
    WAC.setRender3D(state);
    setRender3D(WAC.render3D);
  }

  const toggle3D = (e) => {
    set3D(!render3D);
  };


  // Displays the help modal
  const toggleHelp = (e) => {
    if(e) e.target.blur();
    const visible = !helpVisible;
    setHelpVisible(visible);

    const handleClose = (e) => {
      // If escape is pressed or the canvas is clicked, close the modal
      if((e.key && e.key === "Escape") || e.type === "click") {
        setHelpVisible(false);

        // And remove the listener
        window.removeEventListener("keydown", handleClose);
        canvasRef.current.removeEventListener("click", handleClose, true);
      }
    };

    // If visible, subscribe to click events on the canvas, and listen
    // for the escape key being pressed. Both these events should close the modal
    if(visible) {
      canvasRef.current.addEventListener("click", handleClose, true);
      window.addEventListener("keydown", handleClose);
    } 
  }

  const toggleTooltips = (e) => {
    if(e) e.target.blur();
    setTooltipsVisible(!tooltipsVisible);
  }

  // KEYBOARD INPUT
  // User input through keyboard shortcuts
  const shortcuts = [
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
      keys: 'c',
      action: (e) => {
        handleCanvasDownload(e);
      },
      onHeld: false,
      description: "Download current frame as PNG"
    },
    { 
      keys: 'n', 
      action: () => {
        handleRecording();
      },
      onHeld: false,
      description: "Start/stop recording"
    },
    { 
      keys: 'h', 
      action: () => {
        toggleHelp();
      },
      onHeld: false,
      description: "Hide/show this help popup"
    },
    {
      keys: '3',
      action: () => {
        toggle3D();
      },
      onHeld: false,
      description: "Toggle 3D mode"
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
    WAC.captureFrame((dataURL) => {
      promptDownload(dataURL, "canvas.png");
    });
  };

  // Handle settings download
  const handleSettingsDownload = (event) => {
    // Downloads the current settings of the texture controller
    downloadJSON(
      JSON.stringify(WAC.exportSettings(), null, 2), 
      "settings.json"
    );
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
        WAC.importSettings(JSON.parse(f.target.result));
        refresh();
      };

      reader.readAsText(file);
    }
  };

  //////////////////
  // EFFECT HOOKS //
  //////////////////

  // Initialize texture controller
  // A hook is used to ensure that the canvas element has been initialized first
  useEffect(() => {
    if(!WAC.isInitialized()) {
      const canvas = canvasRef.current;
      const canvas3D = threeCanvasRef.current;

      if(!WAC.initialize(canvas, canvas3D, null)) {
        throw new Error("Warp controlleer failed to initialize");
      }

      refresh();
      //WAC.importSettings(defaultSettings);

      WAC.start(() => {
        executeHeldActions();
      });
    }

    //return () => WAC.stop();
  });

  // WINDOW RESIZE

  // Handle resize events
  useLayoutEffect(() => {
    // Let the warp controller handle the resize
    const handleResize = () => {
      WAC.handleResize();
    }

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

  /////////////
  // BUTTONS //
  /////////////
  const captureButton = (
    <Button
      key={"captureButton"}
      name={"Capture Frame"}
      onClick={handleCanvasDownload}
      description={"Save a single frame as a PNG image"}
    />
  );
  
  const pauseButton = (
    <Button
      key={"pauseButton"}
      name={"Pause"}
      activeName={"Play"}
      onClick={togglePause}
      state={paused}
      description={"Pause/play the animation"}
    />
  )

  const threeDButton = (
    <Button
      key={"threeDButton"}
      name={"Enable 3D"}
      activeName={"Disable 3D"}
      onClick={toggle3D}
      state={render3D}
      description={"Toggle 3D view"}
    />
  )

  const recordButton = (
    <Button 
      key={"recordButton"}
      name={"Record"}
      activeName={"Stop recording"}
      onClick={handleRecording}
      description={"Record the animation (the recording will be a zipped archive of sequential PNG images"}
    />
  );

  const importButton = (
    <Button
      key={"importButton"}
      name={"Import"}
      onClick={handleSettingsImport}
      description={"Import a JSON file of settings"}
    >
      <input 
        ref={fileInputRef} 
        type="file" 
        style={{ display: "none" }}
        onChange={handleInputChange}
        accept="application/JSON"
      />
    </Button>
  );

  const exportButton = (
    <Button
      key={"exportButton"}
      name={"Export"}
      onClick={handleSettingsDownload}
      description={"Export a JSON file of the current settings"}
    />
  );

  const randomizeButton = (
    <Button
      key={"randomizeButton"}
      name={"Randomize"}
      onClick={randomize}
      description={"Randomize the settings"}
    />
  );

  const helpButton = (
    <Button
      key={"helpButton"}
      name={"?"}
      activeName={"?"}
      onClick={toggleHelp}
      state={helpVisible}
      radius={35}
      description={"Display a help dialog with information about the application"}
    />
  );
  
  const tooltipButton = (
    <Button
      key={"tooltipButton"}
      name="Show Tooltips"
      activeName="Hide Tooltips"
      onClick={toggleTooltips}
      description={"Toggle tooltips"}
    />
  );

  const createContactButton = (icon, alt, link, description) => {
    const handleClick = () => {
      window.open(link, "_blank");
    };

    return(<Button
        key={link}
        name={alt}
        hideName={true}
        onClick={handleClick}
        description={description}
      >
        <img className="icon-link" src={icon} alt={alt} />
      </Button>);
  };

  const instagramButton = createContactButton(instagramIcon, "Instagram", instagramLink, "Personal instagram profile, dedicated to generative art");
  const repositoryButton = createContactButton(githubIcon, "Github", repositoryLink, "The repository for this project");
  const emailButton = createContactButton(emailIcon, "Email", emailLink, "Email, the most reliable way of reaching me");

  ///////////
  // OTHER //
  ///////////
  const separator = (
    <div 
      className="separator-container"
      key={"separator"}
    >
      <span className="separator">|</span>
    </div>
  );


  //////////
  // BODY //
  //////////

  // Setup for data panel visible in the "render" category of the control panel
  const dataPanel = () => {
    const entries = {
      frameRate: {
        setterCallback: (setter) => {
          WAC.addUpdateCallback(() => {
            setter(WAC.getFrameRate());
          });
        }
      },
      avgFrameRate: {
        setterCallback: (setter) => {
          WAC.addUpdateCallback(() => {
            setter(Math.round(WAC.getAverageFrameRate()));
          });
        }
      },
      dimensions: {
        setterCallback: (setter) => {
          WAC.addResizeCallback((dimensions) => {
            setter(Math.round(dimensions[0]) + "x" + Math.round(dimensions[1]));
          });
        }
      }
    };

    return (
      <DataPanel
        entries={entries}
      />
    )
  }

  // Setup for sidebar categories, with all relevant data
  const createSidebarCategories = () => {
    const createCategory = (controller, before, after, name, description, callback) => {
      return {
        attributes: WAC.getAttributes(controller),
        getter: (name) => WAC.getValue(controller, name),
        setter: (name, value) => WAC.updateValue(controller, name, value),
        default: (name) => WAC.getDefault(controller, name),
        controller: controller,
        separator: ".",
        before: before,
        after: after,

        name: name,
        description: description,

        onClickCallback: callback
      }
    };

    return {
      texture: createCategory("TXC", null, null, "Texture", "Settings for the overall texture, warp effect and animation"),
      color: createCategory("CC", null, null, "Color", "Settings for hue, saturation, brightness, color balance, and so on"),
      render: createCategory("RC", 
        dataPanel(),
        [captureButton, pauseButton, recordButton],
        "Render",
        "Settings for resolution, multisampling, recording, and so on"
      ),
      three: createCategory("TDC", null, null, "3D", "Settings for 3D mode", (isActive) => {
        if(!isActive) set3D(true);
      })
    }
  };

  // Setup for topbar, with all buttons and other components
  const topbarComponents = {
    left: [
      helpButton,
      separator,
      threeDButton,
      captureButton,
      pauseButton, 
    ],
    center: [
      randomizeButton,
      separator,
      importButton,
      exportButton,
    ],
    right: [
      tooltipButton,
      instagramButton,
      repositoryButton,
      emailButton
    ]
  }

  const textureCanvas = (
    <canvas 
      className={"canvas" + (render3D ? " canvas--hidden" : "")}
      ref={canvasRef}
    />
  );

  const threeCanvas = (
    <canvas
      className={"canvas" + (!render3D ? " canvas--hidden" : "")}
      ref={threeCanvasRef}
    />
  );

  return (
      /* Root container */
      <div className="canvas-container">
        { !WAC.isInitialized() ? "" :

          <ControlPanel
            categories={createSidebarCategories()}
            topbar={topbarComponents}
            showTooltip={tooltipsVisible}
          />
        }

        { /* Canvas for WebGL context */ }
        { textureCanvas }
        { threeCanvas }
        { 
        // Help page with contents
          <HelpPage 
            mainTitle={"Surfaces"}
            visibility={helpVisible}
            shortcuts={shortcuts}
            onCloseCallback={() => toggleHelp()}
          />
        }
      </div>
  )
}

export default App;
