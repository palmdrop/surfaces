import React, { useState, useEffect } from 'react'

import './DataEntry.css'

const DataEntry = ( { name, setterCallback, initial}) => {
    const [value, setValue] = useState(initial);

    useEffect(() => {
        setterCallback(setValue);
    }, [])

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
