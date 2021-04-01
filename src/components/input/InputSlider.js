import React from 'react';
import { Slider, Input } from '@material-ui/core';
import './InputSlider.css';

const InputSlider = ({ label, valueGetter, onChange, min, max, step, constrain }) => {
    const handleInputChange = (e) => {
        if(e.target.value !== '') {
            var value = Number(e.target.value);
            if(constrain) {
                value = Math.min(Math.max(Number(e.target.value), min), max);
            }
            onChange(value);
        }
    };

    return (
        <div className="input-slider"> 
            <h2>{label}</h2>
            <div className="input-slider__input">
                <Slider className="input-slider__input__slider"
                    value={valueGetter()}
                    onChange={(e, v) => onChange(v)}
                    min={min}
                    max={max}
                    step={step}
                />
                <Input className="input-slider__input_field"
                    value={valueGetter()}
                    margin="dense"
                    inputProps={{
                        type: 'number',
                        min: `${min}`,
                        max: `${max}`,
                    }}
                    onChange={handleInputChange}
                    styles={{
                    }}
                />
            </div>
        </div>
    )
}

export default InputSlider
