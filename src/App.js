import React from 'react'
import { Slider } from '@material-ui/core'

/////////////
// STYLING //
/////////////
import './App.css';

////////////////
// COMPONENTS //
////////////////
import Canvas from './components/Canvas'


//const App = () => {
class App extends React.Component {
  render() {
    return (
      <div className="App">
        <Slider />
        <Canvas />
      </div>
    );
  }
}

export default App;
