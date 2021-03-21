import React from 'react'

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
        <Canvas />
      </div>
    );
  }
}

export default App;
