import React, { useState } from 'react'

import './Collapsable.css'

const Collapsable = ({label, cname, children, state = false}) => {
    const [expanded, setExpanded] = useState(state);

    const toggleExpanded = () => {
        setExpanded(!expanded);
    }

    return (
        <fieldset className={cname + " collapsable"}>
            <legend className="collapsable__label" onClick={toggleExpanded}>{label}</legend>
            {
                expanded ? children : ""
            }
        </fieldset>
    )
}

export default Collapsable