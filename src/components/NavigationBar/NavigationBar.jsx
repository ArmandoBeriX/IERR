// src/components/NavigationBar/NavigationBar.jsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../UI/Button';
import IconButton from '../UI/IconButton';
import SearchBox from '../UI/SearchBox';
import ToggleButton from '../UI/ToggleButton';
import EntityRelationshipDiagram from '../EntityRelationshipDiagram/EntityRelationshipDiagram';
import Modal from '../UI/Modal';
import FieldForm from '../FieldForm/FieldForm';
import EntityForm from '../EntityForm/EntityForm';

import './NavigationBar.css';

const NavigationBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tablesData, setTablesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const [searchInfo, setSearchInfo] = useState({
    term: '',
    results: 0,
    currentIndex: -1,
    hasResults: false
  });
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    content: null,
    onSave: null,
    onClose: null,
    showDeleteButton: false,
    onDelete: null,
    showSaveButton: true,
    saveButtonText: 'Guardar'
  });

  const diagramRef = useRef(null);
  
  // Estado para confirmación de eliminación en el modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // CORRECCIÓN: Usar useRef para mantener el estado de edición de forma persistente
  const currentEditingRef = useRef({
    tableId: null,
    field: null,
    tableName: '',
    isEditing: false,
    entity: null
  });

  // NUEVO: Estado para controlar el enfoque automático
  const [entityToFocus, setEntityToFocus] = useState(null);

  useEffect(() => {
    const updateSearchInfo = () => {
      if (diagramRef.current) {
        const info = diagramRef.current.getSearchInfo?.();
        if (info) {
          setSearchInfo(info);
        }
      }
    };

    updateSearchInfo();
    const interval = setInterval(updateSearchInfo, 500);
    return () => clearInterval(interval);
  }, []);

  // NUEVO: Efecto para enfocar entidad cuando se crea
  useEffect(() => {
    if (entityToFocus && diagramRef.current) {
      console.log('🎯 Enfocando entidad recién creada:', entityToFocus);
      
      // Usar la función de navegación suave del diagrama
      diagramRef.current.smoothNavigateToNode?.(entityToFocus.toString());
      
      // También podemos usar la función de búsqueda para resaltar
      diagramRef.current.highlightNode?.(entityToFocus.toString());
      
      // Limpiar después de enfocar
      setTimeout(() => {
        setEntityToFocus(null);
      }, 1000);
    }
  }, [entityToFocus]);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    document.body.classList.toggle('dark-mode', newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const toggleDragMode = () => {
    setIsDraggable(!isDraggable);
  };

  const handleSearch = (searchTerm) => {
    diagramRef.current?.handleSearch?.(searchTerm);
  };

  const handleNextResult = () => {
    diagramRef.current?.goToNextResult?.();
  };

  const handlePreviousResult = () => {
    diagramRef.current?.goToPreviousResult?.();
  };

  // Función auxiliar para crear nuevo campo
  const createNewField = (tableId, fieldData, position) => {
    const newFieldId = `field-${tableId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: newFieldId,
      tableId: tableId,
      identifier: fieldData.identifier,
      name: fieldData.name,
      fieldFormat: fieldData.fieldFormat,
      multiple: Boolean(fieldData.multiple),
      isRequired: Boolean(fieldData.isRequired),
      isFilter: Boolean(fieldData.isFilter),
      isUnique: Boolean(fieldData.isUnique),
      default: fieldData.default || null,
      relationTableIdentifier: fieldData.relationTableIdentifier || null,
      isEditable: fieldData.isEditable !== undefined ? Boolean(fieldData.isEditable) : true,
      isVisible: fieldData.isVisible !== undefined ? Boolean(fieldData.isVisible) : true,
      history: fieldData.history !== undefined ? Boolean(fieldData.history) : true,
      position: position,
      description: fieldData.description || '',
      storeData: { ...fieldData.storeData },
      relationQuery: fieldData.relationQuery || []
    };
  };

  // NUEVA FUNCIÓN: Agregar campos por defecto a una tabla
  const addDefaultFieldsToTable = (table) => {
    console.log(`🔄 Procesando tabla: ${table.name} (${table.identifier})`);
    
    const existingFields = table.tableFields || [];
    const isUsersTable = table.identifier === 'users';
    
    // VERIFICAR qué campos por defecto ya existen
    const existingFieldIdentifiers = existingFields.map(f => f.identifier);
    console.log(`📋 Campos existentes en ${table.name}:`, existingFieldIdentifiers);
    
    const defaultFields = [];
    
    // CAMPO ID - solo agregar si no existe
    if (!existingFieldIdentifiers.includes('id')) {
      defaultFields.push({
        id: `field-${table.id}-id`,
        tableId: table.id,
        identifier: 'id',
        name: 'ID',
        fieldFormat: 'string',
        multiple: false,
        isRequired: true,
        isFilter: true,
        isUnique: true,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: 0,
        description: 'Clave primaria de la tabla',
        storeData: {},
        history: false,
        relationQuery: []
      });
      console.log(`➕ Agregando campo ID a ${table.name}`);
    } else {
      console.log(`✅ Campo ID ya existe en ${table.name}`);
    }
    
    // CAMPO authorId - solo agregar si no existe y NO es la tabla users
    if (!isUsersTable && !existingFieldIdentifiers.includes('authorId')) {
      defaultFields.push({
        id: `field-${table.id}-authorId`,
        tableId: table.id,
        identifier: 'authorId',
        name: 'Autor',
        fieldFormat: 'relation',
        multiple: false,
        isRequired: true,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: 'users',
        isEditable: false,
        isVisible: true,
        position: 1,
        description: 'Usuario que creó el registro',
        storeData: {},
        history: false,
        relationQuery: []
      });
      console.log(`➕ Agregando campo authorId a ${table.name}`);
    } else if (isUsersTable) {
      console.log(`⏭️  Saltando campo authorId en tabla users`);
    } else {
      console.log(`✅ Campo authorId ya existe en ${table.name}`);
    }
    
    // CAMPO createdAt - solo agregar si no existe
    if (!existingFieldIdentifiers.includes('createdAt')) {
      const position = isUsersTable ? 1 : 2;
      defaultFields.push({
        id: `field-${table.id}-createdAt`,
        tableId: table.id,
        identifier: 'createdAt',
        name: 'Creado',
        fieldFormat: 'datetime',
        multiple: false,
        isRequired: false,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: position,
        description: 'Fecha y hora de creación del registro',
        storeData: {},
        history: false,
        relationQuery: []
      });
      console.log(`➕ Agregando campo createdAt a ${table.name}`);
    } else {
      console.log(`✅ Campo createdAt ya existe en ${table.name}`);
    }
    
    // CAMPO updatedAt - solo agregar si no existe
    if (!existingFieldIdentifiers.includes('updatedAt')) {
      const position = isUsersTable ? 2 : 3;
      defaultFields.push({
        id: `field-${table.id}-updatedAt`,
        tableId: table.id,
        identifier: 'updatedAt',
        name: 'Actualizado',
        fieldFormat: 'datetime',
        multiple: false,
        isRequired: false,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: position,
        description: 'Fecha y hora de última actualización',
        storeData: {},
        history: false,
        relationQuery: []
      });
      console.log(`➕ Agregando campo updatedAt a ${table.name}`);
    } else {
      console.log(`✅ Campo updatedAt ya existe en ${table.name}`);
    }
    
    // Si hay campos por agregar, combinarlos con los existentes
    if (defaultFields.length > 0) {
      console.log(`🔄 Combinando ${defaultFields.length} campos nuevos con ${existingFields.length} existentes en ${table.name}`);
      
      // Combinar campos existentes con los nuevos
      const combinedFields = [...defaultFields, ...existingFields];
      
      // Reordenar posiciones
      const reorderedFields = combinedFields.map((field, index) => ({
        ...field,
        position: index
      }));
      
      return {
        ...table,
        tableFields: reorderedFields
      };
    }
    
    console.log(`✅ Tabla ${table.name} ya tiene todos los campos por defecto`);
    return table;
  };

  // FUNCIÓN MEJORADA: Guardar entidad (DEFINIDA PRIMERO)
  const handleSaveEntity = useCallback((entityData) => {
    const { tableId } = currentEditingRef.current;
    
    console.log('🏢 Guardando entidad:', { tableId, entityData });
    
    if (!tableId) {
      console.error('❌ No hay tableId definido para guardar entidad');
      return;
    }
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          console.log(`🔄 Actualizando entidad: ${table.name} -> ${entityData.name}`);
          
          return {
            ...table,
            name: entityData.name,
            identifier: entityData.identifier,
            description: entityData.description
          };
        }
        return table;
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('💾 Entidad guardada en localStorage');
      } catch (error) {
        console.error('❌ Error guardando entidad:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    currentEditingRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // FUNCIÓN MEJORADA: Eliminar entidad (DEFINIDA SEGUNDO)
  const handleDeleteEntity = useCallback((entityId) => {
    console.log('🗑️ Eliminando entidad:', entityId);
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.filter(table => table.id !== entityId);
      
      // Limpiar relaciones que apunten a entidades eliminadas
      const cleanedTablesData = updatedTablesData.map(table => ({
        ...table,
        tableFields: (table.tableFields || []).map(field => {
          if (field.fieldFormat === 'relation' && field.relationTableIdentifier) {
            const relatedTableExists = updatedTablesData.some(
              t => t.identifier === field.relationTableIdentifier
            );
            if (!relatedTableExists) {
              return {
                ...field,
                fieldFormat: 'string',
                relationTableIdentifier: null
              };
            }
          }
          return field;
        })
      }));
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(cleanedTablesData));
        console.log('💾 Entidad eliminada de localStorage');
      } catch (error) {
        console.error('❌ Error eliminando entidad:', error);
      }
      
      return cleanedTablesData;
    });

    // Cerrar modal
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    setShowDeleteConfirm(false);
    currentEditingRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // FUNCIÓN MEJORADA: Abrir modal de entidad (DEFINIDA TERCERO)
  const openEntityModal = useCallback((tableId, entity = null) => {
    console.log('🏢 Abriendo modal de entidad:', { tableId, entity });
    
    // CORRECCIÓN: Validar que tableId sea un número
    const actualTableId = typeof tableId === 'string' ? parseInt(tableId) : tableId;
    
    currentEditingRef.current = {
      tableId: actualTableId,
      field: null,
      tableName: entity?.name || '',
      isEditing: true,
      entity: entity
    };
    
    console.log('✅ Estado de edición actualizado:', currentEditingRef.current);
    
    const modalTitle = entity ? `Editar Entidad - ${entity.name || ''}` : 'Nueva Entidad';
    
    setModalConfig({
      isOpen: true,
      title: modalTitle,
      content: (
        <EntityForm
          entity={entity}
          onSave={handleSaveEntity}
          onCancel={() => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            currentEditingRef.current = {
              tableId: null,
              field: null,
              tableName: '',
              isEditing: false,
              entity: null
            };
          }}
          onDelete={handleDeleteEntity}
        />
      ),
      onSave: () => {
        // Para entidades, obtener datos directamente del formulario
        const form = document.querySelector('.entity-form');
        if (form) {
          const formData = new FormData(form);
          const entityData = {
            name: formData.get('name') || '',
            identifier: formData.get('identifier') || '',
            description: formData.get('description') || ''
          };
          
          console.log('📝 Datos del formulario de entidad:', entityData);
          
          if (!entityData.name.trim() || !entityData.identifier.trim()) {
            alert('El nombre y el identificador de la entidad son requeridos');
            return;
          }
          
          handleSaveEntity(entityData);
        }
      },
      onDelete: () => {
        setShowDeleteConfirm(true);
      },
      onClose: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setShowDeleteConfirm(false);
        currentEditingRef.current = {
          tableId: null,
          field: null,
          tableName: '',
          isEditing: false,
          entity: null
        };
      },
      showDeleteButton: !!entity,
      showSaveButton: true,
      saveButtonText: entity ? 'Actualizar Entidad' : 'Crear Entidad'
    });

    setShowDeleteConfirm(false);
  }, [handleSaveEntity, handleDeleteEntity]);

  // FUNCIÓN COMPLETAMENTE CORREGIDA: Crear nueva entidad en el centro visible
  // VERSIÓN CON PATRÓN CIRCULAR, ENFOQUE AUTOMÁTICO Y CAMPOS POR DEFECTO
  const handleCreateEntity = useCallback(() => {
    console.log('🆕 Creando nueva entidad');
    
    const existingTables = tablesData || [];
    const entityCount = existingTables.length;
    
    // Crear en un patrón circular para distribución uniforme
    const radius = 300 + (entityCount * 50); // Radio aumenta con cada entidad
    const angle = (entityCount * 0.8) % (2 * Math.PI); // Ángulo en radianes
    
    const centerPosition = {
      x: 400 + Math.cos(angle) * radius,
      y: 300 + Math.sin(angle) * radius
    };
    
    console.log('📍 Posición circular:', centerPosition);
    console.log('📊 Radio:', radius, 'Ángulo:', angle);

    const newEntityId = Date.now();
    const newEntityIdentifier = `entidad_${newEntityId}`;
    
    // VERIFICAR si es la tabla 'users' para excluir el campo authorId
    const isUsersTable = newEntityIdentifier === 'users';
    
    // CAMPOS POR DEFECTO PARA NUEVAS ENTIDADES
    const defaultFields = [
      // CAMPO ID
      {
        id: `field-${newEntityId}-id`,
        tableId: newEntityId,
        identifier: 'id',
        name: 'ID',
        fieldFormat: 'string',
        multiple: false,
        isRequired: true,
        isFilter: true,
        isUnique: true,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: 0,
        description: 'Clave primaria de la tabla',
        storeData: {},
        history: false,
        relationQuery: []
      },
      
      // CAMPO authorId (solo si NO es la tabla users)
      ...(isUsersTable ? [] : [{
        id: `field-${newEntityId}-authorId`,
        tableId: newEntityId,
        identifier: 'authorId',
        name: 'Autor',
        fieldFormat: 'relation',
        multiple: false,
        isRequired: true,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: 'users',
        isEditable: false,
        isVisible: true,
        position: 1,
        description: 'Usuario que creó el registro',
        storeData: {},
        history: false,
        relationQuery: []
      }]),
      
      // CAMPO createdAt
      {
        id: `field-${newEntityId}-createdAt`,
        tableId: newEntityId,
        identifier: 'createdAt',
        name: 'Creado',
        fieldFormat: 'datetime',
        multiple: false,
        isRequired: false,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: isUsersTable ? 1 : 2,
        description: 'Fecha y hora de creación del registro',
        storeData: {},
        history: false,
        relationQuery: []
      },
      
      // CAMPO updatedAt
      {
        id: `field-${newEntityId}-updatedAt`,
        tableId: newEntityId,
        identifier: 'updatedAt',
        name: 'Actualizado',
        fieldFormat: 'datetime',
        multiple: false,
        isRequired: false,
        isFilter: true,
        isUnique: false,
        default: null,
        relationTableIdentifier: null,
        isEditable: false,
        isVisible: true,
        position: isUsersTable ? 2 : 3,
        description: 'Fecha y hora de última actualización',
        storeData: {},
        history: false,
        relationQuery: []
      }
    ];

    console.log(`📋 Campos por defecto para ${isUsersTable ? 'users' : 'entidad normal'}:`, defaultFields.length, 'campos');

    const newEntity = {
      id: newEntityId,
      identifier: newEntityIdentifier,
      name: `Entidad ${entityCount + 1}`,
      description: '',
      px: centerPosition.x,
      py: centerPosition.y,
      tableFields: defaultFields
    };

    setTablesData(prev => {
      const updated = [...(prev || []), newEntity];
      localStorage.setItem('erDiagramData', JSON.stringify(updated));
      return updated;
    });

    // NUEVO: Programar el enfoque automático después de crear la entidad
    setTimeout(() => {
      console.log('🎯 Programando enfoque para nueva entidad:', newEntityId);
      setEntityToFocus(newEntityId);
    }, 300);

    setTimeout(() => {
      openEntityModal(newEntityId, newEntity);
    }, 100);

  }, [tablesData, openEntityModal]);

  // CORRECCIÓN CRÍTICA: Función para guardar campo (DEFINIDA QUINTO)
  const handleSaveField = useCallback((fieldData) => {
    const { tableId, field: existingField, isEditing } = currentEditingRef.current;
    
    console.log('=== GUARDANDO CAMPO ===');
    console.log('Datos recibidos del formulario:', fieldData);
    console.log('Estado de edición REF:', { tableId, existingField, isEditing });
    console.log('📦 StoreData recibido:', fieldData.storeData);
    console.log('🔢 Min/Max recibidos:', { 
      min: fieldData.storeData.min, 
      max: fieldData.storeData.max 
    });
    console.log('📋 PossibleValues recibidos:', fieldData.storeData.possibleValues);
    
    if (!tableId) {
      console.error('❌ No hay tableId definido en el ref');
      alert('Error: No se pudo identificar la tabla. Por favor, intente nuevamente.');
      return;
    }
    
    setTablesData(prevTablesData => {
      console.log('📊 Tablas antes de actualizar:', prevTablesData.length);
      
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          console.log(`🔄 Actualizando tabla: ${table.name} (ID: ${tableId})`);
          
          const updatedTable = { ...table };
          const currentFields = [...(table.tableFields || [])];
          
          if (isEditing && existingField) {
            // EDITAR CAMPO EXISTENTE
            console.log('✏️ Editando campo existente:', existingField.identifier);
            
            const fieldIndex = currentFields.findIndex(
              f => f.id === existingField.id || f.identifier === existingField.identifier
            );
            
            if (fieldIndex !== -1) {
              // CORRECCIÓN CRÍTICA: Crear campo actualizado con TODOS los datos incluyendo storeData completo
              const updatedField = {
                ...currentFields[fieldIndex],
                // Actualizar todos los campos básicos
                identifier: fieldData.identifier,
                name: fieldData.name,
                fieldFormat: fieldData.fieldFormat,
                multiple: Boolean(fieldData.multiple),
                isRequired: Boolean(fieldData.isRequired),
                isFilter: Boolean(fieldData.isFilter),
                isUnique: Boolean(fieldData.isUnique),
                default: fieldData.default || null,
                relationTableIdentifier: fieldData.relationTableIdentifier || null,
                isEditable: Boolean(fieldData.isEditable),
                isVisible: Boolean(fieldData.isVisible),
                history: Boolean(fieldData.history),
                description: fieldData.description || '',
                // CORRECCIÓN CRÍTICA: GUARDAR storeData COMPLETO con todos los campos
                storeData: { 
                  ...fieldData.storeData 
                },
                relationQuery: fieldData.relationQuery || []
              };
              
              console.log('✅ Campo actualizado:', updatedField);
              console.log('📦 storeData guardado:', updatedField.storeData);
              console.log('🔢 Min/Max guardados:', { 
                min: updatedField.storeData.min, 
                max: updatedField.storeData.max 
              });
              console.log('📋 PossibleValues guardados:', updatedField.storeData.possibleValues);
              
              // Reemplazar el campo en la lista
              const updatedFields = [...currentFields];
              updatedFields[fieldIndex] = updatedField;
              updatedTable.tableFields = updatedFields;
            } else {
              console.warn('⚠️ Campo no encontrado, creando nuevo');
              // Crear nuevo campo si no se encuentra
              const newField = createNewField(tableId, fieldData, currentFields.length);
              updatedTable.tableFields = [...currentFields, newField];
            }
          } else {
            // CREAR NUEVO CAMPO
            console.log('🆕 Creando nuevo campo');
            const newField = createNewField(tableId, fieldData, currentFields.length);
            updatedTable.tableFields = [...currentFields, newField];
          }
          
          return updatedTable;
        }
        return table;
      });
      
      // GUARDAR EN LOCALSTORAGE
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('💾 Datos guardados en localStorage');
        
        // VERIFICAR que se guardó correctamente
        const savedTable = updatedTablesData.find(t => t.id === tableId);
        if (savedTable) {
          const savedField = savedTable.tableFields.find(f => 
            f.identifier === fieldData.identifier
          );
          if (savedField) {
            console.log('✅ Verificación - storeData en localStorage:', savedField.storeData);
            console.log('✅ Verificación - Min/Max en localStorage:', { 
              min: savedField.storeData.min, 
              max: savedField.storeData.max 
            });
            console.log('✅ Verificación - PossibleValues en localStorage:', savedField.storeData.possibleValues);
          }
        }
      } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal y limpiar estado
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    currentEditingRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // FUNCIÓN MEJORADA: Eliminar campo (DEFINIDA SEXTO)
  const handleDeleteField = useCallback((tableId, fieldToDelete) => {
    console.log('🗑️ Eliminando campo:', { tableId, fieldToDelete });
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          const updatedFields = (table.tableFields || [])
            .filter(field => field.id !== fieldToDelete.id && field.identifier !== fieldToDelete.identifier)
            .map((field, index) => ({
              ...field,
              position: index
            }));
          
          return {
            ...table,
            tableFields: updatedFields
          };
        }
        return table;
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('💾 Datos actualizados después de eliminar campo');
      } catch (error) {
        console.error('❌ Error guardando en localStorage:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    setShowDeleteConfirm(false);
    currentEditingRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // CORRECCIÓN CRÍTICA: Función para abrir modal de campo (DEFINIDA SÉPTIMO)
  const openFieldModal = useCallback((tableId, field = null, tableName = '') => {
    console.log('📝 Abriendo modal de campo');
    console.log('Parámetros recibidos:', { tableId, field, tableName });
    console.log('📦 StoreData del campo recibido:', field?.storeData); // LOG CRÍTICO
    
    // CORRECCIÓN: Validar que tableId sea un número
    const actualTableId = typeof tableId === 'string' ? parseInt(tableId) : tableId;
    
    const isEditing = field !== null && typeof field === 'object';
    const actualField = typeof field === 'string' ? null : field;
    const actualTableName = typeof field === 'string' ? field : tableName;
    
    // CORRECCIÓN: Si el campo viene sin storeData, buscar el campo completo en tablesData
    let completeField = actualField;
    if (isEditing && actualField && (!actualField.storeData || Object.keys(actualField.storeData).length === 0)) {
      console.log('🔄 Campo sin storeData, buscando en tablesData...');
      const table = tablesData.find(t => t.id === actualTableId);
      if (table) {
        const fullField = table.tableFields?.find(f => 
          f.id === actualField.id || f.identifier === actualField.identifier
        );
        if (fullField) {
          console.log('✅ Campo completo encontrado en tablesData:', fullField);
          completeField = fullField;
        } else {
          console.warn('⚠️ Campo no encontrado en tablesData');
        }
      } else {
        console.warn('⚠️ Tabla no encontrada en tablesData');
      }
    }
    
    // CORRECCIÓN CRÍTICA: Actualizar el REF con el campo completo
    currentEditingRef.current = {
      tableId: actualTableId,
      field: completeField, // USAR EL CAMPO COMPLETO
      tableName: actualTableName,
      isEditing,
      entity: null
    };
    
    console.log('✅ Estado de edición actualizado:', currentEditingRef.current);
    console.log('📦 StoreData final del campo:', currentEditingRef.current.field?.storeData);
    
    const modalTitle = isEditing ? 
      `Editar Campo - ${actualTableName}` : 
      `Agregar Campo - ${actualTableName}`;
    
    setModalConfig({
      isOpen: true,
      title: modalTitle,
      content: (
        <FieldForm
          tableId={actualTableId}
          field={completeField} // PASAR EL CAMPO COMPLETO
          tablesData={tablesData}
          onSave={handleSaveField}
          onCancel={() => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            currentEditingRef.current = {
              tableId: null,
              field: null,
              tableName: '',
              isEditing: false,
              entity: null
            };
          }}
          onDelete={handleDeleteField}
        />
      ),
      onSave: () => {
        // Disparar el evento submit del formulario
        const form = document.querySelector('.field-form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      },
      onDelete: () => {
        setShowDeleteConfirm(true);
      },
      onClose: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setShowDeleteConfirm(false);
        currentEditingRef.current = {
          tableId: null,
          field: null,
          tableName: '',
          isEditing: false,
          entity: null
        };
      },
      showDeleteButton: isEditing,
      showSaveButton: true,
      saveButtonText: isEditing ? 'Actualizar Campo' : 'Crear Campo'
    });

    setShowDeleteConfirm(false);
  }, [tablesData, handleSaveField, handleDeleteField]);

  const handleTablesDataChange = useCallback((newTablesData) => {
    console.log('🔄 Actualizando datos de tablas');
    setTablesData(newTablesData);
    
    try {
      localStorage.setItem('erDiagramData', JSON.stringify(newTablesData));
      console.log('💾 Datos guardados en localStorage');
    } catch (error) {
      console.error('❌ Error guardando en localStorage:', error);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem('erDiagramData');
        const savedDarkMode = localStorage.getItem('darkMode');
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setTablesData(parsedData);
          console.log('📂 Datos cargados desde localStorage:', parsedData);
          
          // Verificar que los datos se cargaron correctamente
          parsedData.forEach(table => {
            console.log(`📊 Tabla: ${table.name}`, {
              fields: table.tableFields?.length || 0,
              storeData: table.tableFields?.map(f => ({
                name: f.name,
                storeData: f.storeData
              }))
            });
          });
        }
        
        if (savedDarkMode) {
          const darkMode = JSON.parse(savedDarkMode);
          setIsDarkMode(darkMode);
          document.body.classList.toggle('dark-mode', darkMode);
        }
      } catch (error) {
        console.error('❌ Error cargando datos:', error);
      }
    };

    loadSavedData();
  }, []);

  // FUNCIÓN MEJORADA: Cargar archivo con campos por defecto
  const handleFileUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        let jsonData;
        
        if (file.name.endsWith('.json')) {
          jsonData = JSON.parse(content);
        } else if (file.name.endsWith('.txt')) {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonData = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No se encontró un array JSON válido en el archivo');
          }
        } else {
          throw new Error('Formato de archivo no soportado');
        }

        if (Array.isArray(jsonData)) {
          console.log('📂 Datos cargados desde archivo:', jsonData.length, 'tablas');
          
          const updatedData = jsonData.map((newTable, index) => {
            const existingTable = tablesData.find(t => t.id === newTable.id);
            
            // Preservar posición si existe
            let position;
            if (existingTable && existingTable.px !== undefined && existingTable.py !== undefined) {
              position = { x: existingTable.px, y: existingTable.py };
            } else {
              position = {
                x: newTable.px || (index % 3) * 400 + 50, 
                y: newTable.py || Math.floor(index / 3) * 450 + 50 
              };
            }

            // Crear tabla base con posición
            const tableWithPosition = { 
              ...newTable, 
              px: position.x,
              py: position.y
            };

            // AGREGAR CAMPOS POR DEFECTO a cada tabla cargada
            const tableWithDefaultFields = addDefaultFieldsToTable(tableWithPosition);
            
            console.log(`✅ Tabla procesada: ${tableWithDefaultFields.name}`, {
              camposOriginales: newTable.tableFields?.length || 0,
              camposFinales: tableWithDefaultFields.tableFields?.length || 0
            });
            
            return tableWithDefaultFields;
          });
          
          setTablesData(updatedData);
          console.log('🎉 Procesamiento completado:', updatedData.length, 'tablas con campos por defecto');
          
          // Mostrar resumen
          const totalOriginalFields = jsonData.reduce((acc, table) => acc + (table.tableFields?.length || 0), 0);
          const totalFinalFields = updatedData.reduce((acc, table) => acc + (table.tableFields?.length || 0), 0);
          const addedFields = totalFinalFields - totalOriginalFields;
          
          console.log(`📊 Resumen: ${addedFields} campos por defecto agregados`);
          
        } else {
          throw new Error('El archivo debe contener un array de tablas');
        }
      } catch (error) {
        console.error('❌ Error al procesar el archivo:', error);
        alert(`Error al cargar el archivo: ${error.message}`);
      } finally {
        setIsLoading(false);
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setIsLoading(false);
      alert('Error al leer el archivo');
      event.target.value = '';
    };

    reader.readAsText(file);
  }, [tablesData]);

  const handleZoomIn = () => {
    diagramRef.current?.zoomIn?.();
  };

  const handleZoomOut = () => {
    diagramRef.current?.zoomOut?.();
  };

  const handleCenterView = () => {
    diagramRef.current?.centerView?.();
  };

  return (
    <div className={`navigation-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="navigation-bar">
        
        <div className="nav-section">
          <Button 
            asFileInput={true}
            onFileSelect={handleFileUpload}
            accept=".json,.txt"
            title="Cargar archivo JSON o TXT con definición de tablas"
            disabled={isLoading}
          >
            <i className="bi bi-upload"></i>
            {isLoading ? 'Cargando...' : 'Cargar Esquema'}
          </Button>
        </div>

        <div className="nav-section">
          <Button 
            onClick={handleCreateEntity}
            title="Crear nueva entidad/tabla vacía"
          >
            <i className="bi bi-plus-circle"></i>
            Entidad
          </Button>
        </div>

        <div className="nav-section search-section">
          <SearchBox
            placeholder="Buscar tablas por nombre..."
            onSearch={handleSearch}
            showNavigation={true}
            onNext={handleNextResult}
            onPrevious={handlePreviousResult}
          />
          {searchInfo.hasResults && (
            <div className="search-results-indicator">
              <span className="search-results-text">
                {searchInfo.currentIndex + 1} de {searchInfo.results}
              </span>
            </div>
          )}
        </div>

        <div className="nav-section map-controls">
          <IconButton
            icon={isDraggable ? "bi bi-arrows-move" : "bi bi-cursor"}
            onClick={toggleDragMode}
            title={isDraggable ? "Modo mover (arrastrar tablas)" : "Modo seleccionar (solo navegación)"}
            active={isDraggable}
          />
          <IconButton
            icon="bi bi-zoom-in"
            onClick={handleZoomIn}
            title="Zoom +"
          />
          <IconButton
            icon="bi bi-zoom-out"
            onClick={handleZoomOut}
            title="Zoom -"
          />
          <IconButton
            icon="bi bi-fullscreen"
            onClick={handleCenterView}
            title="Centrar vista"
          />
        </div>

        <div className="nav-section utility-controls">
          <ToggleButton
            isOn={isDarkMode}
            onToggle={toggleDarkMode}
            onIcon="bi bi-sun"
            offIcon="bi bi-moon"
            onTitle="Modo claro"
            offTitle="Modo oscuro"
            variant="primary"
          />
          
          <ToggleButton
            isOn={showDetails}
            onToggle={toggleDetails}
            onIcon="bi bi-info-circle-fill"
            offIcon="bi bi-info-circle"
            onTitle="Ocultar detalles"
            offTitle="Mostrar detalles"
            variant="secondary"
          />
        </div>

      </div>

      {showDetails && (
        <div className="details-panel">
          <h4><i className="bi bi-diagram-3"></i> Diagrama Entidad-Relación</h4>
          <p>Visualización de tablas y sus relaciones basada en el esquema cargado.</p>
          <div className="stats">
            <div className="stat">
              <i className="bi bi-table"></i>
              <span>{tablesData.length} Tablas</span>
            </div>
            <div className="stat">
              <i className="bi bi-link-45deg"></i>
              <span>
                {tablesData.reduce((acc, table) => 
                  acc + (table.tableFields?.filter(f => f.fieldFormat === 'relation').length || 0), 0
                )} Relaciones
              </span>
            </div>
            <div className={`stat mode-stat ${isDraggable ? 'tables' : 'select'}`}>
              <i className={isDraggable ? "bi bi-arrows-move" : "bi bi-cursor"}></i>
              <span>{isDraggable ? "Modo Mover" : "Modo Seleccionar"}</span>
            </div>
            {searchInfo.hasResults && (
              <div className="stat search-stat">
                <i className="bi bi-search"></i>
                <span>
                  {searchInfo.results} resultado{searchInfo.results !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <EntityRelationshipDiagram 
        tablesData={tablesData} 
        onTablesDataChange={handleTablesDataChange}
        onEditField={openFieldModal}
        onAddField={openFieldModal}
        onEditEntity={openEntityModal}
        isDraggable={isDraggable}
        ref={diagramRef}
      />

      {/* MODAL */}
      {modalConfig.isOpen && (
        <div className="modal-backdrop" onClick={modalConfig.onClose}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{modalConfig.title}</h3>
              <button className="modal-close-btn" onClick={modalConfig.onClose}>
                <i className="bi bi-x"></i>
              </button>
            </div>
            
            <div className="modal-content">
              {modalConfig.content}
            </div>

            <div className="modal-footer">
              {/* BOTÓN DE ELIMINACIÓN */}
              {modalConfig.showDeleteButton && !showDeleteConfirm && (
                <button 
                  className="btn btn-danger" 
                  onClick={modalConfig.onDelete}
                  style={{ marginRight: 'auto' }}
                >
                  <i className="bi bi-trash"></i>
                  {modalConfig.title.includes('Campo') ? 'Eliminar Campo' : 'Eliminar Entidad'}
                </button>
              )}

              {/* CONFIRMACIÓN DE ELIMINACIÓN */}
              {showDeleteConfirm && (
                <div className="delete-confirmation" style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#dc3545' }}>
                    ¿Estás seguro?
                  </span>
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      if (modalConfig.title.includes('Campo')) {
                        const { tableId, field } = currentEditingRef.current;
                        if (tableId && field) {
                          handleDeleteField(tableId, field);
                        }
                      } else {
                        const { tableId } = currentEditingRef.current;
                        if (tableId) {
                          handleDeleteEntity(tableId);
                        }
                      }
                    }}
                  >
                    <i className="bi bi-check-lg"></i>
                    Sí
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    <i className="bi bi-x-lg"></i>
                    No
                  </button>
                </div>
              )}

              {/* BOTÓN GUARDAR */}
              {modalConfig.showSaveButton && (
                <button className="btn btn-primary" onClick={modalConfig.onSave}>
                  {modalConfig.saveButtonText || 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default NavigationBar;