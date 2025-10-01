// src/components/NavigationBar/NavigationBar.jsx
import React, { useState } from 'react';
import Button from '../UI/Button';
import IconButton from '../UI/IconButton';
import SearchBox from '../UI/SearchBox';
import ToggleButton from '../UI/ToggleButton';
import './NavigationBar.css';

const NavigationBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode', !isDarkMode);
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  const handleSearch = (searchTerm) => {
    console.log('Buscando:', searchTerm);
    // Aquí iría la lógica de búsqueda
  };

  const handleNextResult = () => {
    console.log('Siguiente resultado');
  };

  const handlePreviousResult = () => {
    console.log('Resultado anterior');
  };

  return (
    <div className={`navigation-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="navigation-bar">
        
        {/* Botón para cargar JSON */}
        <div className="nav-section">
          <Button 
            onClick={() => console.log('Cargar JSON')}
            title="Cargar archivo JSON"
          >
            <i className="bi bi-upload"></i>
            Cargar JSON
          </Button>
        </div>

        {/* Cuadro de búsqueda */}
        <div className="nav-section search-section">
          <SearchBox
            placeholder="Buscar..."
            onSearch={handleSearch}
            showNavigation={true}
            onNext={handleNextResult}
            onPrevious={handlePreviousResult}
          />
        </div>

        {/* Botones de control del mapa */}
        <div className="nav-section map-controls">
          <IconButton
            icon="bi bi-hand-index"
            onClick={() => console.log('Mover mapa')}
            title="Mover mapa"
          />
          <IconButton
            icon="bi bi-zoom-in"
            onClick={() => console.log('Zoom in')}
            title="Zoom +"
          />
          <IconButton
            icon="bi bi-zoom-out"
            onClick={() => console.log('Zoom out')}
            title="Zoom -"
          />
          <IconButton
            icon="bi bi-geo-alt"
            onClick={() => console.log('Centrar mapa')}
            title="Centrar mapa"
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
          <h4><i className="bi bi-info-square"></i> Detalles del Proyecto</h4>
          <p>Barra de navegación con componentes reutilizables</p>
          <ul>
            <li><i className="bi bi-filetype-json"></i> Carga archivos JSON</li>
            <li><i className="bi bi-search"></i> Búsqueda con navegación</li>
            <li><i className="bi bi-arrows-move"></i> Controles de mapa</li>
            <li><i className="bi bi-palette"></i> Modo claro/oscuro</li>
          </ul>
        </div>
      )}

      {/* Lienzo */}
      <div className="canvas-container">
        <canvas className="main-canvas"></canvas>
      </div>
    </div>
  );
};

export default NavigationBar;