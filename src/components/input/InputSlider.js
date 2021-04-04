import React from 'react';
import { Slider, Input } from '@material-ui/core';
import './InputSlider.css';

const InputSlider = ({ label, valueGetter, onChange, min, max, step, constrain, marks }) => {
    // Handle input change from the input field
    const handleInputChange = (e) => {
        if(e.target.value !== '') {
            var value = Number(e.target.value);

            // If set to constrain the value, make sure the value stays within the min and the max
            if(constrain) {
                value = Math.min(Math.max(Number(e.target.value), min), max);
            }
            
            handleChange(value);
        }
    };

    // Only update the value if it's actually different
    // This avoids unnecessary useEffect triggers in parent classes
    const handleChange = (v) => {
        if(v !== valueGetter()) {
            onChange(v);
        }
    };

    return (
        <div className="input-slider"> 
            <h2>{label}</h2>
            <div className="input-slider__input">
                <Slider className="input-slider__input__slider"
                    value={valueGetter()}
                    onChange={(e, v) => handleChange(v)}
                    min={min}
                    max={max}
                    step={step}
                    marks={marks}
                />
                <Input className="input-slider__input_field"
                    value={valueGetter()}
                    margin="dense"
                    inputProps={{
                        type: 'number',
                        min: `${min}`,
                        max: `${max}`,
                        step: `${step}`,
                    }}
                    onChange={handleInputChange}
                />
            </div>
        </div>
    )
}

export default InputSlider