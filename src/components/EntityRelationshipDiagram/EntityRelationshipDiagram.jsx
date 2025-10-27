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
const DiagramContent = forwardRef(({ tablesData, onTablesDataChange, onEditField, onAddField, onEditEntity, isDraggable }, ref) => {
  const { zoomIn, zoomOut, fitView, getNode, setCenter, getZoom, getViewport } = useReactFlow();
  
  // Estados para búsqueda
  const [searchResults, setSearchResults] = useState([]);
  const [currentResultIndex, setCurrentResultIndex] = useState(-1);
  const [highlightedNode, setHighlightedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Referencia a la instancia de React Flow
  const reactFlowInstance = useReactFlow();

  // CORRECCIÓN: Usar useMemo para customNodeTypes
  const customNodeTypes = useMemo(() => ({
    tableNode: (props) => (
      <TableNode 
        {...props} 
        isHighlighted={props.id === highlightedNode}
        isSearchResult={searchResults.some(result => result.id === props.id)}
        onEditField={onEditField}
        onAddField={onAddField}
        onEditEntity={onEditEntity}
      />
    )
  }), [highlightedNode, searchResults, onEditField, onAddField, onEditEntity]);

  // CORRECCIÓN: Función para guardar posiciones en localStorage
  const saveNodePositions = useCallback((nodes) => {
    try {
      const positions = {};
      nodes.forEach(node => {
        positions[node.id] = {
          x: node.position.x,
          y: node.position.y
        };
      });
      localStorage.setItem('erDiagramNodePositions', JSON.stringify(positions));
      console.log('💾 Posiciones guardadas:', positions);
    } catch (error) {
      console.error('❌ Error guardando posiciones:', error);
    }
  }, []);

  // CORRECCIÓN: Función para cargar posiciones desde localStorage
  const loadNodePositions = useCallback(() => {
    try {
      const savedPositions = localStorage.getItem('erDiagramNodePositions');
      return savedPositions ? JSON.parse(savedPositions) : {};
    } catch (error) {
      console.error('❌ Error cargando posiciones:', error);
      return {};
    }
  }, []);

  // Función para agregar campo ID automáticamente a cada tabla
  const enhanceTablesData = useMemo(() => {
    if (!tablesData || tablesData.length === 0) return [];
    
    // CORRECCIÓN: Cargar posiciones guardadas
    const savedPositions = loadNodePositions();
    
    return tablesData.map((table, index) => {
      const hasIdField = table.tableFields?.some(field => field.identifier === 'id');
      
      // CORRECCIÓN: Usar posición guardada o posición del archivo o posición por defecto
      const tableId = table.id?.toString() || `table-${table.identifier}`;
      const savedPosition = savedPositions[tableId];
      
      let position;
      if (savedPosition) {
        // Usar posición guardada
        position = savedPosition;
      } else if (table.px !== undefined && table.py !== undefined) {
        // Usar posición del archivo
        position = { x: table.px, y: table.py };
      } else {
        // Usar posición por defecto
        position = {
          x: (index % 3) * 400 + 50,
          y: Math.floor(index / 3) * 450 + 50
        };
      }

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
          position: 0,
          description: 'Clave primaria de la tabla',
          storeData: {},
          history: false
        };
        return {
          ...table,
          tableFields: [idField, ...(table.tableFields || [])],
          // CORRECCIÓN: Incluir posición en los datos de la tabla
          px: position.x,
          py: position.y
        };
      }
      return {
        ...table,
        // CORRECCIÓN: Incluir posición en los datos de la tabla
        px: position.x,
        py: position.y
      };
    });
  }, [tablesData, loadNodePositions]);

  // Preparar nodos para React Flow - CORRECCIÓN CRÍTICA
  const initialNodes = useMemo(() => {
    if (!enhanceTablesData || enhanceTablesData.length === 0) return [];
    
    console.log('🔄 Preparando nodos con datos:', enhanceTablesData);
    
    return enhanceTablesData.map((table) => {
      const fields = (table.tableFields || []).map(field => {
        const isRelation = field.fieldFormat === 'relation';
        const isPrimaryKey = field.identifier === 'id';
        
        // CORRECCIÓN CRÍTICA: Pasar TODOS los datos del campo, incluyendo storeData completo
        const fieldData = {
          id: field.id?.toString() || `field-${table.id}-${field.identifier}`,
          name: field.name || field.identifier,
          identifier: field.identifier,
          format: field.fieldFormat,
          isRequired: field.isRequired,
          isRelation: isRelation,
          relationTableIdentifier: field.relationTableIdentifier,
          isPrimaryKey: isPrimaryKey,
          description: field.description,
          multiple: field.multiple,
          // CORRECCIÓN: Pasar storeData COMPLETO
          storeData: field.storeData || {},
          // CORRECCIÓN: Pasar todos los campos adicionales
          isEditable: field.isEditable,
          isVisible: field.isVisible,
          history: field.history,
          default: field.default,
          relationQuery: field.relationQuery || [],
          // CORRECCIÓN: Pasar el tableId original para referencia
          originalTableId: field.tableId
        };

        console.log(`📦 Campo "${field.name}" - StoreData:`, fieldData.storeData);
        return fieldData;
      });

      // CORRECCIÓN: Usar posición de enhanceTablesData
      const position = {
        x: table.px || 0,
        y: table.py || 0
      };

      // CORRECCIÓN CRÍTICA: Asegurar que tableId se pase correctamente
      const nodeId = table.id?.toString() || `table-${table.identifier}`;
      
      console.log(`📊 Creando nodo para tabla: ${table.name} (ID: ${table.id}, NodeID: ${nodeId})`);

      return {
        id: nodeId,
        type: 'tableNode',
        position: position,
        data: {
          label: table.name || table.identifier,
          identifier: table.identifier,
          description: table.description,
          fields: fields,
          // CORRECCIÓN CRÍTICA: Pasar tableId como número, no como string
          tableId: table.id, // ← ESTA ES LA CLAVE
          tableIdentifier: table.identifier
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

  // CORRECCIÓN: Manejar cambios en los nodos para guardar posiciones
  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    
    // Guardar posiciones cuando se muevan los nodos
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        // Actualizar la posición en el estado local
        setNodes(nds => {
          const updatedNodes = nds.map(node => 
            node.id === change.id 
              ? { ...node, position: change.position } 
              : node
          );
          // Guardar posiciones después de actualizar
          setTimeout(() => saveNodePositions(updatedNodes), 0);
          return updatedNodes;
        });
      }
    });
  }, [onNodesChange, setNodes, saveNodePositions]);

  // CORRECCIÓN: También guardar posiciones cuando se arrastren nodos
  const onNodeDragStop = useCallback((event, node) => {
    console.log('📍 Nodo arrastrado a posición:', node.position);
    saveNodePositions(nodes);
  }, [nodes, saveNodePositions]);

  // Actualizar nodes y edges cuando cambien los datos iniciales
  useEffect(() => {
    console.log('🔄 Actualizando nodos y edges con nuevos datos');
    console.log('Nodos iniciales:', initialNodes.length);
    console.log('Edges iniciales:', initialEdges.length);
    
    setNodes(initialNodes);
    setEdges(initialEdges);
    
    // CORRECCIÓN: Guardar posiciones iniciales
    if (initialNodes.length > 0) {
      setTimeout(() => saveNodePositions(initialNodes), 100);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges, saveNodePositions]);

  // Agregar useEffect para depurar cambios
  useEffect(() => {
    console.log('📊 TablesData actualizado:', tablesData?.length, 'tablas');
    console.log('📊 Nodos actuales:', nodes.length);
    console.log('📊 Edges actuales:', edges.length);
  }, [tablesData, nodes, edges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onInit = useCallback(() => {
    setTimeout(() => {
      fitView({ padding: 0.3, duration: 800 });
    }, 500);
  }, [fitView]);

  // CORRECCIÓN: Navegación suave a un nodo MANTENIENDO el zoom actual
  const smoothNavigateToNode = useCallback((nodeId) => {
    const node = getNode(nodeId);
    if (node) {
      const { position, width, height } = node;
      const x = position.x + (width || 320) / 2;
      const y = position.y + (height || 200) / 2;
      const currentZoom = getZoom(); // OBTENER el zoom actual
      
      console.log(`🧭 Navegando a nodo ${nodeId} con zoom actual: ${currentZoom}`);
      
      setCenter(x, y, {
        duration: 800, // Un poco más lento para mejor experiencia
        zoom: currentZoom // MANTENER el zoom actual
      });
    }
  }, [getNode, setCenter, getZoom]);

  // NUEVA FUNCIÓN: Enfocar nodo con resaltado
  const highlightNode = useCallback((nodeId) => {
    console.log(`🌟 Resaltando nodo: ${nodeId}`);
    setHighlightedNode(nodeId);
    
    // Quitar el resaltado después de 2 segundos
    setTimeout(() => {
      setHighlightedNode(null);
    }, 2000);
  }, []);

  // CORRECCIÓN: Función de búsqueda actualizada
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

  // CORRECCIÓN: Navegación entre resultados manteniendo zoom
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

  // Función centerView que sigue haciendo fitView (ajusta el zoom)
  const handleCenterView = useCallback(() => {
    fitView({ padding: 0.3, duration: 800 });
  }, [fitView]);

  // NUEVA FUNCIÓN: Enfocar entidad específica (para nueva entidad)
  const focusEntity = useCallback((entityId) => {
    const nodeId = entityId.toString();
    console.log(`🎯 Enfocando entidad específica: ${nodeId}`);
    
    // Navegar suavemente al nodo
    smoothNavigateToNode(nodeId);
    
    // Resaltar el nodo
    highlightNode(nodeId);
  }, [smoothNavigateToNode, highlightNode]);

  // Funcionalidades expuestas via ref
  useImperativeHandle(ref, () => ({
    // Zoom functions
    zoomIn: () => zoomIn({ duration: 300 }),
    zoomOut: () => zoomOut({ duration: 300 }),
    centerView: handleCenterView,
    
    // Search functions
    handleSearch,
    goToNextResult,
    goToPreviousResult,

    // NUEVAS FUNCIONES: Enfoque automático
    smoothNavigateToNode,
    highlightNode,
    focusEntity,

    // Información de búsqueda actual
    getSearchInfo: () => ({
      term: searchTerm,
      results: searchResults.length,
      currentIndex: currentResultIndex,
      hasResults: searchResults.length > 0
    }),

    // NUEVA FUNCIÓN: Obtener viewport actual
    getViewport: () => {
      const viewport = getViewport();
      return viewport || { x: 0, y: 0, zoom: 1 };
    }
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
      onNodesChange={handleNodesChange} // CORRECCIÓN: Usar manejador personalizado
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onInit={onInit}
      onNodeDragStop={onNodeDragStop} // CORRECCIÓN: Capturar fin de arrastre
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
const EntityRelationshipDiagram = forwardRef(({ tablesData, onTablesDataChange, onEditField, onAddField, onEditEntity, isDraggable }, ref) => {
  return (
    <div className="canvas-container">
      <ReactFlowProvider>
        <DiagramContent 
          tablesData={tablesData}
          onTablesDataChange={onTablesDataChange}
          onEditField={onEditField}
          onAddField={onAddField}
          onEditEntity={onEditEntity}
          isDraggable={isDraggable}
          ref={ref}
        />
      </ReactFlowProvider>
    </div>
  );
});

export default EntityRelationshipDiagram;