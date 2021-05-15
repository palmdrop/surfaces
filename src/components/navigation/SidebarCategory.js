import React from 'react'

import { camelToTitle, isObject, forEachProperty } from "../../tools/Utils"
import { useSidebarContext, useSidebarUpdateContext } from "../../context/SidebarContext"

import "./Sidebar.css"

const SidebarCategory = ({name, data}) => {
    const [categoryExpanded, activeCategory] = useSidebarContext();
    const [updateCategoryExpanded, updateActiveCategory] = useSidebarUpdateContext();

    const active = activeCategory.name === name;
    const expanded = categoryExpanded[name];
    const choice = active && activeCategory.choice;

    const getClasses = (baseClass) => {
        return baseClass 
             + (expanded ? (" " + baseClass + "--expanded") : "")
             + (active   ? (" " + baseClass + "--active") : "");
    }

    const handleTitleClick = (e) => {
        if(e) e.currentTarget.blur();
        if(active) {
            updateCategoryExpanded(name, "toggle");
        } else {
            updateCategoryExpanded(name, "expand");
        }

        updateActiveCategory(name, choice ? choice : null, data);
    };

    const handleArrowClick = (e) => {
        if(e) e.currentTarget.blur();
        updateCategoryExpanded(name, "toggle");
    }

    const handleEntryClick = (e, entryName) => {
        if(e) e.currentTarget.blur();
        updateActiveCategory(name, entryName, data);
    }

    const createEntries = () => {
        return forEachProperty(data.attributes, (name, attribute, index) => {
            if (isObject(attribute.value)) {
                return (
                    <h4 
                        className={"entry" + (choice === name ? " entry--picked" : "")}
                        key={index}
                        onClick={(e) => handleEntryClick(e, name)}
                    >
                        {camelToTitle(name)
                        .split(" ")
                        .map((word, index) => (
                            <div key={index}>
                                {word}
                            </div>
                        ))}
                    </h4>
                )
            }
        });
    };

    return (
        <div 
            className={getClasses("sidebar-category")}
        >
            <div className={getClasses("category-header")}>
                <h2 
                    className={getClasses("category-title")}
                    onClick={handleTitleClick}
                >
                    {camelToTitle(name)}
                </h2>
                <div 
                    className="category-arrow-container"
                    onClick={handleArrowClick}
                >
                    <div 
                        className={"category-arrow" + (expanded ? " category-arrow--expanded" : "")} 
                    />
                </div>
            </div>
            <div
                className={getClasses("category-entries")}
                //onClick={handleCategoryClick}
            >
            {
                createEntries()
                //expanded && createEntries()
            }
            </div>
        </div>
    )
}

export default SidebarCategory
