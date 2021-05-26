import React from 'react'

import './Topbar.css'

// Simple top bar, places children to the left, center or the right
const Topbar = ({ left, center, right }) => {
    return (
        <nav className="topbar">
            <nav className="left-container">
                {left}
            </nav>
            <nav className="center-container">
                {center}
            </nav>
            <nav className="right-container">
                {right}
            </nav>
        </nav>
    )
}

export default Topbar
