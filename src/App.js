import { useRef, useEffect } from 'react'

/////////////
// STYLING //
/////////////
import './App.css';

////////////////
// COMPONENTS //
////////////////
import Canvas from './components/Canvas'

///////////
// WEBGL //
///////////
import GLC from './GL/GLC'

import vertexShaderSource from './GL/shaders/vertex'
import fragmentShaderSource from './GL/shaders/fragment'

const App = () => {

  return (
    <div className="App">
      <Canvas />
    </div>
  );
}

export default App;
