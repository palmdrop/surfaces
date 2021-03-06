import React, { useState, useEffect } from 'react'
import { useSetHoverCallbackContext } from '../../../context/ControlPanelContext'
import { camelToTitle } from '../../../tools/Utils'

import './Tooltip.css'

// A small dialog displaying information
// Is updated based on mouse hover location
const Tooltip = () => {
    const setHoverCallback = useSetHoverCallbackContext();
    const [hoverLocation, setHoverLocation] = useState(null);
    const [description, setDescription] = useState(null);

    useEffect(() => {
        // Callback used to update tooltip
        setHoverCallback(
            (location, description) => {
                setHoverLocation(location);  // Title
                setDescription(description); // Content
            }
        );
    });

    // If no hover location, render nothing
    if(!hoverLocation) return null;

    // Format title
    const createTitle = (hoverLocation) => {
        const lastIndex = hoverLocation.lastIndexOf('.');
        if(lastIndex === -1) return camelToTitle(hoverLocation);
        return camelToTitle(hoverLocation.substr(lastIndex + 1));
    };

    return (
        
        <div className="tooltip-container">
            <h3 className="tooltip__title">{createTitle(hoverLocation)}</h3>
            <div className="tooltip__content">
                {description}
            </div>
        </div>
    )
}

export default Tooltip
