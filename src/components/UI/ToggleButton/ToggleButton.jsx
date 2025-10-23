// src/components/UI/ToggleButton/ToggleButton.jsx
import React from 'react';
import './ToggleButton.css';

const ToggleButton = ({ 
  isOn,
  onToggle,
  onIcon,
  offIcon,
  onTitle,
  offTitle,
  variant = 'primary',
  size = 'medium',
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`toggle-btn toggle-btn-${variant} toggle-btn-${size} ${isOn ? 'active' : ''} ${className}`}
      onClick={onToggle}
      title={isOn ? onTitle : offTitle}
      {...props}
    >
      <i className={isOn ? onIcon : offIcon}></i>
    </button>
  );
};

export default ToggleButton;