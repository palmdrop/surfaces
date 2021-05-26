import React, { useEffect, useState } from 'react'

import InputSlider from './slider/InputSlider'
import InputSwitch from './switch/InputSwitch'
import { camelToTitle } from '../../tools/Utils'

import './Input.css'
import WAC from '../../controllers/warp/WarpAppController'

// Takes input data from the user
// At this point, this is either in the form of a slider or a switch
const Input = ({ categoryData, attribute, fullName, precision }) => {
    const [refresh, forceRefresh] = useState(false);

    // Effect for setting an update callback
    // This enables us to update ONLY This input component when 
    // the corresponding attribute of the warp controller changes, 
    // instead of re-rendering the entire control panel
    useEffect(() => {
        WAC.setUpdateCallback(categoryData.controller, fullName, () => {
            forceRefresh(!refresh);
        });
    }, [refresh, categoryData.controller, fullName])


    const getter = categoryData.getter;
    const setter = categoryData.setter;
    const defaults = categoryData.default;

    // Sets up a single slider 
    const createSlider = (attribute, name, fullName) => {
        return (<InputSlider
            key={fullName}
            label={camelToTitle(name)}
            valueGetter={() => getter(fullName)}
            defaultValue={defaults(fullName)}
            onChange={(v) => setter(fullName, v)}
            min={attribute.min}
            max={attribute.max}
            step={
                // If the attribute has a step property, use that
                attribute.hasOwnProperty("step") ? attribute.step :
                // Otherwise, check if the attribute is of integer type
                // If yes, set step to "1", otherwise calculate a small step based on 
                // the min and max values
                (attribute.type === "1i" ? 1 : (attribute.max - attribute.min) / 100)
            }
            marks={attribute.marks}
            precision={precision}
            fullName={fullName}
        />)
    };

    // Sets up a single switch
    const createSwitch = (name, fullName) => {
        return (
            <InputSwitch 
                key={fullName}
                label={camelToTitle(name)} 
                valueGetter={() => getter(fullName)}
                onChange={(v) => setter(fullName, v)}
                fullName={fullName}
            />
        )
    };

    const createInputEntry = () => {
        var name = fullName.split(categoryData.separator);
        name = name[name.length - 1];

        if(attribute.min === 0.0 && attribute.max === 1.0 && ((
            attribute.step && attribute.step === 1.0) || attribute.type === "1i")) {
            return createSwitch(name, fullName);
        // Otherwise, create a slider
        } else {
            return createSlider(attribute, name, fullName);
        }
    };


    return (
        <div className="input-container">
            {createInputEntry()}
        </div>
    )
}

export default Input
