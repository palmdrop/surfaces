
import Input from '../../components/input/Input'
import React, { useState } from 'react'
import { camelToTitle, forEachProperty, isObject } from '../../tools/Utils';

import './InputDropdown.css'
import UpDownArrow from '../indicator/arrow/UpDownArrow';

const InputDropdown = ( { categoryData, attribute, name, parentName, precision } ) => {
    const [expanded, setExpanded] = useState(false);

    const handleClick = (e) => {
        if(e) e.currentTarget.blur();
        setExpanded(!expanded);
    };

    const getClasses = (baseClass) => {
        return baseClass 
             + (expanded ? (" " + baseClass + "--expanded") : "");
    }

    const createSection = ( attribute, name, parentName, root ) => {
        return (
            <div className={"input-dropdown__section" + (root ? "" : "-sub")}>
                {!root 
                 ? <h4 className="input-dropdown__section__title">{camelToTitle(name)}</h4>
                 : ""}
                {forEachProperty(attribute, (name, child) => {
                    const fullName = (parentName ? (parentName + categoryData.separator) : "") + name;

                    if(isObject(child.value)) {
                        return (
                            <div>
                                {createSection(child.value, name, fullName, false)}
                            </div>
                        )
                    }

                    return (
                        <div 
                            className="input-dropdown__section__entry" 
                            key={fullName}
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
            >
                <h3 className={getClasses("input-dropdown-title")}>
                    {camelToTitle(name)}
                </h3>
                <UpDownArrow direction={expanded ? "up" : "down"} />
            </div>
            <div className={getClasses("input-dropdown-content")}>
                {createSection( attribute, null, parentName, true)}
            </div>
        </div>
    )
}

export default InputDropdown
