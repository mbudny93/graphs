import React, { useState, useRef } from 'react';
import './App.css';
import Toolbar from './components/Toolbar';
import GraphCanvas from './components/GraphCanvas';
import PropertiesPane from './components/PropertiesPane';

function App() {
  const [mode, setMode] = useState('select');
  const [selectedElement, setSelectedElement] = useState(null);
  const graphCanvasRef = useRef(null);

  const handleUpdateProperties = (type, id, updatedProperties) => {
    if (!graphCanvasRef.current) return;
    
    if (type === 'node') {
      graphCanvasRef.current.updateNodeProperties(id, updatedProperties);
    } else if (type === 'edge') {
      graphCanvasRef.current.updateEdgeProperties(id, updatedProperties);
    }
  };

  return (
    <div className="App">
      <Toolbar mode={mode} setMode={setMode} />
      <div className="main-content">
        <div className="canvas-container">
          <GraphCanvas 
            ref={graphCanvasRef}
            mode={mode} 
            setSelectedElement={setSelectedElement} 
          />
        </div>
        <div className="properties-container">
          <PropertiesPane 
            selectedElement={selectedElement} 
            onUpdateProperties={handleUpdateProperties} 
          />
        </div>
      </div>
    </div>
  );
}

export default App;
