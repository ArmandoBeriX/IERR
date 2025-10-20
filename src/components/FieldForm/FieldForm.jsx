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
    storeData: {
      min: '',
      max: '',
      regex: '',
      formatted: false,
      selectorType: 0,
      currentId: 1,
      possibleValues: {},
      validExtensions: ''
    },
    relationQuery: []
  });

  const [relationFilters, setRelationFilters] = useState([]);
  const [availableRelationFields, setAvailableRelationFields] = useState([]);
  const [errors, setErrors] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newPossibleValue, setNewPossibleValue] = useState('');

  const availableTables = tablesData.filter(table => table.id !== tableId);

  // Tipos de campo que permiten múltiples valores
  const multipleAllowedTypes = ['relation', 'attachment', 'list'];
  
  // Operadores disponibles por tipo de campo
  const getOperatorsForFieldType = (fieldType) => {
    const baseOperators = [
      { value: '=', label: 'Igual a' },
      { value: '!=', label: 'Distinto de' }
    ];

    const comparisonOperators = [
      { value: '<', label: 'Menor que' },
      { value: '>', label: 'Mayor que' },
      { value: '<=', label: 'Hasta' },
      { value: '>=', label: 'Desde' },
      { value: '<=>', label: 'Entre' }
    ];

    const specialOperators = [
      { value: '*', label: 'Cualquiera' },
      { value: '!*', label: 'Ninguno' }
    ];

    switch (fieldType) {
      case 'bool':
        return baseOperators;
      
      case 'int':
      case 'float':
      case 'date':
      case 'time':
      case 'datetime':
        return [...baseOperators, ...comparisonOperators];
      
      case 'relation':
        return [...baseOperators, ...specialOperators];
      
      default: // string, text, list, attachment
        return [...baseOperators, ...specialOperators];
    }
  };

  useEffect(() => {
    console.log('=== FieldForm - INICIO ===');
    console.log('FieldForm - campo recibido:', field);
    
    if (isEditing && field) {
      const fieldFormatValue = field.format || field.fieldFormat;
      const detectedFieldFormat = fieldFormatValue || 'string';
      
      // CORRECCIÓN: Asegurar que storeData siempre es un objeto
      const existingStoreData = field.storeData || {};
      const existingRelationQuery = field.relationQuery || [];

      // CORRECCIÓN: Inicializar possibleValues si no existe
      const possibleValues = existingStoreData.possibleValues || {};
      const currentId = existingStoreData.currentId || Object.keys(possibleValues).length > 0 
        ? Math.max(...Object.keys(possibleValues).map(Number)) + 1 
        : 1;

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
        // CORRECCIÓN: Asegurar que todos los campos de storeData están presentes
        storeData: {
          min: existingStoreData.min || '',
          max: existingStoreData.max || '',
          regex: existingStoreData.regex || '',
          formatted: existingStoreData.formatted || false,
          selectorType: existingStoreData.selectorType !== undefined ? existingStoreData.selectorType : 0,
          currentId: currentId,
          possibleValues: possibleValues,
          validExtensions: existingStoreData.validExtensions || '',
          check_box: existingStoreData.check_box || false
        },
        relationQuery: existingRelationQuery
      };

      console.log('📝 DATOS CARGADOS EN FORMULARIO:', loadedData);
      console.log('🔍 StoreData cargado:', loadedData.storeData);
      
      setFormData(loadedData);
      setRelationFilters(existingRelationQuery);
      
    } else {
      // Reset form for new field - CORRECCIÓN: Inicializar storeData completo
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
        history: true,
        description: '',
        storeData: {
          min: '',
          max: '',
          regex: '',
          formatted: false,
          selectorType: 0,
          currentId: 1,
          possibleValues: {},
          validExtensions: ''
        },
        relationQuery: []
      });
      setRelationFilters([]);
    }
    setErrors({});
    setShowDeleteConfirm(false);
    setNewPossibleValue('');
  }, [field, isEditing, tableId]);

  // Actualizar campos disponibles cuando cambia la tabla relacionada
  useEffect(() => {
    if (formData.fieldFormat === 'relation' && formData.relationTableIdentifier) {
      const relatedTable = tablesData.find(
        table => table.identifier === formData.relationTableIdentifier
      );
      if (relatedTable) {
        const fields = (relatedTable.tableFields || [])
          .filter(f => !f.isRelation)
          .map(f => ({
            identifier: f.identifier,
            name: f.name,
            fieldFormat: f.fieldFormat,
            isRelation: f.fieldFormat === 'relation'
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
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    if (name === 'fieldFormat') {
      setFormData(prev => ({
        ...prev,
        relationTableIdentifier: '',
        multiple: multipleAllowedTypes.includes(value) ? prev.multiple : false
      }));
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

  // Manejar possibleValues para list
  const addPossibleValue = () => {
    if (!newPossibleValue.trim()) return;
    
    const newId = formData.storeData.currentId;
    setFormData(prev => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        currentId: newId + 1,
        possibleValues: {
          ...prev.storeData.possibleValues,
          [newId]: newPossibleValue.trim()
        }
      }
    }));
    setNewPossibleValue('');
  };

  const removePossibleValue = (id) => {
    setFormData(prev => {
      const newPossibleValues = { ...prev.storeData.possibleValues };
      delete newPossibleValues[id];
      return {
        ...prev,
        storeData: {
          ...prev.storeData,
          possibleValues: newPossibleValues
        }
      };
    });
  };

  const updatePossibleValue = (id, newValue) => {
    setFormData(prev => ({
      ...prev,
      storeData: {
        ...prev.storeData,
        possibleValues: {
          ...prev.storeData.possibleValues,
          [id]: newValue
        }
      }
    }));
  };

  // Funciones para filtros de relación
  const addRelationFilter = () => {
    const newFilter = { field: '', op: '=', v: [''] };
    setRelationFilters(prev => [...prev, newFilter]);
  };

  const updateRelationFilter = (index, key, value) => {
    setRelationFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, [key]: value } : filter
      )
    );
  };

  const updateFilterValue = (index, valueIndex, newValue) => {
    setRelationFilters(prev => 
      prev.map((filter, i) => {
        if (i === index) {
          const newValues = [...filter.v];
          newValues[valueIndex] = newValue;
          return { ...filter, v: newValues };
        }
        return filter;
      })
    );
  };

  const addFilterValue = (index) => {
    setRelationFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, v: [...filter.v, ''] } : filter
      )
    );
  };

  const removeFilterValue = (index, valueIndex) => {
    setRelationFilters(prev => 
      prev.map((filter, i) => {
        if (i === index) {
          const newValues = filter.v.filter((_, vi) => vi !== valueIndex);
          return { ...filter, v: newValues.length > 0 ? newValues : [''] };
        }
        return filter;
      })
    );
  };

  const removeRelationFilter = (index) => {
    setRelationFilters(prev => prev.filter((_, i) => i !== index));
  };

  const getFilterFieldType = (fieldIdentifier) => {
    const field = availableRelationFields.find(f => f.identifier === fieldIdentifier);
    return field ? field.fieldFormat : 'string';
  };

  const renderFilterValueInput = (filter, index, valueIndex) => {
    const fieldType = getFilterFieldType(filter.field);
    
    switch (fieldType) {
      case 'int':
      case 'float':
        return (
          <input
            type="number"
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
            placeholder="Valor numérico"
            step={fieldType === 'float' ? '0.1' : '1'}
          />
        );
      case 'bool':
        return (
          <select
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
          >
            <option value="">Seleccionar...</option>
            <option value="true">Verdadero</option>
            <option value="false">Falso</option>
          </select>
        );
      case 'date':
        return (
          <input
            type="date"
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
          />
        );
      case 'time':
        return (
          <input
            type="time"
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
          />
        );
      default:
        return (
          <input
            type="text"
            value={filter.v[valueIndex] || ''}
            onChange={(e) => updateFilterValue(index, valueIndex, e.target.value)}
            placeholder="Valor"
          />
        );
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== ENVIANDO FORMULARIO ===');
    console.log('Datos del formulario a guardar:', formData);
    console.log('Filtros de relación:', relationFilters);
    console.log('StoreData a guardar:', formData.storeData);
    console.log('RelationQuery a guardar:', formData.fieldFormat === 'relation' ? relationFilters : []);
    
    if (!validateForm()) {
      console.log('Validación fallida');
      return;
    }
    
    // Preparar datos para enviar - CORRECCIÓN: Asegurar que storeData y relationQuery se envíen
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
      // CORRECCIÓN: Asegurar que storeData se envía
      storeData: formData.storeData || {},
      // CORRECCIÓN: Asegurar que relationQuery se envía solo para relation
      relationQuery: formData.fieldFormat === 'relation' ? relationFilters : []
    };
    
    console.log('✅ Datos procesados para guardar:', submitData);
    console.log('✅ StoreData enviado:', submitData.storeData);
    console.log('✅ RelationQuery enviado:', submitData.relationQuery);
    
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
      {/* Campos básicos */}
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="identifier" className="required-field">Identificador</label>
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
          {errors.identifier && <small className="error-message">{errors.identifier}</small>}
        </div>
        
        <div className="form-group">
          <label htmlFor="name" className="required-field">Nombre</label>
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
          {errors.name && <small className="error-message">{errors.name}</small>}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="fieldFormat" className="required-field">Tipo de Campo</label>
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
          <option value="time">Hora (time)</option>
          <option value="datetime">Fecha y Hora (datetime)</option>
          <option value="relation">Relación (relation)</option>
          <option value="attachment">Archivo (attachment)</option>
          <option value="list">Lista (list)</option>
        </select>
      </div>

      {/* Múltiple solo para relation, attachment, list */}
      {multipleAllowedTypes.includes(formData.fieldFormat) && (
        <div className="form-group checkbox-group">
          <label>
            <input
              type="checkbox"
              name="multiple"
              checked={formData.multiple}
              onChange={handleChange}
            />
            Múltiples Valores
          </label>
          <small className="small-info">
            Permite seleccionar múltiples valores para este campo
          </small>
        </div>
      )}

      {/* Valores Posibles para list */}
      {formData.fieldFormat === 'list' && (
        <div className="conditional-section">
          <h4>Valores Posibles</h4>
          <div className="possible-values-container">
            <div className="add-possible-value">
              <input
                type="text"
                value={newPossibleValue}
                onChange={(e) => setNewPossibleValue(e.target.value)}
                placeholder="Nuevo valor de la lista"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPossibleValue())}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={addPossibleValue}
                disabled={!newPossibleValue.trim()}
              >
                <i className="bi bi-plus"></i> Agregar
              </button>
            </div>
            
            <div className="possible-values-list">
              {Object.entries(formData.storeData.possibleValues).map(([id, value]) => (
                <div key={id} className="possible-value-item">
                  <input
                    type="hidden"
                    value={id}
                  />
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => updatePossibleValue(id, e.target.value)}
                    placeholder="Valor de la lista"
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removePossibleValue(id)}
                    title="Eliminar valor"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
              
              {Object.keys(formData.storeData.possibleValues).length === 0 && (
                <div className="empty-state">
                  <small>No hay valores definidos para la lista</small>
                </div>
              )}
            </div>
          </div>
          <small className="small-info">
            Define los valores disponibles para seleccionar en esta lista
          </small>
        </div>
      )}

      {/* Formatos Válidos para attachment */}
      {formData.fieldFormat === 'attachment' && (
        <div className="form-group">
          <label>Formatos Válidos</label>
          <input
            type="text"
            value={formData.storeData.validExtensions}
            onChange={(e) => handleStoreDataChange('validExtensions', e.target.value)}
            placeholder="jpeg, jpg, png..."
          />
          <small className="small-info">
            Múltiples valores (separados por coma). Ejemplo: jpeg, jpg, png
          </small>
        </div>
      )}

      {/* Min/Max para int, float, string, text */}
      {(formData.fieldFormat === 'int' || formData.fieldFormat === 'float' || 
        formData.fieldFormat === 'string' || formData.fieldFormat === 'text') && (
        <div className="conditional-section">
          <h4>Longitud y Validaciones</h4>
          <div className="form-row">
            <div className="form-group">
              <label>Longitud Mínima</label>
              <input
                type="number"
                value={formData.storeData.min}
                onChange={(e) => handleStoreDataChange('min', e.target.value)}
                placeholder="Mínimo"
                min="0"
              />
            </div>
            <div className="form-group">
              <label>Longitud Máxima</label>
              <input
                type="number"
                value={formData.storeData.max}
                onChange={(e) => handleStoreDataChange('max', e.target.value)}
                placeholder="Máximo"
                min="0"
              />
            </div>
          </div>
        </div>
      )}

      {/* Texto formateado para text */}
      {formData.fieldFormat === 'text' && (
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
            Permite formato avanzado (rich text) con editor WYSIWYG
          </small>
        </div>
      )}

      {/* Regex para int, float, string */}
      {(formData.fieldFormat === 'int' || formData.fieldFormat === 'float' || formData.fieldFormat === 'string') && (
        <div className="form-group">
          <label>Expresión Regular</label>
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
      )}

      {/* Selector Type para relation y list */}
      {(formData.fieldFormat === 'relation' || formData.fieldFormat === 'list') && (
        <div className="form-group">
          <label>Tipo de Selector</label>
          <select
            value={formData.storeData.selectorType}
            onChange={(e) => handleStoreDataChange('selectorType', parseInt(e.target.value))}
          >
            <option value={0}>Tradicional (dropdown)</option>
            <option value={1}>Casillas (checkboxes)</option>
          </select>
          <small className="small-info">
            Cómo se mostrarán las opciones en los formularios
          </small>
        </div>
      )}

      {/* Opciones para campos relation - CON OPERADORES DINÁMICOS */}
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
              <small className="error-message">{errors.relationTableIdentifier}</small>
            )}
          </div>

          {/* Filtros de relación - CON OPERADORES DINÁMICOS */}
          <div className="form-group">
            <label>Filtrado por</label>
            <div className="relation-filters">
              {relationFilters.map((filter, index) => {
                const fieldType = getFilterFieldType(filter.field);
                const availableOperators = getOperatorsForFieldType(fieldType);
                
                return (
                  <div key={index} className="relation-filter-row">
                    <select
                      value={filter.field}
                      onChange={(e) => updateRelationFilter(index, 'field', e.target.value)}
                    >
                      <option value="">Seleccionar campo...</option>
                      {availableRelationFields.map(field => (
                        <option key={field.identifier} value={field.identifier}>
                          {field.name} ({field.identifier}) - {field.fieldFormat}
                        </option>
                      ))}
                    </select>
                    
                    <select
                      value={filter.op}
                      onChange={(e) => updateRelationFilter(index, 'op', e.target.value)}
                    >
                      {availableOperators.map(op => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>
                    
                    <div className="filter-values">
                      {filter.v.map((value, valueIndex) => (
                        <div key={valueIndex} className="filter-value-row">
                          {renderFilterValueInput(filter, index, valueIndex)}
                          {filter.v.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => removeFilterValue(index, valueIndex)}
                              title="Eliminar valor"
                            >
                              <i className="bi bi-dash"></i>
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {/* Botón para agregar valor adicional (para operadores como '<=>') */}
                      {(filter.op === '<=>' || filter.op === '!=') && filter.v.length < 2 && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => addFilterValue(index)}
                          title="Agregar valor adicional"
                        >
                          <i className="bi bi-plus"></i> Valor
                        </button>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeRelationFilter(index)}
                      title="Eliminar filtro"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                );
              })}
              
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addRelationFilter}
              >
                <i className="bi bi-plus"></i> Añadir Filtro
              </button>
            </div>
            <small className="small-info">
              Filtros aplicados a los registros de la tabla relacionada
            </small>
          </div>
        </div>
      )}

      {/* Propiedades generales del campo */}
      <div className="conditional-section">
        <h4>Propiedades Generales</h4>
        
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
    </form>
  );
};

export default FieldForm;