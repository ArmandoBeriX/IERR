// src/components/NavigationBar/NavigationBar.jsx (actualizado)
import React, { useState, useCallback, useRef, useEffect } from 'react';
import Button from '../UI/Button';
import IconButton from '../UI/IconButton';
import SearchBox from '../UI/SearchBox';
import ToggleButton from '../UI/ToggleButton';
import EntityRelationshipDiagram from '../EntityRelationshipDiagram/EntityRelationshipDiagram';

import './NavigationBar.css';

const NavigationBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [tablesData, setTablesData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDraggable, setIsDraggable] = useState(true);
  const [searchInfo, setSearchInfo] = useState({
    term: '',
    results: 0,
    currentIndex: -1,
    hasResults: false
  });

  // Refs para controlar el diagrama
  const diagramRef = useRef(null);
  const zoomInRef = useRef(() => diagramRef.current?.zoomIn());
  const zoomOutRef = useRef(() => diagramRef.current?.zoomOut());
  const centerViewRef = useRef(() => diagramRef.current?.centerView());
  
  // Ref para búsqueda
  const searchRef = useRef({
    handleSearch: (term) => diagramRef.current?.handleSearch(term),
    goToNextResult: () => diagramRef.current?.goToNextResult(),
    goToPreviousResult: () => diagramRef.current?.goToPreviousResult(),
    getSearchInfo: () => diagramRef.current?.getSearchInfo()
  });

  // Actualizar información de búsqueda periódicamente
  useEffect(() => {
    const interval = setInterval(() => {
      if (diagramRef.current) {
        const info = searchRef.current.getSearchInfo();
        if (info) {
          setSearchInfo(info);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
    searchRef.current.handleSearch(searchTerm);
  };

  const handleNextResult = () => {
    console.log('Siguiente resultado');
    searchRef.current.goToNextResult();
  };

  const handlePreviousResult = () => {
    console.log('Resultado anterior');
    searchRef.current.goToPreviousResult();
  };

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
          setTablesData(jsonData);
          console.log('Datos cargados:', jsonData);
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
  }, []);

  const handleZoomIn = () => {
    zoomInRef.current();
  };

  const handleZoomOut = () => {
    zoomOutRef.current();
  };

  const handleCenterView = () => {
    centerViewRef.current();
  };

  const toggleDragMode = () => {
    setIsDraggable(!isDraggable);
    if (diagramRef.current) {
      diagramRef.current.toggleDraggable();
    }
  };

  return (
    <div className={`navigation-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="navigation-bar">
        
        {/* Botón para cargar JSON */}
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

        {/* Cuadro de búsqueda */}
        <div className="nav-section search-section">
          <SearchBox
            placeholder="Buscar tablas por nombre..."
            onSearch={handleSearch}
            showNavigation={true}
            onNext={handleNextResult}
            onPrevious={handlePreviousResult}
          />
          {/* Indicador de resultados de búsqueda */}
          {searchInfo.hasResults && (
            <div className="search-results-indicator">
              <span className="search-results-text">
                {searchInfo.currentIndex + 1} de {searchInfo.results}
              </span>
            </div>
          )}
        </div>

        {/* Botones de control del diagrama */}
        <div className="nav-section map-controls">
          <IconButton
            icon={isDraggable ? "bi bi-arrows-move" : "bi bi-cursor"}
            onClick={toggleDragMode}
            title={isDraggable ? "Modo mover activado" : "Modo seleccionar activado"}
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

        {/* Botones de utilidad */}
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

      {/* Panel de detalles */}
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
            <div className="stat">
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

      {/* Diagrama de Entidad-Relación */}
      <EntityRelationshipDiagram 
        tablesData={tablesData} 
        ref={diagramRef}
      />
      
    </div>
  );
};

export default NavigationBar;