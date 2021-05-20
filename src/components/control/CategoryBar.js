
import React, { useState, useContext } from 'react'
import { useControlPanelContext, useControlPanelUpdateContext } from '../../context/ControlPanelContext';

import { forEachProperty, camelToTitle } from '../../tools/Utils'

import './CategoryBar.css'

const CategoryBar = ( {categories} ) => {
    const [activeCategory, ] = useControlPanelContext();
    const [updateActiveCategory,] = useControlPanelUpdateContext();

    const handleClick = (e, category) => {
        if(e) e.currentTarget.blur();
        if(activeCategory === category) updateActiveCategory(null, null);
        else updateActiveCategory(category, categories[category]);
    };

    return (
        <div className="category-bar">
        {
            forEachProperty(categories, (category, _, index) => (
                <div 
                    key={category + "." + index}
                    className={"category-bar__category-container" 
                    + (category === activeCategory ? " category-bar__category-container--active" : "")}
                    onClick={(e) => handleClick(e, category)}
                >
                    <div 
                        className={"category-bar__category"
                        + (category === activeCategory ? " category-bar__category--active" : "")}
                    >
                        {camelToTitle(category)}
                    </div>
                </div>
            ))
        }
        </div>
    )
}

export default CategoryBar
