import React from 'react'

import { useSidebarContext } from "../../context/SidebarContext"
import { forEachProperty, camelToTitle, isObject } from '../../tools/Utils'

import InputSlider from '../input/InputSlider'
import InputSwitch from '../input/InputSwitch'

import "./Sidebar.css"

const SidebarSettings = (props) => {
    const [, activeCategory, activeCategoryData] = useSidebarContext();

    const categoryName = activeCategory.name;
    const precision = 5;

    if(!activeCategory.name) return null;

    // Sets up a single slider 
    const createSlider = (attribute, name, fullName, index) => {
        const getter = activeCategoryData.getter;
        const setter = activeCategoryData.setter;
        const defaults = activeCategoryData.default;

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
        const getter = activeCategoryData.getter;
        const setter = activeCategoryData.setter;
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

    const createInputEntry = (attribute, parentName, index) => {
        var sectionName = parentName.split(activeCategoryData.separator);
        sectionName = sectionName[sectionName.length - 1];

        if(attribute.min === 0.0 && attribute.max === 1.0 && ((
            attribute.step && attribute.step === 1.0) || attribute.type === "1i")) {
            return createSwitch(sectionName, parentName, index);
        // Otherwise, create a slider
        } else {
            return createSlider(attribute, sectionName, parentName, index);
        }
    };

    const createMainSettings = () => {
        return (
            <div className="main-settings">
                {forEachProperty(activeCategoryData.attributes, (name, attribute, index) => {
                    return isObject(attribute.value) ? null :
                    (
                    <div key={index}>
                        {createInputEntry(attribute, name, index)}
                    </div>
                    )
                })}
            </div>
        )
    };

    const createChosenSettings = () => {
        
        return (
            <div className="chosen-settings">
                {activeCategory.choice}
            </div>
        )
    };

    console.log(categoryName);

    return (
        <div className="sidebar-settings">
            {categoryName ? 
                createMainSettings() : ""
            }
        </div>
    )
}

export default SidebarSettings
