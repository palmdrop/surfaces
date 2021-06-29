import React, { useState } from 'react'

import { HexColorPicker } from 'react-colorful'

import './ColorInput.css'

const ColorInput = ({ label, initialState, callback }) => {
    const [color, setColor] = useState(initialState)

    const handleChange = (newColor) => {
        setColor(newColor);
        callback && callback(newColor);
    }

    return (
        <div className="color-input">
            <HexColorPicker color={color} onChange={handleChange} />
            <lable className="color-input__label">{label}</lable>
        </div>
    )
}

export default ColorInput
