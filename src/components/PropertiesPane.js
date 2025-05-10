import React, { useState, useEffect } from 'react';
import './PropertiesPane.css';

const PropertiesPane = ({ selectedElement, onUpdateProperties }) => {
  const [properties, setProperties] = useState({});
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (selectedElement && selectedElement.data) {
      setProperties(selectedElement.data.properties || {});
    } else {
      setProperties({});
    }
  }, [selectedElement]);

  const handlePropertyChange = (key, value) => {
    const updatedProperties = { ...properties, [key]: value };
    setProperties(updatedProperties);
    
    if (selectedElement && onUpdateProperties) {
      onUpdateProperties(selectedElement.type, selectedElement.data.id, updatedProperties);
    }
  };

  const handleAddProperty = () => {
    if (newKey.trim() !== '') {
      handlePropertyChange(newKey, newValue);
      setNewKey('');
      setNewValue('');
    }
  };

  const renderProperties = () => {
    return Object.entries(properties).map(([key, value]) => (
      <div className="property-item" key={key}>
        <label>{key}:</label>
        <input
          type="text"
          value={value}
          onChange={(e) => handlePropertyChange(key, e.target.value)}
        />
      </div>
    ));
  };

  const renderAddProperty = () => {
    return (
      <div className="add-property">
        <input
          type="text"
          placeholder="Property name"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          type="text"
          placeholder="Property value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button onClick={handleAddProperty}>Add</button>
      </div>
    );
  };

  if (!selectedElement) {
    return (
      <div className="properties-pane">
        <h3>Properties</h3>
        <p className="no-selection">No element selected</p>
      </div>
    );
  }

  return (
    <div className="properties-pane">
      <h3>Properties: {selectedElement.type === 'node' ? 'Node' : 'Edge'}</h3>
      <div className="properties-list">
        {renderProperties()}
        {renderAddProperty()}
      </div>
    </div>
  );
};

export default PropertiesPane;
