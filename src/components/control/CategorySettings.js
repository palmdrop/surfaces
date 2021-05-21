
import React, { useState, useEffect } from 'react'
import { useControlPanelContext } from '../../context/ControlPanelContext'
import { forEachProperty, camelToTitle, isObject } from '../../tools/Utils'

import Input from '../input/Input'

import './CategorySettings.css'
import InputDropdown from './InputDropdown'

const CategorySettings = () => {
    const [activeCategory, categoryData] = useControlPanelContext();
    const [mounted, setMounted] = useState(false);
    const precision = 3;

    useEffect(() => {
        setTimeout(() => {
            setMounted(true);
        }, 0);

        return () => {
            setTimeout(() => {
                setMounted(false);
            }, 0);
        }
    }, []);

    const createMainSettings = () => {
        return (
            <div className="category-settings__main-container">
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


    return ( activeCategory ? 
            <div className={"category-settings" + (mounted ? " mounted" : "")}>
                {createMainSettings()}
                {createSecondarySettings()}
            </div>
        : null 
    )
}

export default CategorySettings
