// src/components/EntityRelationshipDiagram/EntityRelationshipDiagram.jsx
import React, { useCallback, useMemo, useEffect } from 'react';
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
const TableNode = ({ data }) => {
  return (
    <div style={{ 
      background: 'var(--panel-bg)', 
      border: '2px solid #0d6efd',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      width: '320px',
      fontFamily: 'Arial, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header de la tabla */}
      <div style={{
        background: '#0d6efd',
        color: 'white',
        padding: '12px 16px',
        fontWeight: 'bold',
        fontSize: '16px',
        borderBottom: '2px solid #0b5ed7'
      }}>
        <div>{data.label}</div>
        <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px', fontStyle: 'italic' }}>
          {data.identifier}
        </div>
      </div>
      
      {/* Descripción */}
      {data.description && (
        <div style={{
          padding: '8px 16px',
          background: 'rgba(13, 110, 253, 0.1)',
          borderBottom: '1px solid #ddd',
          fontSize: '12px',
          color: '#495057'
        }}>
          {data.description}
        </div>
      )}
      
      {/* Campos de la tabla - AHORA INCLUYENDO EL CAMPO ID */}
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
            {/* Handle para conexiones de entrada (solo para campos ID) */}
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
            
            {/* Handle para conexiones de salida (solo para campos de relación) */}
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
      
      {/* Footer con estadísticas */}
      <div style={{
        padding: '6px 16px',
        background: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
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
const DiagramContent = ({ tablesData, onZoomIn, onZoomOut, onCenterView }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // Función para agregar campo ID automáticamente a cada tabla
  const enhanceTablesData = useMemo(() => {
    if (!tablesData || tablesData.length === 0) return [];

    return tablesData.map(table => {
      // Verificar si ya existe un campo id
      const hasIdField = table.tableFields?.some(field => 
        field.identifier === 'id'
      );

      // Si no existe, agregar el campo id
      if (!hasIdField) {
        const idField = {
          id: `${table.id}-id`, // ID único para el campo
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
          position: -1, // Posición antes de todos los campos
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

      // Posición por defecto si no viene en los datos
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
          fields: fields
        },
      };
    });
  }, [enhanceTablesData]);

  // Preparar edges (conexiones) basadas en relaciones entre campos
  const initialEdges = useMemo(() => {
    if (!enhanceTablesData || enhanceTablesData.length === 0) return [];

    const edges = [];

    enhanceTablesData.forEach(table => {
      (table.tableFields || []).forEach(field => {
        if (field.fieldFormat === 'relation' && field.relationTableIdentifier) {
          // Encontrar la tabla destino
          const targetTable = enhanceTablesData.find(t => 
            t.identifier === field.relationTableIdentifier
          );
          
          if (targetTable) {
            // Encontrar el campo id en la tabla destino (que ahora siempre existe)
            const targetIdField = targetTable.tableFields.find(f => 
              f.identifier === 'id'
            );

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
                  stroke: '#000000', // Línea negra
                  strokeWidth: 3,
                },
                markerEnd: {
                  type: 'arrowclosed',
                  color: '#000000', // Flecha negra
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

  // Efecto para manejar los controles de zoom y centrado
  useEffect(() => {
    if (onZoomIn) {
      onZoomIn.current = () => {
        zoomIn({ duration: 300 });
      };
    }

    if (onZoomOut) {
      onZoomOut.current = () => {
        zoomOut({ duration: 300 });
      };
    }

    if (onCenterView) {
      onCenterView.current = () => {
        fitView({ padding: 0.3, duration: 800 });
      };
    }
  }, [zoomIn, zoomOut, fitView, onZoomIn, onZoomOut, onCenterView]);

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
      nodeTypes={nodeTypes}
      fitView
      attributionPosition="bottom-left"
      minZoom={0.1}
      maxZoom={2}
      connectionLineStyle={{ stroke: '#000000', strokeWidth: 2 }}
      proOptions={{ hideAttribution: true }}
    />
  );
};

// Componente principal que envuelve con ReactFlowProvider
const EntityRelationshipDiagram = ({ tablesData, onZoomIn, onZoomOut, onCenterView }) => {
  return (
    <div className="canvas-container">
      <ReactFlowProvider>
        <DiagramContent 
          tablesData={tablesData}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onCenterView={onCenterView}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default EntityRelationshipDiagram;