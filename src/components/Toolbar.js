import React from 'react';
import './Toolbar.css';

const Toolbar = ({ mode, setMode }) => {
  const modes = [
    { id: 'add', label: 'Add Node', icon: '➕' },
    { id: 'select', label: 'Select', icon: '👆' },
    { id: 'connect', label: 'Connect', icon: '↔️' },
    { id: 'delete', label: 'Delete', icon: '🗑️' }
  ];

  return (
    <div className="toolbar">
      {modes.map((item) => (
        <button
          key={item.id}
          className={`toolbar-button ${mode === item.id ? 'active' : ''}`}
          onClick={() => setMode(item.id)}
          title={item.label}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default Toolbar;
