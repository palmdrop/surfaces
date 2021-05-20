
import React from 'react'

import CategoryBar from './CategoryBar'
import CategorySettings from './CategorySettings'
import { ControlPanelContextProvider } from '../../context/ControlPanelContext'

import './ControlPanel.css'

const ControlPanel = ( {categories} ) => {
    return (
        <div className="control-panel">
            <ControlPanelContextProvider>
                <CategoryBar categories={categories} />
                <CategorySettings />
            </ControlPanelContextProvider>
        </div>
    )
}

export default ControlPanel
