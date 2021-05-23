
import React, { useState, useEffect } from 'react'

import './Button.css'

const Button = ( {name, activeName, onClick, blurOnClick = true, state, radius, children } ) => {
    const [active, setActive] = useState(false);

    useEffect(() => {
        if(typeof state !== "undefined") {
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
        >
            <button 
                className={getClasses("button")}
                style={{ "border-radius": radius}}
            >
                {active ? activeName : name}
                {children}
            </button>
        </div>
    )
}

export default Button
