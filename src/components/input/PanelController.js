import React, { useRef, useEffect, useState } from 'react';

import './PanelController.css'

const PanelController = ({ panels }) => {
    const [activePanel, setActivePanel] = useState(-1);

    const handleButtonPress = (e, index) => {
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
                    panels.map((panel, index) => (
                        <div
                            className="panel-controller__nav__entry"
                        >
                            <button
                                className={"button panel-controller__nav__entry__button" + (index === activePanel ? " active" : "")}
                                key={index}
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
            </nav>
            {
                activePanel === -1 
                ? ""
                : <div className="panel-controller__panel">
                    {panels[activePanel].content}
                </div>
            }
        </div>
    );
};

export default PanelController;
