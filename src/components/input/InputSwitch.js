import React, { useRef, useEffect, useState } from 'react';
import { Switch } from '@material-ui/core';
import './InputSwitch.css';

const InputSlider = ({ label, valueGetter, onChange, fullName }) => {
    const ref = useRef();

    // Internal state to keep track of the value
    // This is required if the value getter method does not return a state, 
    // but some other reference that might not trigger a use effect hook
    const [state, setState] = useState(valueGetter());

    // Effect for updating the state of the switch on re-render
    // This ensures that the switch will be updated if the value changes
    // externally.
    useEffect(() => {
        setState(valueGetter());
    }, [valueGetter]);

    // Only update the value if it's actually different
    // This avoids unnecessary useEffect triggers in parent classes
    const handleChange = (e) => {
        if(!e.target) return;
        const v = e.target.checked;
        if(v !== valueGetter()) {
            setState(v);
            onChange(v);
            e.target.blur();
        }
    };

    return (
        <div 
            className="input-switch"
            ref={ref}
        > 
            <h3 className="input-switch__label">{label}</h3>
            <Switch className="input-switch__switch"
                key={fullName}
                name={fullName}
                checked={state ? true : false}
                onChange={handleChange}
                size="small"
            />
        </div>
    )
}

export default InputSlider
