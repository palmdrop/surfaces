
import React, { useState, useEffect } from 'react'
import { useControlPanelContext } from '../../context/ControlPanelContext'
import { forEachProperty, camelToTitle, isObject } from '../../tools/Utils'

import Input from '../input/Input'

import './CategorySettings.css'
import InputDropdown from './InputDropdown'

const CategorySettings = ( { name, data }) => {
    const [activeCategory, ] = useControlPanelContext();
    //const [mounted, setMounted] = useState(false);
    const precision = 3;

    const createMainSettings = () => {
        return (
            <div className="category-settings__main-container">
                <div className="category-settings__main-entries">
                    {forEachProperty(data.attributes, (name, attribute, index) => {
                        return isObject(attribute.value) ? null : (
                        <div key={index}
                            className="category-settings__main-entry"
                        >
                            <Input
                                categoryData={data}
                                attribute={attribute}
                                fullName={name}
                                precision={precision}
                            />
                        </div>
                    )})}
                </div>
            </div>
        )
    };

    const createSecondarySettings = () => {
        return forEachProperty(data.attributes, (name, attribute, index) => {
            if (isObject(attribute.value)) {
                return (
                    <div 
                        className="category-settings__secondary-container"
                        key={index}
                    >
                        <InputDropdown 
                            categoryData={data}
                            attribute={attribute.value}
                            name={name}
                            parentName={name}
                            precision={precision}
                        />
                    </div>
                )
            }
        });
    };


    return (
        <div className={"category-settings" + (name === activeCategory ? " category-settings--active" : "")}>
            {data.before}
            {createMainSettings()}
            {createSecondarySettings()}
            {data.after}
        </div>
    )
}

export default CategorySettings
