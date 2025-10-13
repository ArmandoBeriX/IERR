// src/components/UI/IconButton/IconButton.jsx
import React from 'react';
import './IconButton.css';

const IconButton = ({ 
  icon, 
  onClick, 
  title,
  variant = 'primary',
  size = 'medium',
  active = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  return (
    <button
      className={`icon-btn icon-btn-${variant} icon-btn-${size} ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      <i className={icon}></i>
    </button>
  );
};

export default IconButton;