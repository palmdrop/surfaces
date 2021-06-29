
import React from 'react'
import { useControlPanelContext, useControlPanelUpdateContext, useUpdateHoverContext } from '../../../context/ControlPanelContext';

import { forEachProperty, camelToTitle } from '../../../tools/Utils'

import './CategoryBar.css'

// Bar for selecting category of settings
const CategoryBar = ( { categories } ) => {
    const [activeCategory, ] = useControlPanelContext();
    const [updateActiveCategory] = useControlPanelUpdateContext();
    const updateHoverLocation = useUpdateHoverContext();

    const handleClick = (e, category) => {
        if(e) e.currentTarget.blur();
        if(activeCategory === category) updateActiveCategory(null, null);
        else updateActiveCategory(category, categories[category]);
    };


    return (
        <div className="category-bar">
        {
            // Will create a button for each category 
            forEachProperty(categories, (category, data, index) => (
                <div 
                    key={category + "." + index}
                    className={"category-bar__category-container" 
                    + (category === activeCategory ? " category-bar__category-container--active" : "")}
                    onClick={(e) => handleClick(e, category)}
                    onMouseOver={() => updateHoverLocation(category, data.description)}
                >
                    <div 
                        className={"category-bar__category"
                        + (category === activeCategory ? " category-bar__category--active" : "")}
                    >
                        {data.name || camelToTitle(category)}
                    </div>
                </div>
            ))
        }
        </div>
    )
}

export default CategoryBar
