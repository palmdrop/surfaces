
import React, { useState, useEffect } from 'react'
import { useUpdateHoverContext } from '../../../context/ControlPanelContext';

import './Button.css'

// A smart button that can be used for toggleable functionality 
// or as a regular button
const Button = ( {name, activeName, onClick, blurOnClick = true, state, radius, description, children } ) => {
    const [active, setActive] = useState(false);
    const updateHoverLocation = useUpdateHoverContext();

    useEffect(() => {
        if(state !== null) {
            setActive(state);
        }
    }, [state])

    const getClasses = (baseClass) => {
        return baseClass +
            (active ? (" " + baseClass + "--active") : "");
    };

    const handleClick = (e) => {
        if(e && blurOnClick) e.target.blur();

        if(!activeName && (typeof state === "undefined")) {
            onClick(e);
            return;
        }

        const newState = !active; 
        setActive(newState);
        onClick(e, newState);
    };

    return (
        <div 
            className={getClasses("button-container")}
            onClick={handleClick}
            onMouseOver={() => {
                updateHoverLocation && updateHoverLocation("button." + name, description)
            }}
        >
            <button 
                className={getClasses("button")}
                style={{ borderRadius: radius}}
            >
                {active ? activeName : name}
                {children}
            </button>
        </div>
    )
}

export default Button
