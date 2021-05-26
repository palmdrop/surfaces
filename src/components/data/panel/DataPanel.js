import React from 'react'

import { camelToTitle, forEachProperty } from '../../../tools/Utils'
import DataEntry from '../entry/DataEntry'

import './DataPanel.css'

// Simple panel for displaying related data
const DataPanel = ({ entries }) => {
    return (
        <div className="data-panel">
            {forEachProperty(entries, (name, value, index) => (
                <div 
                    className="data-panel__entry-container"
                    key={index}
                >
                    <DataEntry
                        name={camelToTitle(name)}
                        initial={0}
                        setterCallback={value.setterCallback}
                    />
                </div>
            ))}
        </div>
    )
}

export default DataPanel
