import React, { useRef, useState, useEffect, useLayoutEffect, useReducer } from 'react'

import WAC from './controllers/warp/WarpAppController'

import { downloadJSON, promptDownload } from './tools/Utils'
import { useKeyboardInput } from './hooks/KeyboardInputHook'

import './App.css';
import HelpPage from './pages/HelpPage'
import ControlPanel from './components/control/ControlPanel'
import Button from './components/input/button/Button';
import DataPanel from './components/data/panel/DataPanel';

import githubIcon from './resources/icons/github.svg'
import instagramIcon from './resources/icons/instagram.svg'
import emailIcon from './resources/icons/email.svg'
import blogIcon from './resources/icons/blog.svg'
import repositoryIcon from './resources/icons/repository.png'

import defaultSettings from './resources/settings/hearts.json'

const githubLink = "https://github.com/palmdrop";
const repositoryLink = "https://github.com/palmdrop/webgl-domain-warping-controller";
const instagramLink = "https://www.instagram.com/palmdrop/"; 
const blogLink = "https://palmdrop.github.io/"; 
const emailLink = "mailto:anton@exlex.se"; 

const App = (props) => {
  ////////////////
  // REFERENCES //
  ////////////////
  const canvasRef    = useRef(); // The canvas object who holds the WebGL context
  const fileInputRef = useRef(); // The file input tag that is used to handle user file choosing

  ////////////
  // STATES //
  ////////////
  const [, refresh] = useReducer(x => x + 1, 0);

  const [, setOnPressed, setOnHeld, executeHeldActions] = useKeyboardInput(); // Custom hook for handling keyboard input

  const [paused, setPaused] = useState(false); // Pauses/unpauses the animation
  const [helpVisible, setHelpVisible] = useState(false);
  const [tooltipsVisible, setTooltipsVisible] = useState(false);

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
      };

      reader.readAsText(file);
    }
  };

  //////////////////
  // EFFECT HOOKS //
  //////////////////

  // INITIALIZATION

  // Initialize texture controller
  // A hook is used to ensure that the canvas element has been initialized first
  useEffect(() => {
    if(!WAC.isInitialized()) {
      const canvas = canvasRef.current;

      if(!WAC.initialize(canvas, null)) {
        throw new Error("Warp controlleer failed to intiialize");
      }

      refresh();
      WAC.importSettings(defaultSettings);

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

  const instagramButton = createContactButton(instagramIcon, "Instagram", instagramLink, "My instagram profile, dedicated to generative art");
  const githubButton = createContactButton(githubIcon, "Github", githubLink, "My github profile");
  const emailButton = createContactButton(emailIcon, "Email", emailLink, "My email");

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
    const createCategory = (controller, before, after, description) => {
      return {
        attributes: WAC.getAttributes(controller),
        getter: (name) => WAC.getValue(controller, name),
        setter: (name, value) => WAC.updateValue(controller, name, value),
        default: (name) => WAC.getDefault(controller, name),
        controller: controller,
        separator: ".",
        before: before,
        after: after,

        description: description
      }
    };

    return {
      texture: createCategory("TXC", null, null, "Settings for the overall texture, warp effect and animation"),
      color: createCategory("CC", null, null, "Settings for hue, saturation, brightness, color balance, and so on"),
      render: createCategory("RC", 
        dataPanel(),
        [captureButton, pauseButton, recordButton],
        "Settings for resolution, multisampling, recording, and so on"
      ),
    }
  };

  // Setup for topbar, with all buttons and other components
  const topbarComponents = {
    left: [
      helpButton,
      separator,
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
      githubButton,
      emailButton
    ]
  }

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

        { /* Canvas for WebGL context */}
        <canvas 
          className="canvas" 
          ref={canvasRef}
        />
        { 
        // Help page with contents
          <HelpPage 
            mainTitle={"Surfaces"}
            visibility={helpVisible}
            descriptions={[
              {
                title: "A Recursive Domain Warping Controller",
                content: (
                  <div>
                    <p>
                      Any image can be seen as a function of space. The input is a pixel location, an XY-coordinate, and the
                      output is a pixel color. The width and height of the image are the domain. By warping the domain, we alter
                      the space itself. Sampling a particular XY-coordinate will now (likely) result in a different output color 
                      than before. This is called domain warping.
                    </p>
                    <p>
                      This technique is commonly used for texture generation, visual effects, or generative art. This application
                      makes the technique not only accessible, but fast (using GLSL shaders) and easy to try out different configurations
                      with. 
                    </p>
                    <p>
                      To properly understand everything at work here, I suggest reading Inigo 
                      Quilez <a target="_blank" rel="noreferrer" href="https://www.iquilezles.org/www/articles/warp/warp.htm">blog post</a> on the topic, 
                      or my own <a target="_blank" rel="noreferrer" href="https://palmdrop.github.io/post/domain-warping/">blog post</a>, 
                      where I discuss the specific variant of this technique used on this page. I also suggest reading 
                      about <a target="_blank" rel="noreferrer" href="https://en.wikipedia.org/wiki/Simplex_noise">Simplex Noise</a>, which is used
                      as an underlying function of space for both the source function and the functions that alter its domain. 
                    </p>
                    <p>
                      There's a lot of settings available to you. They might be overwhelming or incomprehensible. The best way to learn what they 
                      do is to study the links from the previous paragraph, or just play around with them. If you want more information about what
                      the obscure sliders actually do, press the "Show Tooltips" button in the upper right corner. Some information about each slider 
                      or button will be displayed when you hover the mouse over it. 
                    </p>
                    <p>
                      In the top bar, there are buttons for saving a frame, for exporting or importing the current settings, among other things.
                      Feel free to post your creations anywhere you like. But do provide a link to this site if you do. Please note that this application
                      works best on modern browsers with support for WebGL2.
                    </p>
                    <p>
                      Below follows more information about the three main categories of settings that you'll find in the sidebar.
                    </p>
                  </div>
                )
              },
              {
                title: "Texture",
                content: (
                  <div>
                    <p>
                      The <i>texture controller</i> changes the characteristics of the underlying noise functions, as well as the warp effect itself. 
                      The <i>warp amount</i> controls the strength of the effect. The <i>iterations</i> is the number of times the warp is applied. The <i>source</i>
                      is the noise function whos domain is sampled. The <i>angle controller</i> controls the angle of the warp effect, across space, and the
                      <i>amount controller</i> controls the strength of the warp effect. Each layer has sliders for controlling fractal noise settings (layers of noise). 
                    </p>  
                    <p>
                      I suggest reading <a target="_blank" rel="noreferrer" href="https://palmdrop.github.io/post/characteristics-of-modified-noise/">this post</a>. 
                      It also covers some of the <i>modifications</i> available.
                    </p>
                  </div>
                )
              },
              {
                title: "Color",
                content: (
                  <div>
                    <p>
                      The <i>color controller</i> gives precise control over the colors. There are
                      some (hopefully) self-explanatory <i>general</i> sliders, but also more specific controllers for hue, saturation and brightness. Each of 
                      these sub-controllers allows you to choose which layers (source, angle, and amount) will influence that part of the color. 
                      For example, you might want the source layer to increase brightness, while the angle layer decreases it.
                    </p>
                    <p>
                      As a side effect, this might make the <i>source</i> layer have varying influence over the final color. Do not be surprised if altering
                      the <i>source</i> settings in the <i>texture</i> category does not change the results much. This is likely due to your <i>color</i> settings.
                    </p>
                  </div>
                )
              },
              {
                title: "Render",
                content: (
                  <div>
                    <p>
                      The <i>render controller</i> gives you the ability to change resolution, control dithering, and multisampling.
                      There's also an option to record the animation. Unfortunately, there's not yet support for converting the recorded
                      frames into a video. Instead, you'll receive a zipped archive of PNG images. 
                    </p>
                  </div>
                )
              },
            ]}
            shortcuts={shortcuts}
            contact={[
              {
                title: "Development",
                entries: [
                  { 
                    link: githubLink,
                    location: "Github", 
                    icon: githubIcon,
                    description: "where I store my projects and configuration files"},
                  { 
                    link: repositoryLink,
                    location: "Project Repository", 
                    icon: repositoryIcon,
                    description: "where you can find the source code for this app"
                  }
                ]
              },
              {
                title: "Social Media",
                entries: [
                  { 
                    link: instagramLink,
                    location: "Instagram", 
                    icon: instagramIcon,
                    description: "where I post generative art and experiments"},
                  { 
                    link: blogLink,
                    location: "Blog", 
                    icon: blogIcon,
                    description: "where I (occassionally) document my techniques"
                  }
                ]
              },
              {
                title: "Contact",
                entries: [
                  { 
                    link: "mailto:anton@exlex.se", 
                    location: "Email", 
                    icon: emailIcon,
                    description: "with which you can reach me if you have questions"},
                ]
              },
            ]}
            onCloseCallback={() => toggleHelp()}
          />
        }
      </div>
  )
}

export default App;
