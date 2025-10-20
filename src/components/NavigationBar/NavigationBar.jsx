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
  
  // CORRECCIÓN: Usar useRef para mantener el estado actual de edición
  const currentEditingStateRef = useRef({
    tableId: null,
    field: null,
    tableName: '',
    isEditing: false,
    entity: null // AGREGAMOS entity al ref
  });

  // Estado para confirmación de eliminación en el modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  // CORRECCIÓN CRÍTICA: Función para guardar campo usando useRef
  const handleSaveField = useCallback((fieldData) => {
    const { tableId, field: existingField, isEditing } = currentEditingStateRef.current;
    
    console.log('Guardando campo - Estado actual REF:', { 
      tableId, 
      existingField, 
      isEditing, 
      fieldData 
    });
    
    if (!tableId) {
      console.error('No hay tableId definido en el ref');
      alert('Error: No se pudo identificar la tabla. Por favor, intente nuevamente.');
      return;
    }
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          console.log('Encontrando tabla para actualizar:', tableId, table.name);
          const updatedTable = { ...table };
          const currentFields = table.tableFields || [];
          
          if (isEditing && existingField) {
            // CORRECCIÓN MEJORADA: Buscar por id O por identifier si no coincide el id
            let existingFieldIndex = currentFields.findIndex(
              field => field.id === existingField.id
            );
            
            // Si no encuentra por id, buscar por identifier (para campos originales del archivo)
            if (existingFieldIndex === -1) {
              console.log('No se encontró por id, buscando por identifier:', existingField.identifier);
              existingFieldIndex = currentFields.findIndex(
                field => field.identifier === existingField.identifier
              );
            }
            
            console.log('Buscando campo existente:', existingField.id, 'Índice:', existingFieldIndex);
            
            if (existingFieldIndex !== -1) {
              // Actualizar campo existente - CORRECCIÓN: INCLUIR storeData y relationQuery
              const updatedFields = [...currentFields];
              updatedFields[existingFieldIndex] = {
                ...updatedFields[existingFieldIndex],
                // Mantener propiedades críticas
                id: updatedFields[existingFieldIndex].id,
                tableId: tableId,
                // Actualizar datos básicos
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
                // CORRECCIÓN CRÍTICA: GUARDAR storeData y relationQuery
                storeData: fieldData.storeData || {},
                relationQuery: fieldData.relationQuery || []
              };
              updatedTable.tableFields = updatedFields;
              console.log('Campo actualizado exitosamente:', updatedFields[existingFieldIndex]);
            } else {
              console.warn('Campo no encontrado para editar. Creando como nuevo campo...');
              // CORRECCIÓN: Si no se encuentra, crear como nuevo campo INCLUYENDO storeData
              const newFieldId = `field-${tableId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
              const newField = {
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
                isEditable: fieldData.isEditable !== undefined ? fieldData.isEditable : true,
                isVisible: fieldData.isVisible !== undefined ? fieldData.isVisible : true,
                history: fieldData.history !== undefined ? Boolean(fieldData.history) : true,
                position: currentFields.length,
                description: fieldData.description || '',
                // CORRECCIÓN CRÍTICA: GUARDAR storeData y relationQuery
                storeData: fieldData.storeData || {},
                relationQuery: fieldData.relationQuery || []
              };
              
              console.log('Nuevo campo creado (fallback):', newField);
              updatedTable.tableFields = [...currentFields, newField];
            }
          } else {
            // Crear nuevo campo - CORRECCIÓN: INCLUIR storeData y relationQuery
            const newFieldId = `field-${tableId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const newField = {
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
              isEditable: fieldData.isEditable !== undefined ? fieldData.isEditable : true,
              isVisible: fieldData.isVisible !== undefined ? fieldData.isVisible : true,
              history: fieldData.history !== undefined ? Boolean(fieldData.history) : true,
              position: currentFields.length,
              description: fieldData.description || '',
              // CORRECCIÓN CRÍTICA: GUARDAR storeData y relationQuery
              storeData: fieldData.storeData || {},
              relationQuery: fieldData.relationQuery || []
            };
            
            console.log('Creando nuevo campo:', newField);
            updatedTable.tableFields = [...currentFields, newField];
          }
          
          return updatedTable;
        }
        return table;
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('Datos guardados en localStorage. Tablas actualizadas:', updatedTablesData);
        
        // DEBUG: Verificar que storeData se guardó correctamente
        const savedTable = updatedTablesData.find(t => t.id === tableId);
        if (savedTable) {
          const savedField = savedTable.tableFields.find(f => 
            f.identifier === fieldData.identifier
          );
          if (savedField) {
            console.log('✅ storeData guardado correctamente:', savedField.storeData);
            console.log('✅ relationQuery guardado correctamente:', savedField.relationQuery);
          }
        }
      } catch (error) {
        console.error('Error guardando en localStorage:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal después de guardar
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    
    // Limpiar el estado de edición
    currentEditingStateRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // CORRECCIÓN: Función para eliminar campo
  const handleDeleteField = useCallback((tableId, fieldToDelete) => {
    console.log('Eliminando campo:', { tableId, fieldToDelete });
    
    if (!tableId || !fieldToDelete) {
      console.error('Datos insuficientes para eliminar campo');
      return;
    }
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          console.log('Encontrando tabla para eliminar campo:', tableId);
          const updatedTable = { ...table };
          const currentFields = table.tableFields || [];
          
          // Buscar el campo a eliminar
          const fieldIndex = currentFields.findIndex(
            field => field.id === fieldToDelete.id || field.identifier === fieldToDelete.identifier
          );
          
          if (fieldIndex !== -1) {
            // Eliminar el campo y reordenar los demás
            const updatedFields = currentFields.filter((_, index) => index !== fieldIndex)
              .map((field, index) => ({
                ...field,
                position: index // Reasignar posiciones
              }));
            
            updatedTable.tableFields = updatedFields;
            console.log(`Campo eliminado: ${fieldToDelete.name}. Nuevo total: ${updatedFields.length} campos`);
          } else {
            console.warn('Campo no encontrado para eliminar:', fieldToDelete);
          }
          
          return updatedTable;
        }
        return table;
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('Datos guardados en localStorage después de eliminar campo');
      } catch (error) {
        console.error('Error guardando en localStorage:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal después de eliminar
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    setShowDeleteConfirm(false);
    
    // Limpiar el estado de edición
    currentEditingStateRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // CORRECCIÓN MEJORADA: Función para guardar entidad
  const handleSaveEntity = useCallback((entityData) => {
    const { tableId, entity: existingEntity } = currentEditingStateRef.current;
    
    console.log('Guardando entidad - Estado actual REF:', { 
      tableId, 
      existingEntity, 
      entityData 
    });
    
    if (!tableId) {
      console.error('No hay tableId definido en el ref');
      alert('Error: No se pudo identificar la entidad. Por favor, intente nuevamente.');
      return;
    }
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.map(table => {
        if (table.id === tableId) {
          console.log('Encontrando tabla para actualizar:', tableId, table.name);
          
          // Actualizar la entidad/tabla
          const updatedTable = {
            ...table,
            name: entityData.name,
            identifier: entityData.identifier,
            description: entityData.description
          };
          
          console.log('Entidad actualizada exitosamente:', updatedTable);
          return updatedTable;
        }
        return table;
      });
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('Entidad actualizada en localStorage');
      } catch (error) {
        console.error('Error guardando entidad en localStorage:', error);
      }
      
      return updatedTablesData;
    });

    // Cerrar modal después de guardar
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    
    // Limpiar el estado de edición
    currentEditingStateRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // CORRECCIÓN: Función para eliminar entidad
  const handleDeleteEntity = useCallback((entityId) => {
    console.log('Eliminando entidad:', entityId);
    
    setTablesData(prevTablesData => {
      const updatedTablesData = prevTablesData.filter(table => table.id !== entityId);
      
      // También eliminar las relaciones que apunten a esta entidad
      const cleanedTablesData = updatedTablesData.map(table => ({
        ...table,
        tableFields: table.tableFields?.map(field => {
          if (field.fieldFormat === 'relation' && field.relationTableIdentifier) {
            // Encontrar la tabla relacionada para ver si todavía existe
            const relatedTable = updatedTablesData.find(t => 
              t.identifier === field.relationTableIdentifier
            );
            if (!relatedTable) {
              // Si la tabla relacionada fue eliminada, convertir el campo a string
              return {
                ...field,
                fieldFormat: 'string',
                relationTableIdentifier: null
              };
            }
          }
          return field;
        }) || []
      }));
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(cleanedTablesData));
        console.log('Entidad eliminada de localStorage');
      } catch (error) {
        console.error('Error eliminando entidad de localStorage:', error);
      }
      
      return cleanedTablesData;
    });

    // Cerrar modal después de eliminar
    setModalConfig(prev => ({ ...prev, isOpen: false }));
    setShowDeleteConfirm(false);
    
    // Limpiar el estado de edición
    currentEditingStateRef.current = {
      tableId: null,
      field: null,
      tableName: '',
      isEditing: false,
      entity: null
    };
  }, []);

  // FUNCIÓN: Crear nueva entidad/tabla VACÍA directamente en el mapa
  const handleCreateEntity = useCallback(() => {
    console.log('Creando nueva entidad/tabla vacía');
    
    // Calcular posición para la nueva entidad (evitar superposición)
    const existingTables = tablesData || [];
    const newPosition = {
      x: (existingTables.length % 3) * 400 + 50,
      y: Math.floor(existingTables.length / 3) * 450 + 50
    };

    // Crear nueva entidad VACÍA con solo el campo ID por defecto
    const newEntityId = Date.now();
    const idField = {
      id: `field-${newEntityId}-id`,
      tableId: newEntityId,
      identifier: 'id',
      name: 'ID',
      fieldFormat: 'int',
      multiple: false,
      isRequired: true,
      isFilter: true,
      isUnique: true,
      default: null,
      relationTableIdentifier: null,
      isEditable: false,
      isVisible: true,
      history: true,
      position: 0,
      description: 'Clave primaria de la tabla',
      storeData: {},
      relationQuery: []
    };

    const newEntity = {
      id: newEntityId,
      identifier: `entidad_${newEntityId}`,
      name: `Entidad ${existingTables.length + 1}`,
      description: '',
      px: newPosition.x,
      py: newPosition.y,
      tableFields: [idField] // Solo el campo ID por defecto
    };

    console.log('Nueva entidad vacía creada:', newEntity);

    setTablesData(prevTablesData => {
      const updatedTablesData = [...prevTablesData, newEntity];
      
      // Guardar en localStorage
      try {
        localStorage.setItem('erDiagramData', JSON.stringify(updatedTablesData));
        console.log('Nueva entidad guardada en localStorage');
      } catch (error) {
        console.error('Error guardando nueva entidad en localStorage:', error);
      }
      
      return updatedTablesData;
    });
  }, [tablesData]);

  // CORRECCIÓN CRÍTICA: Función para abrir modal usando useRef
  const openFieldModal = useCallback((tableId, field = null, tableName = '') => {
    console.log('=== openFieldModal INICIO ===');
    console.log('Parámetros recibidos:', { tableId, field, tableName });
    
    // Validar que field sea un objeto de campo o null
    const isEditing = field !== null && typeof field === 'object' && field.identifier !== undefined;
    
    // Si field es un string (nombre de tabla), tratarlo como nuevo campo
    const actualField = typeof field === 'string' ? null : field;
    const actualTableName = typeof field === 'string' ? field : tableName;
    
    console.log('Datos procesados para modal:', { 
      tableId, 
      actualField, 
      actualTableName, 
      isEditing 
    });
    
    if (actualField) {
      console.log('Campo a editar - Detalles:', {
        id: actualField.id,
        identifier: actualField.identifier,
        name: actualField.name,
        fieldFormat: actualField.fieldFormat,
        relationTableIdentifier: actualField.relationTableIdentifier,
        storeData: actualField.storeData,
        relationQuery: actualField.relationQuery
      });
    }
    
    // CORRECCIÓN: Actualizar el ref en lugar del state
    currentEditingStateRef.current = {
      tableId,
      field: actualField,
      tableName: actualTableName,
      isEditing,
      entity: null
    };
    
    const modalTitle = isEditing ? 
      `Editar Campo - ${actualTableName}` : 
      `Agregar Campo - ${actualTableName}`;
    
    setModalConfig({
      isOpen: true,
      title: modalTitle,
      content: (
        <FieldForm
          tableId={tableId}
          field={actualField}
          tablesData={tablesData}
          onSave={handleSaveField}
          onCancel={() => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            // Limpiar el ref al cancelar
            currentEditingStateRef.current = {
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
        // Esta función se llamará cuando se haga clic en el botón Guardar del modal
        const form = document.querySelector('.field-form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      },
      onDelete: () => {
        // Mostrar confirmación de eliminación
        setShowDeleteConfirm(true);
      },
      onClose: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setShowDeleteConfirm(false);
        // Limpiar el ref al cerrar
        currentEditingStateRef.current = {
          tableId: null,
          field: null,
          tableName: '',
          isEditing: false,
          entity: null
        };
      },
      showDeleteButton: isEditing, // Solo mostrar botón de eliminar cuando se está editando
      showSaveButton: true,
      saveButtonText: isEditing ? 'Actualizar Campo' : 'Crear Campo'
    });

    setShowDeleteConfirm(false);
    
    console.log('=== openFieldModal FIN ===');
  }, [tablesData, handleSaveField, handleDeleteField]);

  // CORRECCIÓN MEJORADA: Función para abrir modal de edición de entidad
  const openEntityModal = useCallback((tableId, entity = null) => {
    console.log('Abriendo modal de entidad:', { tableId, entity });
    
    // Actualizar el ref con la entidad completa
    currentEditingStateRef.current = {
      tableId,
      field: null,
      tableName: entity?.name || '',
      isEditing: true,
      entity: entity // GUARDAMOS LA ENTIDAD COMPLETA
    };
    
    const modalTitle = `Editar Entidad - ${entity?.name || ''}`;
    
    setModalConfig({
      isOpen: true,
      title: modalTitle,
      content: (
        <EntityForm
          entity={entity}
          onSave={handleSaveEntity}
          onCancel={() => {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
            // Limpiar el ref al cancelar
            currentEditingStateRef.current = {
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
        // CORRECCIÓN: Para entidades, no usamos el evento submit del formulario
        // En su lugar, obtenemos los datos del formulario directamente
        const form = document.querySelector('.entity-form');
        if (form) {
          const formData = new FormData(form);
          const entityData = {
            name: formData.get('name') || '',
            identifier: formData.get('identifier') || '',
            description: formData.get('description') || ''
          };
          
          console.log('Datos del formulario de entidad:', entityData);
          
          // Validar que los datos no estén vacíos
          if (!entityData.name.trim() || !entityData.identifier.trim()) {
            alert('El nombre y el identificador de la entidad son requeridos');
            return;
          }
          
          // Llamar a handleSaveEntity con los datos del formulario
          handleSaveEntity(entityData);
        }
      },
      onDelete: () => {
        // Mostrar confirmación de eliminación para entidades
        setShowDeleteConfirm(true);
      },
      onClose: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setShowDeleteConfirm(false);
        // Limpiar el ref al cerrar
        currentEditingStateRef.current = {
          tableId: null,
          field: null,
          tableName: '',
          isEditing: false,
          entity: null
        };
      },
      showDeleteButton: true, // Mostrar botón de eliminar para entidades
      showSaveButton: true,
      saveButtonText: 'Actualizar Entidad'
    });

    setShowDeleteConfirm(false);
  }, [handleSaveEntity, handleDeleteEntity]);

  const handleTablesDataChange = useCallback((newTablesData) => {
    console.log('Actualizando datos de tablas:', newTablesData);
    setTablesData(newTablesData);
    
    try {
      localStorage.setItem('erDiagramData', JSON.stringify(newTablesData));
      console.log('Datos guardados en localStorage');
    } catch (error) {
      console.error('Error guardando en localStorage:', error);
    }
  }, []);

  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem('erDiagramData');
        const savedDarkMode = localStorage.getItem('darkMode');
        
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setTablesData(parsedData);
          console.log('Datos cargados desde localStorage:', parsedData);
        }
        
        if (savedDarkMode) {
          const darkMode = JSON.parse(savedDarkMode);
          setIsDarkMode(darkMode);
          document.body.classList.toggle('dark-mode', darkMode);
        }
      } catch (error) {
        console.error('Error cargando datos desde localStorage:', error);
      }
    };

    loadSavedData();
  }, []);

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
          const updatedData = jsonData.map((newTable, index) => {
            const existingTable = tablesData.find(t => t.id === newTable.id);
            if (existingTable && existingTable.px !== undefined && existingTable.py !== undefined) {
              return { ...newTable, px: existingTable.px, py: existingTable.py };
            }
            return { 
              ...newTable, 
              px: newTable.px || (index % 3) * 400 + 50, 
              py: newTable.py || Math.floor(index / 3) * 450 + 50 
            };
          });
          
          setTablesData(updatedData);
          console.log('Datos cargados y posiciones preservadas:', updatedData);
        } else {
          throw new Error('El archivo debe contener un array de tablas');
        }
      } catch (error) {
        console.error('Error al procesar el archivo:', error);
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

        {/* BOTÓN: Crear Entidad VACÍA directamente en el mapa */}
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
              {/* BOTÓN DE ELIMINACIÓN - PARA CAMPOS Y ENTIDADES */}
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
                        // Eliminar campo
                        const { tableId, field } = currentEditingStateRef.current;
                        if (tableId && field) {
                          handleDeleteField(tableId, field);
                        }
                      } else {
                        // Eliminar entidad
                        const { tableId } = currentEditingStateRef.current;
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