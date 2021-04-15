import React, { useEffect, useState } from 'react';
import { Slider /*, Input */ } from '@material-ui/core';
import './InputSlider.css';

const InputSlider = ({ label, valueGetter, onChange, min, max, step, constrain, marks, precision, fullName }) => {
    // Handle input change from the input field
    /*const handleInputChange = (e) => {
        if(e.target.value !== '') {
            var value = Number(e.target.value);

            // If set to constrain the value, make sure the value stays within the min and the max
            if(constrain) {
                value = Math.min(Math.max(Number(e.target.value), min), max);
            }
            
            handleChange(value);
        }
    };*/

    const round = (value) => {
        return +value.toFixed(precision || 7);
    };

    // Internal state to keep track of the value
    // This is required if the value getter method does not return a state, 
    // but some other reference that might not trigger a use effect hook
    const [state, setState] = useState(round(valueGetter()));

    // Effect for updating the state of the slider on re-render
    // This ensures that the slider will be updated if the value changes
    // externally.
    useEffect(() => {
        setState(round(valueGetter()));
    });

    // Only update the value if it's actually different
    // This avoids unnecessary useEffect triggers in parent classes
    const handleChange = (v) => {
        if(v !== valueGetter()) {
            setState(round(v));
            onChange(v);
        }
    };

    /*const handleScroll = (event) => {
        console.log(label);
        const delta = Math.sigh(event.deltaY) * step;
        handleChange(state + delta);
    };*/

    return (
        <div 
            className="input-slider"
        > 
            <h3 className="input-slider__label">{label + " (" + state + ")" }</h3>
            <div className="input-slider__input">
                <Slider className="input-slider__input__slider"
                    key={fullName}
                    value={state}
                    onChange={(e, v) => handleChange(v)}
                    min={min}
                    max={max}
                    step={step}
                    marks={marks}
                    //onScroll={handleScroll}
                />
                {/*<Input className="input-slider__input_field"
                    value={state}
                    margin="dense"
                    inputProps={{
                        type: 'number',
                        min: `${min}`,
                        max: `${max}`,
                        step: `${step}`,
                    }}
                    onChange={handleInputChange}
                />*/}
            </div>
        </div>
    )
}

export default InputSlider
