// src/components/UI/Button/Button.jsx
import React from 'react';
import './Button.css';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  type = 'button',
  className = '',
  asFileInput = false,
  onFileSelect,
  accept,
  ...props 
}) => {
  if (asFileInput) {
    return (
      <label className={`btn btn-${variant} btn-${size} ${className} file-input-label`}>
        <input
          type="file"
          accept={accept}
          onChange={onFileSelect}
          style={{ display: 'none' }}
          {...props}
        />
        {children}
      </label>
    );
  }

  return (
    <button
      type={type}
      className={`btn btn-${variant} btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;