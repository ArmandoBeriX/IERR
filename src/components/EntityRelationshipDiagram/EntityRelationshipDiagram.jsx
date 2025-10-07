// src/components/EntityRelationshipDiagram/EntityRelationshipDiagram.jsx
import React, { useCallback, useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import TableNode from './TableNode';

// CORRECCIÓN: Mover nodeTypes fuera del componente
const nodeTypes = {
  tableNode: TableNode,
};

// Componente interno que usa los hooks de React Flow
const DiagramContent = forwardRef(({ tablesData, onTablesDataChange, onEditField, onAddField, isDraggable }, ref) => {
  const { zoomIn, zoomOut, fitView, getNode, setCenter } = useReactFlow();
  
  // Estados para búsqueda
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // CORRECCIÓN: Usar useMemo para customNodeTypes
  const customNodeTypes = useMemo(() => ({
    tableNode: (props) => (
      <TableNode 
        {...props} 
        isHighlighted={props.id === highlightedNode}
        isSearchResult={searchResults.some(result => result.id === props.id)}
        onEditField={onEditField}
        onAddField={onAddField}
      />
    )
  }), [highlightedNode, searchResults, onEditField, onAddField]);

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
    console.log('Actualizando nodos y edges con nuevos datos:', initialNodes.length, initialEdges.length);
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

  // Navegación suave a un nodo (sin cambiar zoom)
  const smoothNavigateToNode = useCallback((nodeId) => {
    const node = getNode(nodeId);
    if (node) {
      const { position, width, height } = node;
      const x = position.x + (width || 320) / 2;
      const y = position.y + (height || 200) / 2;
      
      setCenter(x, y, {
        duration: 200,
        zoom: undefined // Mantiene el zoom actual
      });
    }
  }, [getNode, setCenter]);

  // Funcionalidad de búsqueda con navegación suave
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
      setHighlightedNode(results[0].id);
      smoothNavigateToNode(results[0].id);
    } else {
      setHighlightedNode(null);
    }
  }, [nodes, smoothNavigateToNode]);

  const goToNextResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const nextIndex = (currentResultIndex + 1) % searchResults.length;
    setCurrentResultIndex(nextIndex);
    setHighlightedNode(searchResults[nextIndex].id);
    smoothNavigateToNode(searchResults[nextIndex].id);
  }, [searchResults, currentResultIndex, smoothNavigateToNode]);

  const goToPreviousResult = useCallback(() => {
    if (searchResults.length === 0) return;
    
    const prevIndex = (currentResultIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentResultIndex(prevIndex);
    setHighlightedNode(searchResults[prevIndex].id);
    smoothNavigateToNode(searchResults[prevIndex].id);
  }, [searchResults, currentResultIndex, smoothNavigateToNode]);

  // Funcionalidades expuestas via ref
  useImperativeHandle(ref, () => ({
    // Zoom functions
    zoomIn: () => zoomIn({ duration: 300 }),
    zoomOut: () => zoomOut({ duration: 300 }),
    centerView: () => fitView({ padding: 0.3, duration: 800 }),
    
    // Search functions
    handleSearch,
    goToNextResult,
    goToPreviousResult,

    // Información de búsqueda actual
    getSearchInfo: () => ({
      term: searchTerm,
      results: searchResults.length,
      currentIndex: currentResultIndex,
      hasResults: searchResults.length > 0
    })
  }));

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
      selectNodesOnDrag={false}
    />
  );
});

// Componente principal que envuelve con ReactFlowProvider
const EntityRelationshipDiagram = forwardRef(({ tablesData, onTablesDataChange, onEditField, onAddField, isDraggable }, ref) => {
  return (
    <div className="canvas-container">
      <ReactFlowProvider>
        <DiagramContent 
          tablesData={tablesData}
          onTablesDataChange={onTablesDataChange}
          onEditField={onEditField}
          onAddField={onAddField}
          isDraggable={isDraggable}
          ref={ref}
        />
      </ReactFlowProvider>
    </div>
  );
});

export default EntityRelationshipDiagram;