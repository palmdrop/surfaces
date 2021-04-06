import React, { useEffect } from 'react'
import InputSlider from '../input/InputSlider'
import { camelToTitle } from '../../tools/Utils'

import './ControlPanel.css'

const ControlPanel = ({ attributes, getter, setter, separator, precision }) => {
    const createSlider = (attribute, name, fullName, index) => {
        return (<InputSlider
            key={index}
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

    const createSliders = (attribute, parentName) => {
        var sectionName = parentName.split(separator);
        sectionName = sectionName[sectionName.length - 1];

        if(typeof attribute.value === "object") {
            // Iterate over all properties
            return (
                <fieldset>
                    <legend>{camelToTitle(sectionName)}</legend>
                    {
                        Object.entries(attribute.value).map(([name, childAttribute], index) => (
                            createSliders(childAttribute, parentName + separator + name)
                        ))
                    }
                </fieldset>
            );
        } else {
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
