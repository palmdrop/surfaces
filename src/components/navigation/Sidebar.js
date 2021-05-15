import React from 'react'

import "./Sidebar.css"

import { forEachProperty } from "../../tools/Utils"

import SidebarCategory from "./SidebarCategory"

import { SidebarContextProvider } from "../../context/SidebarContext"
import SidebarSettings from './SidebarSettings'

const Sidebar = ({ categories, extra }) => {
    return (
        <div className="sidebar-container">
            <SidebarContextProvider>
                <nav className="sidebar-main">
                {
                    forEachProperty(categories, (name, category, index) => (
                        <SidebarCategory
                            name={name}
                            data={category}
                            key={index}
                        />
                    ))
                }

                </nav>

                { 
                    <nav className="sidebar-secondary">
                        <SidebarSettings />
                    </nav>
                }
            </SidebarContextProvider>
        </div>
    )
}

export default Sidebar
