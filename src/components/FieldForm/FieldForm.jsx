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
    history: true,
    description: '',
    // NUEVOS CAMPOS PARA storeData
    storeData: {
      check_box: false,
      formatted: false,
      min: '',
      max: '',
      regex: ''
    },
    // NUEVO: Para relaciones
    relationQuery: []
  });

  const [relationFilters, setRelationFilters] = useState([]);
  const [availableRelationFields, setAvailableRelationFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Filtrar tablas disponibles para relaciones (excluyendo la actual)
  const availableTables = tablesData.filter(table => table.id !== tableId);

  useEffect(() => {
    console.log('=== FieldForm - INICIO ===');
    console.log('FieldForm - campo recibido:', field);
    
    if (isEditing && field) {
      const fieldFormatValue = field.format || field.fieldFormat;
      const detectedFieldFormat = fieldFormatValue || 'string';
      
      // Cargar storeData existente o inicializar
      const existingStoreData = field.storeData || {};
      
      // Cargar relationQuery existente
      const existingRelationQuery = field.relationQuery || [];

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
        history: field.history !== undefined ? Boolean(field.history) : true,
        description: field.description || '',
        storeData: {
          check_box: existingStoreData.check_box || false,
          formatted: existingStoreData.formatted || false,
          min: existingStoreData.min || '',
          max: existingStoreData.max || '',
          regex: existingStoreData.regex || ''
        },
        relationQuery: existingRelationQuery
      };

      console.log('📝 DATOS CARGADOS EN FORMULARIO:', loadedData);
      
      setFormData(loadedData);
      setRelationFilters(existingRelationQuery);
      
    } else {
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
        history: true,
        description: '',
        storeData: {
          check_box: false,
          formatted: false,
          min: '',
          max: '',
          regex: ''
        },
        relationQuery: []
      });
      setRelationFilters([]);
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [field, isEditing, tableId]);

  // ACTUALIZAR: Cuando cambia la tabla relacionada, cargar sus campos
  useEffect(() => {
    if (formData.fieldFormat === 'relation' && formData.relationTableIdentifier) {
      const relatedTable = tablesData.find(
        table => table.identifier === formData.relationTableIdentifier
      );
      if (relatedTable) {
        const fields = (relatedTable.tableFields || [])
          .filter(f => !f.isRelation) // Excluir campos de relación
          .map(f => ({
            identifier: f.identifier,
            name: f.name,
            fieldFormat: f.fieldFormat
          }));
        setAvailableRelationFields(fields);
      }
    } else {
      setAvailableRelationFields([]);
    }
  }, [formData.relationTableIdentifier, formData.fieldFormat, tablesData]);

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

  const handleStoreDataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        [key]: value
      }
    }));
  };

  // NUEVA FUNCIÓN: Agregar filtro de relación
  const addRelationFilter = () => {
    const newFilter = { field: '', op: '=', v: [''] };
    setRelationFilters(prev => [...prev, newFilter]);
  };

  // NUEVA FUNCIÓN: Actualizar filtro de relación
  const updateRelationFilter = (index, key, value) => {
    setRelationFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, [key]: value } : filter
      )
    );
  };

  // NUEVA FUNCIÓN: Eliminar filtro de relación
  const removeRelationFilter = (index) => {
    setRelationFilters(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== ENVIANDO FORMULARIO ===');
    console.log('Datos del formulario a guardar:', formData);
    console.log('Filtros de relación:', relationFilters);
    
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
      history: Boolean(formData.history),
      description: formData.description,
      storeData: formData.storeData,
      relationQuery: formData.fieldFormat === 'relation' ? relationFilters : []
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

  return (
    <form onSubmit={handleSubmit} className="field-form">
      {/* Campos básicos existentes */}
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
            <small className="error-message">
              {errors.identifier}
            </small>
          )}
          <small className="small-info">
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
            <small className="error-message">
              {errors.name}
            </small>
          )}
          <small className="small-info">
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
          <option value="attachment">Archivo (attachment)</option>
        </select>
      </div>

      {/* NUEVO: Mostrar opción "Múltiple" solo para relation y attachment */}
      {(formData.fieldFormat === 'relation' || formData.fieldFormat === 'attachment') && (
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
          <small className="small-info">
            Permite múltiples valores para este campo
          </small>
        </div>
      )}

      {/* NUEVO: Opciones para campos relation */}
      {formData.fieldFormat === 'relation' && (
        <div className="conditional-section">
          <h4>Opciones de Relación</h4>
          
          <div className="form-group">
            <label htmlFor="relationTableIdentifier" className="required-field">Tabla Relacionada</label>
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
              <small className="error-message">
                {errors.relationTableIdentifier}
              </small>
            )}
          </div>

          <div className="form-group">
            <label>Mostrar como</label>
            <select
              value={formData.storeData.check_box ? 'check_box' : ''}
              onChange={(e) => handleStoreDataChange('check_box', e.target.value === 'check_box')}
            >
              <option value="">Lista de despliegue</option>
              <option value="check_box">Casillas de selección</option>
            </select>
            <small className="small-info">
              Cómo se mostrará este campo en los formularios
            </small>
          </div>

          {/* NUEVO: Filtros de relación */}
          <div className="form-group">
            <label>Filtros de Relación</label>
            <div className="relation-filters">
              {relationFilters.map((filter, index) => (
                <div key={index} className="relation-filter-row">
                  <select
                    value={filter.field}
                    onChange={(e) => updateRelationFilter(index, 'field', e.target.value)}
                  >
                    <option value="">Seleccionar campo...</option>
                    {availableRelationFields.map(field => (
                      <option key={field.identifier} value={field.identifier}>
                        {field.name} ({field.identifier})
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filter.op}
                    onChange={(e) => updateRelationFilter(index, 'op', e.target.value)}
                  >
                    <option value="*">* (todos)</option>
                    <option value="!*">!* (no todos)</option>
                    <option value="=">= (igual)</option>
                    <option value="!=">!= (diferente)</option>
                    <option value="<">{'< (menor)'}</option>
                    <option value="<=">{'<= (menor o igual)'}</option>
                    <option value=">">{'> (mayor)'}</option>
                    <option value=">=">{'>= (mayor o igual)'}</option>
                    <option value="<=>">{'<=> (comparación)'}</option>
                  </select>
                  
                  <input
                    type="text"
                    value={filter.v[0] || ''}
                    onChange={(e) => updateRelationFilter(index, 'v', [e.target.value])}
                    placeholder="Valor"
                  />
                  
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeRelationFilter(index)}
                    title="Eliminar filtro"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addRelationFilter}
              >
                <i className="bi bi-plus"></i> Agregar Filtro
              </button>
            </div>
            <small className="small-info">
              Filtros aplicados a la tabla relacionada
            </small>
          </div>
        </div>
      )}

      {/* NUEVO: Opción para campos text */}
      {formData.fieldFormat === 'text' && (
        <div className="conditional-section">
          <h4>Opciones de Texto</h4>
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.storeData.formatted}
                onChange={(e) => handleStoreDataChange('formatted', e.target.checked)}
              />
              Texto Formateado
            </label>
            <small className="small-info">
              Permite formato avanzado (rich text)
            </small>
          </div>
        </div>
      )}

      {/* NUEVO: Min/Max para int, float, string, text */}
      {(formData.fieldFormat === 'int' || formData.fieldFormat === 'float' || 
        formData.fieldFormat === 'string' || formData.fieldFormat === 'text') && (
        <div className="conditional-section">
          <h4>Validaciones</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Mínimo</label>
              <input
                type={formData.fieldFormat === 'int' || formData.fieldFormat === 'float' ? 'number' : 'text'}
                value={formData.storeData.min}
                onChange={(e) => handleStoreDataChange('min', e.target.value)}
                placeholder="Valor mínimo"
              />
            </div>
            <div className="form-group">
              <label>Máximo</label>
              <input
                type={formData.fieldFormat === 'int' || formData.fieldFormat === 'float' ? 'number' : 'text'}
                value={formData.storeData.max}
                onChange={(e) => handleStoreDataChange('max', e.target.value)}
                placeholder="Valor máximo"
              />
            </div>
          </div>
        </div>
      )}

      {/* NUEVO: Regex para int, float, string */}
      {(formData.fieldFormat === 'int' || formData.fieldFormat === 'float' || formData.fieldFormat === 'string') && (
        <div className="conditional-section">
          <h4>Expresión Regular</h4>
          <div className="form-group">
            <input
              type="text"
              value={formData.storeData.regex}
              onChange={(e) => handleStoreDataChange('regex', e.target.value)}
              placeholder="/^[a-zA-Z0-9]+$/"
            />
            <small className="small-info">
              Expresión regular para validar el formato del campo
            </small>
          </div>
        </div>
      )}

      {/* Propiedades generales del campo */}
      <div className="conditional-section">
        <h4>Propiedades del Campo</h4>
        
        <div className="checkbox-row">
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
        </div>

        <div className="checkbox-row">
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
          </div>
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
        <small className="small-info">
          Valor que se asignará automáticamente si no se proporciona uno
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
          placeholder="Descripción del campo..."
        />
        <small className="small-info">
          Texto explicativo que aparecerá como ayuda
        </small>
      </div>

      {/* ELIMINAMOS COMPLETAMENTE LOS BOTONES DEL FORMULARIO */}
      {/* Los botones ahora estarán solo en el footer del modal */}
    </form>
  );
};

export default FieldForm;