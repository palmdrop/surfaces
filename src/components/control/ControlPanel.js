
import React from 'react'

import CategoryBar from './CategoryBar'
import CategorySettings from './CategorySettings'
import { ControlPanelContextProvider } from '../../context/ControlPanelContext'

import './ControlPanel.css'
import { forEachProperty } from '../../tools/Utils'
import Topbar from './Topbar'
import Tooltip from '../tooltip/Tooltip'

const ControlPanel = ( {categories, topbar, showTooltip } ) => {
    return (
        <div className="control-panel">
            <ControlPanelContextProvider>
                <Topbar 
                    left={topbar.left}
                    center={topbar.center}
                    right={topbar.right}
                />
                <CategoryBar categories={categories} />
                {
                    forEachProperty(categories, (name, data, index) => (
                        <CategorySettings
                            key={name + "." + index}
                            name={name}
                            data={data}
                        />
                    ))
                }
                {showTooltip 
                ? <Tooltip />
                : null
                }
            </ControlPanelContextProvider>
        </div>
    )
}

export default ControlPanel
