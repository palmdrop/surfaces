import React, { useState } from 'react';

import './PanelController.css'

const PanelController = ({ panels, children }) => {
    const [activePanel, setActivePanel] = useState(-1);

    // On navigation bar press, change the active panel index
    // Set to -1 (no panel) if the button for the currently active panel is pressed
    const handleButtonPress = (e, index) => {
        e.currentTarget.blur();
        if(index === activePanel) {
            setActivePanel(-1);
        } else {
            setActivePanel(index);
        }
    };

    return (
        <div className="panel-controller">
            <nav className="panel-controller__nav">
                {
                    // Iterate over all panels and create a corresponding button
                    panels.map((panel, index) => (
                        <div
                            className="panel-controller__nav__entry"
                            key={"p_" + index}
                        >
                            <button
                                className={"button panel-controller__nav__entry__button" + (index === activePanel ? " active" : "")}
                                onClick={(e) => {
                                    handleButtonPress(e, index);
                                    panel.onActivate && panel.onActivate();
                                }} 
                            >
                                {panel.name}
                            </button>
                        </div>
                    ))
                }
                {
                    // Iterate over all other children and add them as elements to the navigation bar
                    children && React.Children.map(children, (child, index) => (
                        <div
                            className="panel-controller__nav__child"
                            key={"i_" + index}
                        >
                            {child}
                        </div>
                    ))
                }
            </nav>
            {
                // Draw the currently activated panel, or nothing if no panel is active
                /*activePanel === -1 
                ? ""
                : <div className="panel-controller__panel">
                    {panels[activePanel].content}
                </div>
                */
                panels.map((panel, index) => (
                    <div
                        className={"panel-controller__panel" + (index === activePanel ? "" : " hidden")}
                    >
                        {panel.content}
                    </div>
                ))
            }
        </div>
    );
};

export default PanelController;
