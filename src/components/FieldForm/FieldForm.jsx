// src/components/FieldForm/FieldForm.jsx
import React, { useState, useEffect } from 'react';
import './FieldForm.css';

const FieldForm = ({ tableId, field, tablesData, onSave, onCancel, onDelete }) => {
  const isEditing = field !== null;
  
  // Estado inicial vacío
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
      validExtensions: '',
      check_box: false
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

  // CORRECCIÓN CRÍTICA: Cargar datos del campo correctamente
  useEffect(() => {
    console.log('=== FieldForm - INICIALIZACIÓN ===');
    console.log('Campo recibido:', field);
    console.log('isEditing:', isEditing);
    console.log('tableId:', tableId);
    
    if (isEditing && field) {
      console.log('🔄 Cargando datos del campo existente para edición');
      
      // CORRECCIÓN: Usar fieldFormat o format según lo que venga
      const fieldFormatValue = field.fieldFormat || field.format || 'string';
      
      // CORRECCIÓN CRÍTICA: Cargar storeData completo
      const existingStoreData = field.storeData || {};
      console.log('📥 StoreData existente del campo:', existingStoreData);
      
      // CORRECCIÓN: Cargar possibleValues correctamente
      const possibleValues = existingStoreData.possibleValues || {};
      console.log('📥 PossibleValues encontrados:', possibleValues);
      
      // CORRECCIÓN: Calcular currentId basado en los possibleValues existentes
      const currentId = existingStoreData.currentId || 
        (Object.keys(possibleValues).length > 0 
          ? Math.max(...Object.keys(possibleValues).map(Number)) + 1 
          : 1);

      // CORRECCIÓN CRÍTICA: Cargar min/max correctamente - VERIFICAR SI SON NÚMEROS
      let minValue = '';
      let maxValue = '';
      
      if (existingStoreData.min !== undefined && existingStoreData.min !== null && existingStoreData.min !== '') {
        minValue = String(existingStoreData.min);
      }
      
      if (existingStoreData.max !== undefined && existingStoreData.max !== null && existingStoreData.max !== '') {
        maxValue = String(existingStoreData.max);
      }

      console.log('🔍 Min/Max procesados:', { min: minValue, max: maxValue });
      console.log('🔍 StoreData completo a cargar:', {
        min: minValue,
        max: maxValue,
        regex: existingStoreData.regex || '',
        formatted: Boolean(existingStoreData.formatted),
        selectorType: existingStoreData.selectorType !== undefined ? Number(existingStoreData.selectorType) : 0,
        currentId: currentId,
        possibleValues: possibleValues,
        validExtensions: existingStoreData.validExtensions || '',
        check_box: Boolean(existingStoreData.check_box)
      });
      
      // CORRECCIÓN COMPLETA: Cargar TODOS los datos
      const loadedData = {
        identifier: field.identifier || '',
        name: field.name || '',
        fieldFormat: fieldFormatValue,
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
        // CORRECCIÓN CRÍTICA: Cargar storeData COMPLETO
        storeData: {
          min: minValue,
          max: maxValue,
          regex: existingStoreData.regex || '',
          formatted: Boolean(existingStoreData.formatted),
          selectorType: existingStoreData.selectorType !== undefined ? Number(existingStoreData.selectorType) : 0,
          currentId: currentId,
          possibleValues: possibleValues,
          validExtensions: existingStoreData.validExtensions || '',
          check_box: Boolean(existingStoreData.check_box)
        },
        relationQuery: field.relationQuery || []
      };

      console.log('✅ Datos cargados en formulario:', loadedData);
      console.log('✅ StoreData cargado:', loadedData.storeData);
      console.log('✅ Min/Max cargados en formulario:', { 
        min: loadedData.storeData.min, 
        max: loadedData.storeData.max 
      });
      console.log('✅ PossibleValues cargados en formulario:', loadedData.storeData.possibleValues);
      
      setFormData(loadedData);
      setRelationFilters(field.relationQuery || []);
      
    } else {
      // Nuevo campo - inicializar con valores por defecto
      console.log('🆕 Inicializando formulario para NUEVO campo');
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
          validExtensions: '',
          check_box: false
        },
        relationQuery: []
      });
      setRelationFilters([]);
    }
    
    setErrors({});
    setShowDeleteConfirm(false);
    setNewPossibleValue('');
  }, [field, isEditing, tableId]);

  // CORRECCIÓN: Efecto para verificar que los datos se cargaron correctamente
  useEffect(() => {
    if (isEditing && field) {
      console.log('🔍 VERIFICACIÓN DETALLADA:');
      console.log('Campo recibido en FieldForm:', field);
      console.log('StoreData recibido:', field.storeData);
      console.log('Min recibido:', field.storeData?.min);
      console.log('Max recibido:', field.storeData?.max);
      console.log('PossibleValues recibidos:', field.storeData?.possibleValues);
      
      // CORRECCIÓN: Si no hay storeData, buscar el campo completo en tablesData
      if (!field.storeData || Object.keys(field.storeData).length === 0) {
        console.log('⚠️ Campo sin storeData, buscando en tablesData...');
        const table = tablesData.find(t => t.id === tableId);
        if (table) {
          const fullField = table.tableFields?.find(f => 
            f.id === field.id || f.identifier === field.identifier
          );
          if (fullField && fullField.storeData) {
            console.log('✅ Campo completo encontrado:', fullField);
            
            // Recargar con el campo completo
            const fieldFormatValue = fullField.fieldFormat || fullField.format || 'string';
            const existingStoreData = fullField.storeData || {};
            const possibleValues = existingStoreData.possibleValues || {};
            const currentId = existingStoreData.currentId || 
              (Object.keys(possibleValues).length > 0 
                ? Math.max(...Object.keys(possibleValues).map(Number)) + 1 
                : 1);

            let minValue = '';
            let maxValue = '';
            
            if (existingStoreData.min !== undefined && existingStoreData.min !== null && existingStoreData.min !== '') {
              minValue = String(existingStoreData.min);
            }
            
            if (existingStoreData.max !== undefined && existingStoreData.max !== null && existingStoreData.max !== '') {
              maxValue = String(existingStoreData.max);
            }

            const loadedData = {
              identifier: fullField.identifier || '',
              name: fullField.name || '',
              fieldFormat: fieldFormatValue,
              multiple: Boolean(fullField.multiple),
              isRequired: Boolean(fullField.isRequired),
              isFilter: Boolean(fullField.isFilter),
              isUnique: Boolean(fullField.isUnique),
              default: fullField.default !== null && fullField.default !== undefined ? String(fullField.default) : '',
              relationTableIdentifier: fullField.relationTableIdentifier || '',
              isEditable: fullField.isEditable !== undefined ? Boolean(fullField.isEditable) : true,
              isVisible: fullField.isVisible !== undefined ? Boolean(fullField.isVisible) : true,
              history: fullField.history !== undefined ? Boolean(fullField.history) : true,
              description: fullField.description || '',
              storeData: {
                min: minValue,
                max: maxValue,
                regex: existingStoreData.regex || '',
                formatted: Boolean(existingStoreData.formatted),
                selectorType: existingStoreData.selectorType !== undefined ? Number(existingStoreData.selectorType) : 0,
                currentId: currentId,
                possibleValues: possibleValues,
                validExtensions: existingStoreData.validExtensions || '',
                check_box: Boolean(existingStoreData.check_box)
              },
              relationQuery: fullField.relationQuery || []
            };
            
            console.log('🔄 Recargando datos con campo completo:', loadedData);
            setFormData(loadedData);
            setRelationFilters(fullField.relationQuery || []);
          }
        }
      }
    }
  }, [field, isEditing, tableId, tablesData]);

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
    
    console.log(`📝 Cambio en campo ${name}:`, type === 'checkbox' ? checked : value);
    
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

    // Si cambia el tipo de campo, resetear algunos valores
    if (name === 'fieldFormat') {
      setFormData(prev => ({
        ...prev,
        relationTableIdentifier: '',
        multiple: multipleAllowedTypes.includes(value) ? prev.multiple : false
      }));
    }
  };

  // CORRECCIÓN: Función mejorada para manejar cambios en storeData
  const handleStoreDataChange = (key, value) => {
    console.log(`📝 Cambio en storeData.${key}:`, value);
    
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
    console.log(`➕ Agregando possibleValue: ${newPossibleValue} con ID: ${newId}`);
    
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
    
    console.log('✅ PossibleValues actualizado:', {
      ...formData.storeData.possibleValues,
      [newId]: newPossibleValue.trim()
    });
  };

  const removePossibleValue = (id) => {
    console.log(`➖ Eliminando possibleValue con ID: ${id}`);
    
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
    console.log(`✏️ Actualizando possibleValue ${id}: ${newValue}`);
    
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

  // CORRECCIÓN CRÍTICA: Función handleSubmit mejorada para guardar TODOS los datos
  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('=== ENVIANDO FORMULARIO ===');
    console.log('Datos completos del formulario:', formData);
    console.log('StoreData a guardar:', formData.storeData);
    console.log('Min/Max a guardar:', { min: formData.storeData.min, max: formData.storeData.max });
    console.log('PossibleValues a guardar:', formData.storeData.possibleValues);
    console.log('RelationFilters a guardar:', relationFilters);
    
    if (!validateForm()) {
      console.log('❌ Validación fallida');
      return;
    }
    
    // CORRECCIÓN: Preparar datos para enviar, procesando min/max correctamente
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
      // CORRECCIÓN CRÍTICA: Enviar storeData COMPLETO con todos los campos procesados correctamente
      storeData: {
        // Procesar min/max: convertir a número si no están vacíos
        min: formData.storeData.min !== '' && formData.storeData.min !== null ? 
             Number(formData.storeData.min) : '',
        max: formData.storeData.max !== '' && formData.storeData.max !== null ? 
             Number(formData.storeData.max) : '',
        regex: formData.storeData.regex || '',
        formatted: Boolean(formData.storeData.formatted),
        selectorType: Number(formData.storeData.selectorType),
        currentId: Number(formData.storeData.currentId),
        // Solo enviar possibleValues para campos de tipo list
        possibleValues: formData.fieldFormat === 'list' ? formData.storeData.possibleValues : {},
        validExtensions: formData.storeData.validExtensions || '',
        check_box: Boolean(formData.storeData.check_box)
      },
      relationQuery: formData.fieldFormat === 'relation' ? relationFilters : []
    };
    
    console.log('✅ Datos procesados para guardar:', submitData);
    console.log('✅ StoreData enviado:', submitData.storeData);
    console.log('✅ Min/Max enviados:', { min: submitData.storeData.min, max: submitData.storeData.max });
    console.log('✅ PossibleValues enviados:', submitData.storeData.possibleValues);
    
    // Llamar a la función onSave del padre
    onSave(submitData);
  };

  const handleDelete = () => {
    if (!field) return;
    
    console.log('🗑️ Solicitando eliminación de campo:', field);
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

  // CORRECCIÓN: Renderizar los valores actuales en los inputs
  console.log('🔄 Renderizando formulario con datos:', {
    min: formData.storeData.min,
    max: formData.storeData.max,
    possibleValues: formData.storeData.possibleValues
  });

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

      {/* Opciones para campos relation */}
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

          {/* Filtros de relación */}
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

      {/* Botones de acción (ocultos, se manejan desde el modal) */}
    </form>
  );
};

export default FieldForm;