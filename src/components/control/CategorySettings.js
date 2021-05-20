
import React from 'react'
import { useControlPanelContext } from '../../context/ControlPanelContext'
import { forEachProperty, camelToTitle, isObject } from '../../tools/Utils'

import Input from '../input/Input'

import './CategorySettings.css'
import InputDropdown from './InputDropdown'

const CategorySettings = () => {
    const [activeCategory, categoryData] = useControlPanelContext();
    const precision = 5;

    if(!activeCategory) return null;

    const createMainSettings = () => {
        return (
            <div className="category-settings__main-container">
                <h2 className="category-settings__main-title">{camelToTitle(activeCategory)}</h2>
                <div className="category-settings__main-entries">
                    {forEachProperty(categoryData.attributes, (name, attribute, index) => {
                        return isObject(attribute.value) ? null : (
                        <div key={index}
                            className="category-settings__main-entry"
                        >
                            <Input
                                categoryData={categoryData}
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
        return forEachProperty(categoryData.attributes, (name, attribute, index) => {
            if (isObject(attribute.value)) {
                return (
                    <div 
                        className="category-settings__secondary-container"
                        key={index}
                    >
                        <InputDropdown 
                            categoryData={categoryData}
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
        <div className="category-settings">
            {createMainSettings()}
            {createSecondarySettings()}
        </div>
    )
}

export default CategorySettings
