// src/components/EntityRelationshipDiagram/FieldNode.jsx
import React from 'react';
import { Handle, Position } from '@xyflow/react';

const FieldNode = ({ field, index, totalFields, onEditField, tableId, tableLabel }) => {
  // CORRECCIÓN: Verificar que tableId existe
  console.log('📝 FieldNode - Datos:', { 
    tableId, 
    fieldId: field.id, 
    fieldName: field.name 
  });

  const handleFieldClick = (e) => {
    e.stopPropagation();
    console.log('✏️ Editando campo:', field.name, 'en tabla:', tableId);
    
    // CORRECCIÓN: Verificar que tableId existe antes de llamar
    if (!tableId) {
      console.error('❌ FieldNode - tableId no definido al editar campo');
      return;
    }
    
    onEditField(tableId, field, tableLabel);
  };

  const getFieldBackground = () => {
    if (field.isRelation) return 'rgba(255, 193, 7, 0.15)';
    if (field.isPrimaryKey) return 'rgba(220, 53, 69, 0.1)';
    return 'transparent';
  };

  const getBorderLeft = () => {
    if (field.isRelation) return '4px solid #ffc107';
    if (field.isPrimaryKey) return '4px solid #dc3545';
    return 'none';
  };

  const getFieldColor = () => {
    if (field.isPrimaryKey) return '#dc3545';
    if (field.isRelation) return '#ffc107';
    return 'var(--text-color)';
  };

  const getFieldIcon = () => {
    if (field.isPrimaryKey) return <span style={{color: '#dc3545'}}>🔑</span>;
    if (field.isRelation) return <span style={{color: '#ffc107'}}>🔗</span>;
    return null;
  };

  const getFieldTitle = () => {
    const fieldType = field.isPrimaryKey ? 'CLAVE PRIMARIA' : 
                     field.isRelation ? 'RELACIÓN' : 'CAMPO';
    return `Click para editar\n${fieldType}: ${field.name} (${field.format})${field.isRequired ? ' - REQUERIDO' : ''}`;
  };

  // CORRECCIÓN: Mostrar error si tableId no está definido
  if (!tableId) {
    return (
      <div
        style={{
          padding: '8px 16px',
          borderBottom: index < totalFields - 1 ? '1px solid #e9ecef' : 'none',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(220, 53, 69, 0.1)',
          borderLeft: '4px solid #dc3545',
          minHeight: '36px',
          position: 'relative',
          cursor: 'not-allowed',
        }}
        title="Error: No se pudo identificar la tabla"
      >
        <div style={{ color: '#dc3545', flex: 1 }}>
          ⚠️ {field.name}
        </div>
        <div style={{ fontSize: '11px', color: '#dc3545' }}>
          Error
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '8px 16px',
        borderBottom: index < totalFields - 1 ? '1px solid #e9ecef' : 'none',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: getFieldBackground(),
        borderLeft: getBorderLeft(),
        minHeight: '36px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onClick={handleFieldClick}
      title={getFieldTitle()}
    >
      {/* Handle para conexiones de entrada */}
      {field.isPrimaryKey && (
        <Handle
          type="target"
          position={Position.Left}
          id={`target-${field.id}`}
          style={{
            background: '#dc3545',
            border: '2px solid white',
            width: 12,
            height: 12,
            left: -6
          }}
        />
      )}
      
      {/* Handle para conexiones de salida */}
      {field.isRelation && (
        <Handle
          type="source"
          position={Position.Right}
          id={`source-${field.id}`}
          style={{
            background: '#ffc107',
            border: '2px solid white',
            width: 12,
            height: 12,
            right: -6
          }}
        />
      )}

      {/* Contenido del campo */}
      <FieldContent 
        field={field}
        fieldColor={getFieldColor()}
        fieldIcon={getFieldIcon()}
      />
    </div>
  );
};

// Componente para el contenido del campo
const FieldContent = ({ field, fieldColor, fieldIcon }) => (
  <>
    <div style={{ 
      fontWeight: field.isPrimaryKey ? 'bold' : 'normal',
      color: fieldColor,
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }}>
      {fieldIcon}
      {field.name}
    </div>
    <FieldFormat 
      field={field}
      fieldColor={fieldColor}
    />
  </>
);

// Componente para el formato del campo
const FieldFormat = ({ field, fieldColor }) => (
  <div style={{ 
    fontSize: '11px', 
    color: fieldColor,
    textAlign: 'right',
    minWidth: '80px',
    fontWeight: field.isPrimaryKey || field.isRelation ? 'bold' : 'normal'
  }}>
    {field.format}
    {field.isRequired && ' *'}
  </div>
);

export default FieldNode;