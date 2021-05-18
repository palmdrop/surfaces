import React from 'react'

import { useSidebarContext } from "../../context/SidebarContext"
import { forEachProperty, camelToTitle, isObject } from '../../tools/Utils'

import InputSlider from '../input/InputSlider'
import InputSwitch from '../input/InputSwitch'

import "./Sidebar.css"

const SidebarSettings = (props) => {
    const [, activeCategory, activeCategoryData] = useSidebarContext();

    const categoryName = activeCategory.name;
    const choice = activeCategory.choice;
    const precision = 5;

    if(!activeCategory.name) return null;

    // Sets up a single slider 
    const createSlider = (attribute, name, fullName) => {
        const getter = activeCategoryData.getter;
        const setter = activeCategoryData.setter;
        const defaults = activeCategoryData.default;

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
        const getter = activeCategoryData.getter;
        const setter = activeCategoryData.setter;
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

    const createInputEntry = (attribute, fullName) => {
        var name = fullName.split(activeCategoryData.separator);
        name = name[name.length - 1];

        if(attribute.min === 0.0 && attribute.max === 1.0 && ((
            attribute.step && attribute.step === 1.0) || attribute.type === "1i")) {
            return createSwitch(name, fullName);
        // Otherwise, create a slider
        } else {
            return createSlider(attribute, name, fullName);
        }
    };

    const createMainSettings = () => {
        return (
            <div className="main-settings">
                <h2 className="main-settings-title">{camelToTitle(categoryName)}</h2>
                {forEachProperty(activeCategoryData.attributes, (name, attribute, index) => {
                    return isObject(attribute.value) ? null :
                    (
                    <div key={index}
                        className="main-input-entry"
                    >
                        {createInputEntry(attribute, name )}
                    </div>
                    )
                })}
            </div>
        )
    };

    const createChosenSettings = () => {
        const separator = activeCategoryData.separator;
        const createSection = (attribute, name, parentName) => {
            return (
                <div className="chosen-section">
                    <h4 className="chosen-section-title">{camelToTitle(name)}</h4>
                    {forEachProperty(attribute, (name, child) => {
                        const fullName = parentName + separator + name;
                        if(isObject(child.value)) return (
                            <div key={fullName}>
                                {createSection(child.value, name, fullName)}
                            </div>
                        );

                        return (
                            <div className="chosen-section-entry" key={fullName}>
                                {createInputEntry(child, fullName)}
                            </div>
                        )
                    })}
                </div>
            )
        };
        
        return (
            <div className="chosen-settings">
                {createSection(activeCategoryData.attributes[choice].value, choice, choice)}
            </div>
        )
    };

    return (
        <div className="sidebar-settings">
            {categoryName ? 
                createMainSettings() : ""
            }
            {choice ?
                createChosenSettings() : ""
            }
        </div>
    )
}

export default SidebarSettings
