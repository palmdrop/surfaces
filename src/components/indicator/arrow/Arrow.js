import React from 'react'

import './Arrow.css'

// Simple css arrow. Can be rotated in four direction
const Arrow = ( { direction }) => {
    return (
        <div className="arrow-container">
            <div className={"arrow arrow--" + direction}></div>
        </div>
    )
}

export default Arrow
