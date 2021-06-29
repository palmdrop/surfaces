import React, { useState, useEffect } from 'react'

import { HexColorPicker } from 'react-colorful'

import './InputColor.css'

const InputColor = ({ label, valueGetter, onChange, fullName }) => {
    // Internal color state
    // Required to ensure component update on change
    const [color, setColor] = useState(valueGetter());

    // Effect that ensures the state is updated on re-render
    useEffect(() => {
        setColor(valueGetter());
    }, [valueGetter]);

    // Only update if the color has actually changed
    const handleChange = (newColor) => {
        if(newColor !== valueGetter()) {
            setColor(newColor);
            onChange(newColor);
        }
    };

    return (
        <div className="input-color">
            <label className="input-color__label">{label}</label>
            <HexColorPicker 
                className="input-color__color-picker"
                key={fullName}
                color={color} 
                onChange={handleChange} 
            />
        </div>
    )
}

export default InputColor;
