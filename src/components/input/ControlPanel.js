import React, { useState, useRef } from 'react'

import InputSlider from '../input/InputSlider'
import Collapsable from '../sections/Collapsable'

import { camelToTitle } from '../../tools/Utils'

import './ControlPanel.css'

const ControlPanel = ({ attributes, getter, setter, separator, precision }) => {
    // Sets up a single slider 
    const createSlider = (attribute, name, fullName, index) => {
        return (<InputSlider
            key={fullName}
            label={camelToTitle(name)}
            valueGetter={() => getter(fullName)}
            onChange={(v) => setter(fullName, v)}
            min={attribute.min}
            max={attribute.max}
            step={
                // If the attribute has a step property, use that
                attribute.hasOwnProperty("step") ? attribute.step :
                // Otherwise, check if the attribute is of integer type
                // If yes, set step to "1", otherwise calculate a small step based on 
                // the min and max values
                (attribute.type === "1i" ? 1 : (attribute.max - attribute.min) / 1000)
            }
            marks={attribute.marks}
            constrain={true}
            precision={precision}
        />)
    };

    // Sets up all sliders
    const createSliders = (attribute, parentName) => {
        // Finds the name of the current section 
        var sectionName = parentName.split(separator);
        sectionName = sectionName[sectionName.length - 1];

        // If the value property is an object, then the attribute contains
        // sub attributes
        if(typeof attribute.value === "object") {
            // Iterate over all sub attributes
            return (
                // Create a collapsable component, to make sure the user can hide/unhide these sections
                <Collapsable label={camelToTitle(sectionName)} cname="control-panel__section" key={parentName}>
                {
                    Object.entries(attribute.value).map(([name, childAttribute], index) => (
                        createSliders(childAttribute, parentName + separator + name)
                    ))
                }
                </Collapsable>
            );
        } else {
            // If the value is not an object, simply create a single slider
            return createSlider(attribute, sectionName, parentName, 0);
        }
    };

    return (
        <div className="control-panel">
        {
            //TODO find way to produce unique keys
            Object.entries(attributes).map(([name, attribute], index) => (
                createSliders(attribute, name)
            ))
        }
        </div>
    )
}

export default ControlPanel
