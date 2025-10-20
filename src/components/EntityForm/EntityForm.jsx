// src/components/EntityForm/EntityForm.jsx
import React, { useState, useEffect } from 'react';
import './EntityForm.css';

const EntityForm = ({ entity, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    console.log('EntityForm - entidad recibida:', entity);
    
    if (entity) {
      setFormData({
        name: entity.name || '',
        identifier: entity.identifier || '',
        description: entity.description || ''
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [entity]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre de la entidad es requerido';
    }
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'El identificador es requerido';
    } else {
      const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!identifierRegex.test(formData.identifier)) {
        newErrors.identifier = 'El identificador debe comenzar con una letra o guión bajo y solo puede contener letras, números y guiones bajos';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Enviando datos de entidad:', formData);
    
    if (!validateForm()) {
      console.log('Validación fallida');
      return;
    }
    
    onSave(formData);
  };

  const handleDelete = () => {
    if (!entity) return;
    
    console.log('Eliminando entidad:', entity);
    if (onDelete) {
      onDelete(entity.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      <div className="form-group">
        <label htmlFor="name">Nombre de la Entidad *</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Nombre de la entidad"
          className={errors.name ? 'error' : ''}
        />
        {errors.name && (
          <small style={{color: '#dc3545', fontSize: '12px'}}>
            {errors.name}
          </small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="identifier">Identificador *</label>
        <input
          type="text"
          id="identifier"
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          required
          placeholder="identificador_entidad"
          className={errors.identifier ? 'error' : ''}
        />
        {errors.identifier && (
          <small style={{color: '#dc3545', fontSize: '12px'}}>
            {errors.identifier}
          </small>
        )}
        <small style={{fontSize: '11px', color: '#6c757d'}}>
          Nombre técnico de la entidad (solo letras, números y _)
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Descripción de la entidad..."
        />
        <small style={{fontSize: '11px', color: '#6c757d'}}>
          Texto que aparece debajo del nombre de la entidad
        </small>
      </div>

      {/* ELIMINAMOS LOS BOTONES DEL FORMULARIO - SE MUESTRAN EN EL MODAL */}
    </form>
  );
};

export default EntityForm;