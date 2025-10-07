// src/components/NavigationBar/NavigationBar.jsx (CORRECCIÓN CRÍTICA)
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../UI/Button';
import IconButton from '../UI/IconButton';
import SearchBox from '../UI/SearchBox';
import ToggleButton from '../UI/ToggleButton';
import EntityRelationshipDiagram from '../EntityRelationshipDiagram/EntityRelationshipDiagram';
import Modal from '../UI/Modal';
import FieldForm from '../FieldForm/FieldForm';

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
    onClose: null
  });

  const diagramRef = useRef(null);
  
  // CORRECCIÓN: Usar useRef para mantener el estado actual de edición
  const currentEditingStateRef = useRef({
    tableId: null,
    field: null,
    tableName: '',
    isEditing: false
  });

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
            // Buscar por id del campo existente
            const existingFieldIndex = currentFields.findIndex(
              field => field.id === existingField.id
            );
            
            console.log('Buscando campo existente:', existingField.id, 'Índice:', existingFieldIndex);
            
            if (existingFieldIndex !== -1) {
              // Actualizar campo existente
              const updatedFields = [...currentFields];
              updatedFields[existingFieldIndex] = {
                ...updatedFields[existingFieldIndex],
                ...fieldData,
                // Mantener propiedades críticas
                id: existingField.id,
                tableId: tableId
              };
              updatedTable.tableFields = updatedFields;
              console.log('Campo actualizado exitosamente:', updatedFields[existingFieldIndex]);
            } else {
              console.warn('Campo no encontrado para editar. Campos disponibles:', currentFields.map(f => ({ id: f.id, identifier: f.identifier })));
              return table;
            }
          } else {
            // Crear nuevo campo
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
              default: fieldData.default || '',
              relationTableIdentifier: fieldData.relationTableIdentifier || null,
              isEditable: fieldData.isEditable !== undefined ? fieldData.isEditable : true,
              isVisible: fieldData.isVisible !== undefined ? fieldData.isVisible : true,
              position: currentFields.length,
              description: fieldData.description || '',
              storeData: {},
              history: false
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
      isEditing: false
    };
  }, []);

  // CORRECCIÓN CRÍTICA: Función para abrir modal usando useRef
  const openFieldModal = useCallback((tableId, field = null, tableName = '') => {
    console.log('openFieldModal llamado con:', { tableId, field, tableName });
    
    // Validar que field sea un objeto de campo o null
    const isEditing = field !== null && typeof field === 'object' && field.identifier !== undefined;
    
    // Si field es un string (nombre de tabla), tratarlo como nuevo campo
    const actualField = typeof field === 'string' ? null : field;
    const actualTableName = typeof field === 'string' ? field : tableName;
    
    console.log('Abriendo modal procesado:', { 
      tableId, 
      actualField, 
      actualTableName, 
      isEditing 
    });
    
    // CORRECCIÓN: Actualizar el ref en lugar del state
    currentEditingStateRef.current = {
      tableId,
      field: actualField,
      tableName: actualTableName,
      isEditing
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
              isEditing: false
            };
          }}
        />
      ),
      onSave: null,
      onClose: () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        // Limpiar el ref al cerrar
        currentEditingStateRef.current = {
          tableId: null,
          field: null,
          tableName: '',
          isEditing: false
        };
      }
    });
  }, [tablesData, handleSaveField]);

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
        isDraggable={isDraggable}
        ref={diagramRef}
      />

      <Modal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        onClose={modalConfig.onClose}
        onSave={modalConfig.onSave}
        showSaveButton={false}
      >
        {modalConfig.content}
      </Modal>
      
    </div>
  );
};

export default NavigationBar;