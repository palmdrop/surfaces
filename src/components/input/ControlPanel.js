import React from 'react'

import InputSlider from '../input/InputSlider'
import InputSwitch from '../input/InputSwitch'
import Collapsable from '../sections/Collapsable'

import { camelToTitle } from '../../tools/Utils'

import './ControlPanel.css'

const ControlPanel = ({ attributes, getter, setter, defaults, separator, precision }) => {
    // Sets up a single slider 
    const createSlider = (attribute, name, fullName, index) => {
        return (<InputSlider
            //key={fullName}
            key={index}
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
    const createSwitch = (name, fullName, index) => {
        return (
            <InputSwitch 
                key={index}
                label={camelToTitle(name)} 
                valueGetter={() => getter(fullName)}
                onChange={(v) => setter(fullName, v)}
                fullName={fullName}
            />
        )
    };

    // Sets up all input sliders/switches
    const createInputs = (attribute, parentName, index) => {
        // Finds the name of the current section 
        var sectionName = parentName.split(separator);
        sectionName = sectionName[sectionName.length - 1];

        // If the value property is an object, then the attribute contains
        // sub attributes
        if(typeof attribute.value === "object") {
            // Iterate over all sub attributes
            return (
                // Create a collapsable component, to make sure the user can hide/unhide these sections
                <Collapsable label={camelToTitle(sectionName)} cname="control-panel__section" key={index}>
                {
                    Object.entries(attribute.value).map(([name, childAttribute], subindex) => (
                        createInputs(childAttribute, parentName + separator + name, index + "." + subindex)
                    ))
                }
                </Collapsable>
            );
        } else {
            // If the value is not an object, create a slider or switch

            // If the attribute is of integer type and only allows values of 0.0 or 1.0, 
            // then create a simple switch for easy toggle
            if(attribute.min === 0.0 && attribute.max === 1.0 && ((
               attribute.step && attribute.step === 1.0) || attribute.type === "1i")) {
                return createSwitch(sectionName, parentName, index);
            // Otherwise, create a slider
            } else {
                return createSlider(attribute, sectionName, parentName, index);
            }
        }
    };

    return (
        <div className="control-panel">
        {
            //TODO find way to produce unique keys
            Object.entries(attributes).map(([name, attribute], index) => (
                createInputs(attribute, name, index)
            ))
        }
        </div>
    )
}

export default ControlPanel
