// src/components/EntityRelationshipDiagram/TableNode.jsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import FieldNode from './FieldNode';

const TableNode = ({ data, isHighlighted = false, isSearchResult = false, onEditField, onAddField }) => {
  const handleAddFieldClick = (e) => {
    e.stopPropagation();
    console.log('Agregando campo a tabla:', data.tableId);
    onAddField(data.tableId, null, data.label);
  };

  return (
    <div style={{ 
      background: isSearchResult ? 'rgba(255, 193, 7, 0.05)' : (isHighlighted ? 'rgba(13, 110, 253, 0.1)' : 'var(--panel-bg)'), 
      border: isSearchResult ? '3px solid #ffc107' : (isHighlighted ? '3px solid #0d6efd' : '2px solid #0d6efd'),
      borderRadius: '8px',
      boxShadow: isSearchResult ? '0 4px 20px rgba(255, 193, 7, 0.4)' : (isHighlighted ? '0 4px 20px rgba(13, 110, 253, 0.3)' : '0 4px 12px rgba(0,0,0,0.15)'),
      width: '320px',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    }}>
      {/* Header de la tabla */}
      <TableHeader 
        label={data.label} 
        identifier={data.identifier}
        isSearchResult={isSearchResult}
        description={data.description}
      />
      
      {/* Campos de la tabla */}
      <TableFields 
        fields={data.fields}
        onEditField={onEditField}
        tableId={data.tableId}
        tableLabel={data.label}
      />

      {/* Botón para agregar campo */}
      <AddFieldButton 
        onAddField={handleAddFieldClick}
        tableLabel={data.label}
      />
      
      {/* Footer con estadísticas */}
      <TableFooter fields={data.fields} />
    </div>
  );
};

// Componente para el Header de la tabla
const TableHeader = ({ label, identifier, isSearchResult, description }) => (
  <div style={{
    background: isSearchResult ? '#ffc107' : '#0d6efd',
    color: 'white',
    padding: '12px 16px',
    fontWeight: 'bold',
    fontSize: '16px',
    borderBottom: '2px solid #0b5ed7'
  }}>
    <div>{label}</div>
    <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px', fontStyle: 'italic' }}>
      {identifier}
    </div>
    {isSearchResult && (
      <div style={{ 
        fontSize: '10px', 
        marginTop: '2px',
        background: 'rgba(255,255,255,0.2)',
        padding: '2px 6px',
        borderRadius: '3px',
        display: 'inline-block'
      }}>
        🔍 Resultado de búsqueda
      </div>
    )}
  </div>
);

// Componente para la Descripción de la tabla
const TableDescription = ({ description, isSearchResult }) => (
  description && (
    <div style={{
      padding: '8px 16px',
      background: isSearchResult ? 'rgba(255, 193, 7, 0.1)' : 'rgba(13, 110, 253, 0.1)',
      borderBottom: '1px solid #ddd',
      fontSize: '12px',
      color: '#495057'
    }}>
      {description}
    </div>
  )
);

// Componente para los Campos de la tabla
const TableFields = ({ fields, onEditField, tableId, tableLabel }) => (
  <div style={{ maxHeight: '600px', overflow: 'visible' }}>
    {fields.map((field, index) => (
      <FieldNode
        key={field.id}
        field={field}
        index={index}
        totalFields={fields.length}
        onEditField={onEditField}
        tableId={tableId}
        tableLabel={tableLabel}
      />
    ))}
  </div>
);

// Componente para el Botón de Agregar Campo
const AddFieldButton = ({ onAddField, tableLabel }) => (
  <div style={{
    padding: '8px 16px',
    borderTop: '1px solid #e9ecef',
    background: '#f8f9fa'
  }}>
    <button
      onClick={onAddField}
      style={{
        width: '100%',
        padding: '8px 12px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: '500',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}
      onMouseOver={(e) => {
        e.target.style.backgroundColor = '#218838';
        e.target.style.transform = 'translateY(-1px)';
        e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
      }}
      onMouseOut={(e) => {
        e.target.style.backgroundColor = '#28a745';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
      title={`Agregar nuevo campo a ${tableLabel}`}
    >
      <i className="bi bi-plus-circle" style={{ fontSize: '14px' }}></i>
      Agregar Campo
    </button>
  </div>
);

// Componente para el Footer de la tabla
const TableFooter = ({ fields }) => (
  <div style={{
    padding: '6px 16px',
    background: '#e9ecef',
    borderTop: '1px solid #dee2e6',
    fontSize: '11px',
    color: '#6c757d',
    display: 'flex',
    justifyContent: 'space-between'
  }}>
    <span>{fields.length} campos</span>
    <span>{fields.filter(f => f.isRelation).length} relaciones</span>
  </div>
);

export default TableNode;