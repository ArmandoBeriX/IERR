// src/components/UI/Modal/Modal.jsx
import React from 'react';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  title, 
  children, 
  onClose, 
  onSave,
  size = 'medium',
  showSaveButton = false,
  saveButtonText = 'Guardar',
  closeButtonText = 'Cancelar'
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className={`modal-container modal-${size}`}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="bi bi-x"></i>
          </button>
        </div>
        
        <div className="modal-content">
          {children}
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            {closeButtonText}
          </button>
          {showSaveButton && (
            <button className="btn btn-primary" onClick={onSave}>
              {saveButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;