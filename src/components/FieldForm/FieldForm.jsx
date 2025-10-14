// src/components/FieldForm/FieldForm.jsx
import React, { useState, useEffect } from 'react';
import './FieldForm.css';

const FieldForm = ({ tableId, field, tablesData, onSave, onCancel, onDelete }) => {
  const isEditing = field !== null;
  
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    fieldFormat: 'string',
    multiple: false,
    isRequired: false,
    isFilter: false,
    isUnique: false,
    default: '',
    relationTableIdentifier: '',
    isEditable: true,
    isVisible: true,
    history: true, // AGREGADO: history por defecto en true
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    console.log('=== FieldForm - INICIO ===');
    console.log('FieldForm - campo recibido:', field);
    console.log('FieldForm - isEditing:', isEditing);
    
    if (isEditing && field) {
      // DETECTAR EL TIPO DE CAMPO BASADO EN LA PROPIEDAD CORRECTA
      // El campo viene del diagrama y tiene la propiedad 'format' (no 'fieldFormat')
      const fieldFormatValue = field.format || field.fieldFormat;
      
      console.log('🔍 PROPIEDADES DEL CAMPO:');
      console.log('  - field.format:', field.format);
      console.log('  - field.fieldFormat:', field.fieldFormat);
      console.log('  - field.identifier:', field.identifier);
      console.log('  - field.name:', field.name);
      console.log('  - field.history:', field.history); // AGREGADO
      
      // Usar el valor exacto que viene del campo
      const detectedFieldFormat = fieldFormatValue || 'string';
      
      console.log('🎯 VALOR A USAR EN FORMULARIO:', detectedFieldFormat);

      // Cargar todos los datos del campo
      const loadedData = {
        identifier: field.identifier || '',
        name: field.name || '',
        fieldFormat: detectedFieldFormat,
        multiple: Boolean(field.multiple),
        isRequired: Boolean(field.isRequired),
        isFilter: Boolean(field.isFilter),
        isUnique: Boolean(field.isUnique),
        default: field.default !== null && field.default !== undefined ? String(field.default) : '',
        relationTableIdentifier: field.relationTableIdentifier || '',
        isEditable: field.isEditable !== undefined ? Boolean(field.isEditable) : true,
        isVisible: field.isVisible !== undefined ? Boolean(field.isVisible) : true,
        history: field.history !== undefined ? Boolean(field.history) : true, // AGREGADO
        description: field.description || ''
      };

      console.log('📝 DATOS CARGADOS EN FORMULARIO:', loadedData);
      
      setFormData(loadedData);
      
    } else {
      // Reset form for new field
      console.log('Inicializando formulario para NUEVO campo');
      setFormData({
        identifier: '',
        name: '',
        fieldFormat: 'string',
        multiple: false,
        isRequired: false,
        isFilter: false,
        isUnique: false,
        default: '',
        relationTableIdentifier: '',
        isEditable: true,
        isVisible: true,
        history: true, // AGREGADO: history por defecto en true
        description: ''
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [field, isEditing]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.identifier.trim()) {
      newErrors.identifier = 'El identificador es requerido';
    } else {
      const identifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
      if (!identifierRegex.test(formData.identifier)) {
        newErrors.identifier = 'El identificador debe comenzar con una letra o guión bajo y solo puede contener letras, números y guiones bajos';
      }
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es requerido';
    }
    
    if (formData.fieldFormat === 'relation' && !formData.relationTableIdentifier) {
      newErrors.relationTableIdentifier = 'Debe seleccionar una tabla relacionada para campos de tipo relación';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    console.log(`Cambio en campo ${name}:`, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Si cambia el tipo de campo y no es relación, limpiar la tabla relacionada
    if (name === 'fieldFormat' && value !== 'relation') {
      setFormData(prev => ({
        ...prev,
        relationTableIdentifier: ''
      }));
      console.log('Tipo cambiado a no-relación, limpiando tabla relacionada');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== ENVIANDO FORMULARIO ===');
    console.log('Datos del formulario a guardar:', formData);
    
    if (!validateForm()) {
      console.log('Validación fallida');
      return;
    }
    
    // Preparar datos para enviar
    const submitData = {
      identifier: formData.identifier,
      name: formData.name,
      fieldFormat: formData.fieldFormat,
      multiple: Boolean(formData.multiple),
      isRequired: Boolean(formData.isRequired),
      isFilter: Boolean(formData.isFilter),
      isUnique: Boolean(formData.isUnique),
      default: formData.default || null,
      relationTableIdentifier: formData.fieldFormat === 'relation' ? formData.relationTableIdentifier : null,
      isEditable: Boolean(formData.isEditable),
      isVisible: Boolean(formData.isVisible),
      history: Boolean(formData.history), // AGREGADO
      description: formData.description
    };
    
    console.log('Datos procesados para guardar:', submitData);
    onSave(submitData);
  };

  const handleDelete = () => {
    if (!field) return;
    
    console.log('Eliminando campo:', field);
    if (onDelete) {
      onDelete(tableId, field);
    }
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  const availableTables = tablesData.filter(table => table.id !== tableId);

  return (
    <form onSubmit={handleSubmit} className="field-form">
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="identifier">Identificador *</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            required
            placeholder="nombre_campo"
            className={errors.identifier ? 'error' : ''}
          />
          {errors.identifier && (
            <small style={{color: '#dc3545', fontSize: '12px'}}>
              {errors.identifier}
            </small>
          )}
          <small style={{fontSize: '11px', color: '#6c757d'}}>
            Nombre técnico del campo (solo letras, números y _)
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Nombre *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Nombre del Campo"
            className={errors.name ? 'error' : ''}
          />
          {errors.name && (
            <small style={{color: '#dc3545', fontSize: '12px'}}>
              {errors.name}
            </small>
          )}
          <small style={{fontSize: '11px', color: '#6c757d'}}>
            Nombre legible para mostrar
          </small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="fieldFormat">Tipo de Campo *</label>
        <select
          id="fieldFormat"
          name="fieldFormat"
          value={formData.fieldFormat}
          onChange={handleChange}
          required
        >
          <option value="string">Texto (string)</option>
          <option value="text">Texto Largo (text)</option>
          <option value="int">Número Entero (int)</option>
          <option value="float">Número Decimal (float)</option>
          <option value="bool">Booleano (bool)</option>
          <option value="date">Fecha (date)</option>
          <option value="relation">Relación (relation)</option>
        </select>
      </div>

      {formData.fieldFormat === 'relation' && (
        <div className="form-group">
          <label htmlFor="relationTableIdentifier">Tabla Relacionada *</label>
          <select
            id="relationTableIdentifier"
            name="relationTableIdentifier"
            value={formData.relationTableIdentifier}
            onChange={handleChange}
            required
            className={errors.relationTableIdentifier ? 'error' : ''}
          >
            <option value="">Seleccionar tabla...</option>
            {availableTables.map(table => (
              <option key={table.id} value={table.identifier}>
                {table.name} ({table.identifier})
              </option>
            ))}
          </select>
          {errors.relationTableIdentifier && (
            <small style={{color: '#dc3545', fontSize: '12px'}}>
              {errors.relationTableIdentifier}
            </small>
          )}
        </div>
      )}

      <div className="form-row">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="multiple"
              checked={formData.multiple}
              onChange={handleChange}
            />
            Múltiple
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isRequired"
              checked={formData.isRequired}
              onChange={handleChange}
            />
            Requerido
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isFilter"
              checked={formData.isFilter}
              onChange={handleChange}
            />
            Filtrable
          </label>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isUnique"
              checked={formData.isUnique}
              onChange={handleChange}
            />
            Único
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isEditable"
              checked={formData.isEditable}
              onChange={handleChange}
            />
            Editable
          </label>
        </div>

        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="isVisible"
              checked={formData.isVisible}
              onChange={handleChange}
            />
            Visible
          </label>
        </div>
      </div>

      {/* NUEVA FILA PARA EL CAMPO HISTORY */}
      <div className="form-row">
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="history"
              checked={formData.history}
              onChange={handleChange}
            />
            History
          </label>
          <small style={{fontSize: '11px', color: '#6c757d', display: 'block', marginTop: '4px'}}>
            Indica si el campo lleva historial de cambios
          </small>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="default">Valor por Defecto</label>
        <input
          type="text"
          id="default"
          name="default"
          value={formData.default}
          onChange={handleChange}
          placeholder="Valor predeterminado"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          placeholder="Descripción del campo..."
        />
      </div>

      {/* ELIMINAMOS COMPLETAMENTE LOS BOTONES DEL FORMULARIO */}
      {/* Los botones ahora estarán solo en el footer del modal */}
    </form>
  );
};

export default FieldForm;