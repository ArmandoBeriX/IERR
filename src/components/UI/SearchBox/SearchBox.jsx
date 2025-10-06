// src/components/UI/SearchBox/SearchBox.jsx
import React, { useState } from 'react';
import './SearchBox.css';

const SearchBox = ({ 
  placeholder = "Buscar...",
  onSearch,
  showNavigation = false,
  onNext,
  onPrevious,
  className = '',
  ...props 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = () => {
    onSearch?.(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className={`search-box ${className}`}>
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          {...props}
        />
        <button className="search-button" onClick={handleSearch} title="Buscar">
          <i className="bi bi-search"></i>
        </button>
        
        {showNavigation && (
          <div className="search-navigation">
            <button className="nav-arrow" onClick={onPrevious} title="Resultado anterior">
              <i className="bi bi-chevron-up"></i>
            </button>
            <button className="nav-arrow" onClick={onNext} title="Resultado siguiente">
              <i className="bi bi-chevron-down"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBox;