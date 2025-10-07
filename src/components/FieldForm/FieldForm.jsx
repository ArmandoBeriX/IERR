// src/components/FieldForm/FieldForm.jsx
import React, { useState, useEffect } from 'react';
import './FieldForm.css';

const FieldForm = ({ tableId, field, tablesData, onSave, onCancel }) => {
  const isEditing = field !== null;
  
  const [formData, setFormData] = useState({
    identifier: '',
    name: '',
    fieldFormat: 'string', // Valor por defecto para nuevos campos
    multiple: false,
    isRequired: false,
    isFilter: false,
    isUnique: false,
    default: '',
    relationTableIdentifier: '',
    isEditable: true,
    isVisible: true,
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    console.log('=== FieldForm - INICIO ===');
    console.log('Campo recibido para editar:', field);
    console.log('isEditing:', isEditing);
    
    if (isEditing && field) {
      // CORRECCIÓN CRÍTICA: Leer el fieldFormat REAL del campo
      const originalFieldFormat = field.fieldFormat;
      const originalRelationTable = field.relationTableIdentifier;
      
      console.log('Tipo de campo original:', originalFieldFormat);
      console.log('Tabla relacionada original:', originalRelationTable);
      console.log('Campo completo:', field);

      // Cargar todos los datos del campo existente
      setFormData({
        identifier: field.identifier || '',
        name: field.name || field.identifier || '',
        fieldFormat: originalFieldFormat || 'string', // USAR EL VALOR REAL
        multiple: Boolean(field.multiple),
        isRequired: Boolean(field.isRequired),
        isFilter: Boolean(field.isFilter),
        isUnique: Boolean(field.isUnique),
        default: field.default !== null && field.default !== undefined ? String(field.default) : '',
        relationTableIdentifier: originalRelationTable || '', // USAR EL VALOR REAL
        isEditable: field.isEditable !== undefined ? field.isEditable : true,
        isVisible: field.isVisible !== undefined ? field.isVisible : true,
        description: field.description || ''
      });

      console.log('Datos cargados en el formulario:', {
        identifier: field.identifier,
        name: field.name,
        fieldFormat: originalFieldFormat,
        relationTableIdentifier: originalRelationTable,
        multiple: field.multiple,
        isRequired: field.isRequired
      });
      
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
        description: ''
      });
    }
    setErrors({});
    console.log('=== FieldForm - FIN ===');
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

    // CORRECCIÓN: Si cambia el tipo de campo y no es relación, limpiar la tabla relacionada
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
    console.log('Datos del formulario:', formData);
    console.log('Campo original:', field);
    
    if (!validateForm()) {
      console.log('Validación fallida');
      return;
    }
    
    // Preparar datos para enviar - MANTENER EL TIPO ORIGINAL SI ES EDICIÓN
    const submitData = {
      identifier: formData.identifier,
      name: formData.name,
      // CORRECCIÓN: Usar el fieldFormat del formulario (que debería ser el correcto)
      fieldFormat: formData.fieldFormat,
      multiple: Boolean(formData.multiple),
      isRequired: Boolean(formData.isRequired),
      isFilter: Boolean(formData.isFilter),
      isUnique: Boolean(formData.isUnique),
      default: formData.default || null,
      // Solo mantener relationTableIdentifier si es relación
      relationTableIdentifier: formData.fieldFormat === 'relation' ? formData.relationTableIdentifier : null,
      isEditable: Boolean(formData.isEditable),
      isVisible: Boolean(formData.isVisible),
      description: formData.description
    };
    
    console.log('Datos procesados para guardar:', submitData);
    onSave(submitData);
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
          value={formData.fieldFormat} // ESTE DEBERÍA MOSTRAR EL TIPO REAL
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
        {/* Mostrar información de depuración */}
        {isEditing && (
          <div style={{marginTop: '8px'}}>
            <small style={{fontSize: '11px', color: '#6c757d', display: 'block'}}>
              Tipo actual en formulario: <strong>{formData.fieldFormat}</strong>
            </small>
            {field && (
              <small style={{fontSize: '11px', color: '#17a2b8', display: 'block'}}>
                Tipo en campo original: <strong>{field.fieldFormat}</strong>
              </small>
            )}
          </div>
        )}
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
          {/* Mostrar información de depuración */}
          {isEditing && field && (
            <small style={{fontSize: '11px', color: '#17a2b8', marginTop: '4px', display: 'block'}}>
              Relación en campo original: <strong>{field.relationTableIdentifier || 'Ninguna'}</strong>
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

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary">
          {isEditing ? 'Actualizar Campo' : 'Crear Campo'}
        </button>
      </div>
    </form>
  );
};

export default FieldForm;