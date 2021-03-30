import React, { useState } from 'react'

/////////////
// STYLING //
/////////////
import './styling/App.css';

////////////////
// COMPONENTS //
////////////////
import Canvas from './components/Canvas'


const App = () => {
  return (
    <div className="App">
      <Canvas />
    </div>
  );
}

export default App;
