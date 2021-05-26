
import Input from '../../../components/input/Input'
import React, { useState } from 'react'
import { camelToTitle, forEachProperty, isObject } from '../../../tools/Utils';

import './InputDropdown.css'
import Arrow from '../../indicator/arrow/Arrow';
import { useUpdateHoverContext } from '../../../context/ControlPanelContext';

// Dropdown menu containing various settings
const InputDropdown = ( { categoryData, attribute, name, parentName, precision } ) => {
    const [expanded, setExpanded] = useState(false);
    const updateHoverLocation = useUpdateHoverContext();

    const handleClick = (e) => {
        if(e) e.target.blur();
        setExpanded(!expanded);
    };

    const getClasses = (baseClass) => {
        return baseClass 
             + (expanded ? (" " + baseClass + "--expanded") : "");
    }

    // Creates a section of settings
    // If subsections exist, they will be created recursively (as another section, not another dropdown)
    const createSection = (attribute, name, parentName, root) => {
        return (
            <div 
                className={"input-dropdown__section" + (root ? "" : "-sub")}
                key={parentName} 
            >
                {!root 
                 ? <h4 
                        className="input-dropdown__section__title"
                        onMouseOver={() => updateHoverLocation(categoryData.controller + "." + parentName, attribute.description)}
                   >
                       {camelToTitle(name)}
                   </h4>
                 : ""}
                {forEachProperty(attribute.value, (name, child) => {
                    const fullName = (parentName ? (parentName + categoryData.separator) : "") + name;

                    if(isObject(child.value)) {
                        return createSection(child, name, fullName, false);
                    }

                    return (
                        <div 
                            className="input-dropdown__section__entry" 
                            key={fullName}
                            onMouseOver={() => updateHoverLocation(categoryData.controller + "." + fullName, child.description)}
                        >
                            <Input
                                categoryData={categoryData}
                                attribute={child}
                                fullName={fullName}
                                precision={precision}
                            />
                        </div>
                    )
                })}
            </div>
        );
    };

    return (
        <div className={getClasses("input-dropdown-container")}>
            <div 
                className={getClasses("input-dropdown-header")}
                onClick={handleClick}
                onMouseOver={() => updateHoverLocation(categoryData.controller + "." + name, attribute.description)}
            >
                <h3 className={getClasses("input-dropdown-title")}>
                    {camelToTitle(name)}
                </h3>
                <Arrow direction={expanded ? "up" : "down"} />
            </div>
            <div className={getClasses("input-dropdown-content")}>
                {createSection(attribute, null, parentName, true)}
            </div>
        </div>
    )
}

export default InputDropdown
