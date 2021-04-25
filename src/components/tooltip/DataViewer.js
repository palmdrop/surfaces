import React from 'react';
import { camelToTitle } from '../../tools/Utils'

import './DataViewer.css'

// Renders the props as an information popup
// The name of each prop becomes the title
const DataViewer = (props) => {
    return (
        <div className="viewer">
            { // Iterate over all properties
            Object.entries(props).map(([key, value], index) => (
               <div
                    className="viewer__entry"
                    key={index}
               >
                   {camelToTitle(key) + ": " + value}
               </div>
            ))}
        </div>
    );
  }
  
export default DataViewer;