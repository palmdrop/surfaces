import React from 'react'

import './Arrow.css'

const UpDownArrow = ( { direction }) => {
    return (
        <div className="arrow-container">
            <div className={"arrow arrow--" + direction}></div>
        </div>
    )
}

export default UpDownArrow
