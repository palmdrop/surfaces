import React from 'react'

import { camelToTitle, forEachProperty } from '../../tools/Utils'
import DataEntry from './DataEntry'

import './DataPanel.css'

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
