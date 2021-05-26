import React, { useState, useEffect } from 'react'

import './DataEntry.css'

// Displays a name and a corresponding value
// Uses a callback system which allows this component
// to be updated without the parent re-rendering
const DataEntry = ( { name, setterCallback, initial}) => {
    const [value, setValue] = useState(initial);

    useEffect(() => {
        setterCallback(setValue);
    }, [setterCallback])

    return (
        <div className="data-entry">
            <div className="data-entry__name">
                {name}:
            </div>
            <div className="data-entry__value">
                {value}
            </div>
        </div>
    )
}

export default DataEntry
