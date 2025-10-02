// src/components/NavigationBar/NavigationBar.jsx (actualizado)
import React, { useState, useCallback } from 'react';
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

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
  };

  const handleNextResult = () => {
    console.log('Siguiente resultado');
  };

  const handlePreviousResult = () => {
    console.log('Resultado anterior');
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
        
        // Intentar parsear como JSON
        if (file.name.endsWith('.json')) {
          jsonData = JSON.parse(content);
        } else if (file.name.endsWith('.txt')) {
          // Para archivos .txt, buscar el array JSON
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
        // Limpiar el input
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
    // Lógica para zoom in en el diagrama
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    // Lógica para zoom out en el diagrama
    console.log('Zoom out');
  };

  const handleCenterView = () => {
    // Lógica para centrar el diagrama
    console.log('Centrar vista');
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
            placeholder="Buscar en el diagrama..."
            onSearch={handleSearch}
            showNavigation={true}
            onNext={handleNextResult}
            onPrevious={handlePreviousResult}
          />
        </div>

        {/* Botones de control del diagrama */}
        <div className="nav-section map-controls">
          <IconButton
            icon="bi bi-arrows-move"
            onClick={() => console.log('Modo mover')}
            title="Mover elementos"
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
          </div>
        </div>
      )}

      {/* Diagrama de Entidad-Relación */}
      <EntityRelationshipDiagram tablesData={tablesData} />
      
    </div>
  );
};

export default NavigationBar;