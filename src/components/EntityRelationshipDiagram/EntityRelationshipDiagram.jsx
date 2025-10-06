// src/components/EntityRelationshipDiagram/EntityRelationshipDiagram.jsx
import React, { useCallback, useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Nodo personalizado para las tablas
const TableNode = ({ data, isHighlighted = false, isSearchResult = false }) => {
  const handleAddField = useCallback((tableId, tableName) => {
    console.log(`Agregar nuevo campo a la tabla: ${tableName} (ID: ${tableId})`);
    // Aquí puedes abrir un modal, mostrar un formulario, etc.
    alert(`Funcionalidad: Agregar nuevo campo a la tabla "${tableName}"\n\nEsta funcionalidad permitirá:\n• Agregar nuevos campos a la tabla\n• Definir tipo de dato\n• Configurar relaciones\n• Establecer restricciones`);
  }, []);

  // Determinar estilos basados en el estado de búsqueda
  const getNodeStyles = () => {
    const baseStyles = {
      background: 'var(--panel-bg)',
      border: '2px solid #0d6efd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '320px',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    };

    if (isSearchResult) {
      return {
        ...baseStyles,
        border: '3px solid #ffc107',
        boxShadow: '0 4px 20px rgba(255, 193, 7, 0.4)',
        background: 'rgba(255, 193, 7, 0.05)'
      };
    }

    if (isHighlighted) {
      return {
        ...baseStyles,
        border: '3px solid #0d6efd',
        boxShadow: '0 4px 20px rgba(13, 110, 253, 0.3)',
        background: 'rgba(13, 110, 253, 0.1)'
      };
    }

    return baseStyles;
  };

  const getHeaderStyles = () => {
    const baseStyles = {
      color: 'white',
      padding: '12px 16px',
      fontWeight: 'bold',
      fontSize: '16px',
      borderBottom: '2px solid #0b5ed7'
    };

    if (isSearchResult) {
      return {
        ...baseStyles,
        background: '#ffc107',
        borderBottom: '2px solid #e0a800'
      };
    }

    if (isHighlighted) {
      return {
        ...baseStyles,
        background: '#0b5ed7'
      };
    }

    return {
      ...baseStyles,
      background: '#0d6efd'
    };
  };

  return (
    <div style={getNodeStyles()}>
      {/* Header de la tabla */}
      <div style={getHeaderStyles()}>
        <div>{data.label}</div>
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px', fontStyle: 'italic' }}>
          {data.identifier}
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
      
      {/* Descripción */}
      {data.description && (
        <div style={{
          padding: '8px 16px',
          background: isSearchResult ? 'rgba(255, 193, 7, 0.1)' : 'rgba(13, 110, 253, 0.1)',
          borderBottom: '1px solid #ddd',
          fontSize: '12px',
          color: '#495057'
        }}>
          {data.description}
        </div>
      )}
      
      {/* Campos de la tabla */}
      <div style={{ maxHeight: '600px', overflow: 'visible' }}>
        {data.fields.map((field, index) => (
          <div
            key={field.id}
            style={{
              padding: '8px 16px',
              borderBottom: index < data.fields.length - 1 ? '1px solid #e9ecef' : 'none',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: field.isRelation ? 'rgba(255, 193, 7, 0.15)' : 
                         field.isPrimaryKey ? 'rgba(220, 53, 69, 0.1)' : 'transparent',
              borderLeft: field.isRelation ? '4px solid #ffc107' : 
                         field.isPrimaryKey ? '4px solid #dc3545' : 'none',
              minHeight: '36px',
              position: 'relative'
            }}
            title={
              field.isPrimaryKey ? `CLAVE PRIMARIA: ${field.name}` :
              field.isRelation 
                ? `RELACIÓN: ${field.name} → ${field.relationTableIdentifier}.id` 
                : `${field.name} (${field.format})${field.isRequired ? ' - REQUERIDO' : ''}`
            }
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

            <div style={{ 
              fontWeight: field.isPrimaryKey ? 'bold' : 'normal',
              color: field.isPrimaryKey ? '#dc3545' : (field.isRelation ? '#ffc107' : 'var(--text-color)'),
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {field.isPrimaryKey && <span style={{color: '#dc3545'}}>🔑</span>}
              {field.isRelation && <span style={{color: '#ffc107'}}>🔗</span>}
              {field.name}
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: field.isPrimaryKey ? '#dc3545' : (field.isRelation ? '#ffc107' : '#6c757d'),
              textAlign: 'right',
              minWidth: '80px',
              fontWeight: field.isPrimaryKey || field.isRelation ? 'bold' : 'normal'
            }}>
              {field.format}
              {field.isRequired && ' *'}
            </div>
          </div>
        ))}
      </div>

      {/* Botón para agregar campo */}
      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #e9ecef',
        background: '#f8f9fa'
      }}>
        <button
          onClick={() => handleAddField(data.tableId || data.identifier, data.label)}
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
          title={`Agregar nuevo campo a ${data.label}`}
        >
          <i className="bi bi-plus-circle" style={{ fontSize: '14px' }}></i>
          Agregar Campo
        </button>
      </div>
      
      {/* Footer con estadísticas */}
      <div style={{
        padding: '6px 16px',
        background: '#e9ecef',
        borderTop: '1px solid #dee2e6',
        fontSize: '11px',
        color: '#6c757d',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>{data.fields.length} campos</span>
        <span>{data.fields.filter(f => f.isRelation).length} relaciones</span>
      </div>
    </div>
  );
};

const nodeTypes = {
  tableNode: TableNode,
};

// Componente interno que usa los hooks de React Flow
const DiagramContent = forwardRef(({ tablesData }, ref) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  // Estados para búsqueda y modo
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [isDraggable, setIsDraggable] = useState(true);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Función para agregar campo ID automáticamente a cada tabla
  const enhanceTablesData = useMemo(() => {
    if (!tablesData || tablesData.length === 0) return [];
    return tablesData.map(table => {
      const hasIdField = table.tableFields?.some(field => field.identifier === 'id');
      if (!hasIdField) {
        const idField = {
          id: `${table.id}-id`,
          tableId: table.id,
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
          position: -1,
          description: 'Clave primaria de la tabla',
          storeData: {},
          history: false
        };
        return {
          ...table,
          tableFields: [idField, ...(table.tableFields || [])]
        };
      }
      return table;
    });
  }, [tablesData]);

  // Preparar nodos para React Flow
  const initialNodes = useMemo(() => {
    if (!enhanceTablesData || enhanceTablesData.length === 0) return [];
    return enhanceTablesData.map((table, index) => {
      const fields = (table.tableFields || []).map(field => {
        const isRelation = field.fieldFormat === 'relation';
        const isPrimaryKey = field.identifier === 'id';
        return {
          id: field.id?.toString() || `field-${table.id}-${field.identifier}`,
          name: field.name || field.identifier,
          identifier: field.identifier,
          format: field.fieldFormat,
          isRequired: field.isRequired,
          isRelation: isRelation,
          relationTableIdentifier: field.relationTableIdentifier,
          isPrimaryKey: isPrimaryKey,
          description: field.description,
          multiple: field.multiple
        };
      });

      const position = {
        x: table.px || (index % 3) * 400 + 50,
        y: table.py || Math.floor(index / 3) * 450 + 50
      };

      return {
        id: table.id?.toString() || `table-${table.identifier}`,
        type: 'tableNode',
        position: position,
        data: {
          label: table.name || table.identifier,
          identifier: table.identifier,
          description: table.description,
          fields: fields,
          tableId: table.id
        },
      };
    });
  }, [enhanceTablesData]);

  // Preparar edges (conexiones)
  const initialEdges = useMemo(() => {
    if (!enhanceTablesData || enhanceTablesData.length === 0) return [];
    const edges = [];
    enhanceTablesData.forEach(table => {
      (table.tableFields || []).forEach(field => {
        if (field.fieldFormat === 'relation' && field.relationTableIdentifier) {
          const targetTable = enhanceTablesData.find(t => t.identifier === field.relationTableIdentifier);
          if (targetTable) {
            const targetIdField = targetTable.tableFields.find(f => f.identifier === 'id');
            if (targetIdField) {
              const sourceFieldId = field.id?.toString() || `field-${table.id}-${field.identifier}`;
              const targetFieldId = targetIdField.id?.toString() || `field-${targetTable.id}-id`;
              const edgeId = `edge-${table.id}-${field.identifier}-to-${targetTable.id}-id`;
              
              edges.push({
                id: edgeId,
                source: table.id.toString(),
                target: targetTable.id.toString(),
                sourceHandle: `source-${sourceFieldId}`,
                targetHandle: `target-${targetFieldId}`,
                type: 'smoothstep',
                style: { 
                  stroke: '#000000',
                  strokeWidth: 3,
                },
                markerEnd: {
                  type: 'arrowclosed',
                  color: '#000000',
                  width: 20,
                  height: 20,
                },
                data: {
                  sourceField: field.name,
                  targetField: 'ID',
                  relationType: field.multiple ? 'one-to-many' : 'one-to-one',
                  sourceTable: table.identifier,
                  targetTable: targetTable.identifier
                }
              });
            }
          }
        }
      });
    });
    return edges;
  }, [enhanceTablesData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Actualizar nodes y edges cuando cambien los datos iniciales
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onInit = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 800 });
    }, 500);
  }, [fitView]);

  // Funcionalidad de búsqueda corregida - solo resalta sin hacer zoom
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setSearchResults([]);
      setCurrentResultIndex(-1);
      setHighlightedNode(null);
      return;
    }

    const results = nodes.filter(node => 
      node.data.label.toLowerCase().includes(term.toLowerCase()) ||
      node.data.identifier.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults(results);
    setCurrentResultIndex(results.length > 0 ? 0 : -1);
    
    if (results.length > 0) {
      // Solo resaltamos el primer resultado, no hacemos zoom
      setHighlightedNode(results[0].id);
    } else {
      setHighlightedNode(null);
    }
  }, [nodes]);

  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    setHighlightedNode(searchResults[nextIndex].id);
    
    // Solo resaltamos, no hacemos zoom
  }, [searchResults, currentResultIndex]);

  const goToPreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);
    setHighlightedNode(searchResults[prevIndex].id);
    
    // Solo resaltamos, no hacemos zoom
  }, [searchResults, currentResultIndex]);

  // Funcionalidades expuestas via ref
  useImperativeHandle(ref, () => ({
    // Zoom functions
    zoomIn: () => zoomIn({ duration: 300 }),
    zoomOut: () => zoomOut({ duration: 300 }),
    centerView: () => fitView({ padding: 0.3, duration: 800 }),
    
    // Search functions - corregidas
    handleSearch,
    goToNextResult,
    goToPreviousResult,
    
    // Mode functions
    toggleDraggable: () => setIsDraggable(!isDraggable),
    isDraggable: isDraggable,

    // Información de búsqueda actual
    getSearchInfo: () => ({
      term: searchTerm,
      results: searchResults.length,
      currentIndex: currentResultIndex,
      hasResults: searchResults.length > 0
    }),

    // Función para agregar campo
    addFieldToTable: (tableId, fieldData) => {
      console.log(`Agregando campo a tabla ${tableId}:`, fieldData);
    }
  }));

  // Actualizar nodeTypes con nodos resaltados para búsqueda
  const customNodeTypes = useMemo(() => ({
    tableNode: (props) => (
      <TableNode 
        {...props} 
        isHighlighted={props.id === highlightedNode}
        isSearchResult={searchResults.some(result => result.id === props.id)}
      />
    )
  }), [highlightedNode, searchResults]);

  if (!tablesData || tablesData.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-diagram-3" style={{fontSize: '4rem', opacity: 0.5}}></i>
        <h3>No hay datos para mostrar</h3>
        <p>Carga un archivo JSON o TXT con la definición de tablas para ver el diagrama</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      nodeTypes={customNodeTypes}
      nodesDraggable={isDraggable}
      fitView
      attributionPosition="bottom-left"
      minZoom={0.1}
      maxZoom={2}
      connectionLineStyle={{ stroke: '#000000', strokeWidth: 2 }}
      proOptions={{ hideAttribution: true }}
    />
  );
});

// Componente principal que envuelve con ReactFlowProvider
const EntityRelationshipDiagram = forwardRef(({ tablesData }, ref) => {
  return (
    <div className="canvas-container">
      <ReactFlowProvider>
        <DiagramContent 
          tablesData={tablesData}
          ref={ref}
        />
      </ReactFlowProvider>
    </div>
  );
});

export default EntityRelationshipDiagram;