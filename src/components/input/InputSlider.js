import React, { useRef, useEffect, useState } from 'react';
import { Slider } from '@material-ui/core';
import './InputSlider.css';

const InputSlider = ({ label, valueGetter, defaultValue, onChange, min, max, step, marks, precision, fullName }) => {
    const ref = useRef();

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

    // Updates the value of the slider on user scroll
    const handleScroll = (event) => {
        // Prevent the page from scrolling
        event.preventDefault();

        // Calculate the value change
        const delta = -Math.sign(event.deltaY) * step;
        var v = valueGetter() + delta;

        // Constrain the value 
        v = Math.min(Math.max(v, min), max);

        // And make sure the value lands on possible marks
        if(marks) {
            v = marks.reduce((a, b) => {
                return Math.abs(b - v) < Math.abs(a - v) ? b : a;
            });
        }

        handleChange(v);
    };

    // Resets the slider value to the default
    const handleDoubleClick = (event) => {
        handleChange(defaultValue);
    };

    // Registers listener for scroll events
    useEffect(() => {
        const refCopy = ref.current;

        refCopy.addEventListener("wheel", handleScroll);
        refCopy.addEventListener("dblclick", handleDoubleClick);

        return () => {
            refCopy.removeEventListener("wheel", handleScroll);
            refCopy.removeEventListener("dblclick", handleDoubleClick);
        };
    });

    return (
        <div 
            className="input-slider"
        > 
            <h3 className="input-slider__label">{label + " (" + state + ")" }</h3>
            <Slider className="input-slider__slider"
                key={fullName}
                value={state}
                onChange={(e, v) => handleChange(v)}
                min={min}
                max={max}
                step={step}
                marks={marks}
                ref={ref}
            />
        </div>
    )
}

export default InputSlider
