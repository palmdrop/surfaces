
import React from 'react'

import CategoryBar from './sidebar/CategoryBar'
import CategorySettings from './settings/CategorySettings'
import Topbar from './topbar/Topbar'
import Tooltip from '../data/tooltip/Tooltip'

import { ControlPanelContextProvider } from '../../context/ControlPanelContext'
import { forEachProperty } from '../../tools/Utils'

import './ControlPanel.css'

// Panel for displaying entire user interface
const ControlPanel = ( {categories, topbar, showTooltip } ) => {
    return (
        <div className="control-panel">
            {/* Top bar */}
            <ControlPanelContextProvider>
                <Topbar 
                    left={topbar.left}
                    center={topbar.center}
                    right={topbar.right}
                />
                {/* Sidebar */}
                <CategoryBar categories={categories} />
                {
                    forEachProperty(categories, (name, data, index) => (
                        /* Settings */
                        <CategorySettings
                            key={name + "." + index}
                            name={name}
                            data={data}
                        />
                    ))
                }
                { // Tooltip
                showTooltip 
                    ? <Tooltip />
                    : null
                }
            </ControlPanelContextProvider>
        </div>
    )
}

export default ControlPanel
