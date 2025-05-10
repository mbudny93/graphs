import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './GraphCanvas.css';

const GraphCanvas = forwardRef(({ mode, setSelectedElement }, ref) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [draggedNode, setDraggedNode] = useState(null);
  const [connectStartNode, setConnectStartNode] = useState(null);
  const [pendingConnection, setPendingConnection] = useState(false);
  const canvasRef = useRef(null);

  // Node radius
  const NODE_RADIUS = 30;

  // Handle canvas click based on the current mode
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (mode) {
      case 'add':
        addNode(x, y);
        break;
      case 'select':
        selectNodeAtPosition(x, y);
        break;
      case 'connect':
        handleConnectClick(x, y);
        break;
      case 'delete':
        deleteNodeAtPosition(x, y);
        break;
      default:
        break;
    }
  };
  
  // Handle clicks in connect mode
  const handleConnectClick = (x, y) => {
    const node = findNodeAtPosition(x, y);
    
    if (node) {
      if (!pendingConnection) {
        // First node click - start connection
        setConnectStartNode(node);
        setPendingConnection(true);
      } else if (connectStartNode && node.id !== connectStartNode.id) {
        // Second node click - complete connection if it's a different node
        // Check if this edge already exists
        const edgeExists = edges.some(
          edge => 
            (edge.source === connectStartNode.id && edge.target === node.id) ||
            (edge.source === node.id && edge.target === connectStartNode.id)
        );
        
        if (!edgeExists) {
          const newEdge = {
            id: `${connectStartNode.id}-${node.id}`,
            source: connectStartNode.id,
            target: node.id,
            properties: { label: `Edge ${edges.length + 1}` }
          };
          setEdges([...edges, newEdge]);
        }
        
        // Reset connection state
        setConnectStartNode(null);
        setPendingConnection(false);
      } else if (connectStartNode && node.id === connectStartNode.id) {
        // Clicked the same node twice, cancel the connection
        setConnectStartNode(null);
        setPendingConnection(false);
      }
    } else {
      // Clicked on empty space, cancel the connection
      setConnectStartNode(null);
      setPendingConnection(false);
    }
  };

  // Add a new node at the specified position
  const addNode = (x, y) => {
    const newNode = {
      id: Date.now().toString(),
      x,
      y,
      properties: { label: `Node ${nodes.length + 1}` }
    };
    setNodes([...nodes, newNode]);
  };

  // Find a node at the specified position
  const findNodeAtPosition = (x, y) => {
    return nodes.find(node => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= NODE_RADIUS;
    });
  };

  // Select a node at the specified position
  const selectNodeAtPosition = (x, y) => {
    const node = findNodeAtPosition(x, y);
    if (node) {
      setSelectedNode(node);
      setSelectedEdge(null);
      setSelectedElement({ type: 'node', data: node });
    } else {
      // Check if an edge was clicked
      const edge = findEdgeAtPosition(x, y);
      if (edge) {
        setSelectedNode(null);
        setSelectedEdge(edge);
        setSelectedElement({ type: 'edge', data: edge });
      } else {
        setSelectedNode(null);
        setSelectedEdge(null);
        setSelectedElement(null);
      }
    }
  };

  // Find an edge at the specified position
  const findEdgeAtPosition = (x, y) => {
    // Simple edge detection - check if the point is close to the line
    return edges.find(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (!sourceNode || !targetNode) return false;
      
      // Calculate distance from point to line
      const A = x - sourceNode.x;
      const B = y - sourceNode.y;
      const C = targetNode.x - sourceNode.x;
      const D = targetNode.y - sourceNode.y;
      
      const dot = A * C + B * D;
      const len_sq = C * C + D * D;
      let param = -1;
      
      if (len_sq !== 0) param = dot / len_sq;
      
      let xx, yy;
      
      if (param < 0) {
        xx = sourceNode.x;
        yy = sourceNode.y;
      } else if (param > 1) {
        xx = targetNode.x;
        yy = targetNode.y;
      } else {
        xx = sourceNode.x + param * C;
        yy = sourceNode.y + param * D;
      }
      
      const dx = x - xx;
      const dy = y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      return distance < 10; // 10px threshold for edge selection
    });
  };

  // Delete a node at the specified position
  const deleteNodeAtPosition = (x, y) => {
    const node = findNodeAtPosition(x, y);
    if (node) {
      // Remove the node
      setNodes(nodes.filter(n => n.id !== node.id));
      
      // Remove all edges connected to this node
      setEdges(edges.filter(edge => edge.source !== node.id && edge.target !== node.id));
      
      if (selectedNode && selectedNode.id === node.id) {
        setSelectedNode(null);
        setSelectedElement(null);
      }
    }
  };

  // Handle mouse down for node dragging
  const handleMouseDown = (e) => {
    if (mode === 'select') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const node = findNodeAtPosition(x, y);
      if (node) {
        setDraggedNode(node);
      }
    }
  };

  // Handle mouse move for node dragging
  const handleMouseMove = (e) => {
    if (mode === 'select' && draggedNode) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update the node position
      setNodes(nodes.map(node => {
        if (node.id === draggedNode.id) {
          return { ...node, x, y };
        }
        return node;
      }));
      
      // If this node is selected, update the selected node as well
      if (selectedNode && selectedNode.id === draggedNode.id) {
        setSelectedNode({ ...selectedNode, x, y });
        setSelectedElement({ type: 'node', data: { ...selectedNode, x, y } });
      }
    }
  };

  // Handle mouse up for node dragging
  const handleMouseUp = (e) => {
    if (mode === 'select') {
      setDraggedNode(null);
    }
  };

  // Render the graph
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    edges.forEach(edge => {
      const sourceNode = nodes.find(node => node.id === edge.source);
      const targetNode = nodes.find(node => node.id === edge.target);
      
      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        
        // Highlight selected edge
        if (selectedEdge && edge.id === selectedEdge.id) {
          ctx.strokeStyle = '#2196f3'; // Blue color for selected edge
          ctx.lineWidth = 3;
        } else {
          ctx.strokeStyle = '#666';
          ctx.lineWidth = 2;
        }
        
        ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(targetNode.y - sourceNode.y, targetNode.x - sourceNode.x);
        const arrowLength = 10;
        const arrowX = targetNode.x - (NODE_RADIUS * Math.cos(angle));
        const arrowY = targetNode.y - (NODE_RADIUS * Math.sin(angle));
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle - Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          arrowX - arrowLength * Math.cos(angle + Math.PI / 6),
          arrowY - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        
        // Use the same color for the arrow as the edge
        if (selectedEdge && edge.id === selectedEdge.id) {
          ctx.fillStyle = '#2196f3';
        } else {
          ctx.fillStyle = '#666';
        }
        
        ctx.fill();
        
        // Add a label to the edge if it has one
        if (edge.properties && edge.properties.label) {
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          // Draw label background for better readability
          const labelText = edge.properties.label;
          ctx.font = '12px Arial';
          const textMetrics = ctx.measureText(labelText);
          const textWidth = textMetrics.width;
          const textHeight = 16; // Approximate height
          
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(midX - textWidth/2 - 3, midY - textHeight/2 - 3, textWidth + 6, textHeight + 6);
          
          // Draw edge label
          ctx.fillStyle = selectedEdge && edge.id === selectedEdge.id ? '#2196f3' : '#333';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, midX, midY);
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
      
      // Highlight selected node
      if (selectedNode && node.id === selectedNode.id) {
        ctx.fillStyle = '#90caf9';
      } else {
        ctx.fillStyle = '#e0e0e0';
      }
      
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.properties.label, node.x, node.y);
    });
    
    // Draw connection line when in connect mode with pending connection
    if (mode === 'connect' && connectStartNode && pendingConnection) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = Math.max(0, Math.min(canvas.width, window.mouseX - rect.left));
      const mouseY = Math.max(0, Math.min(canvas.height, window.mouseY - rect.top));
      
      ctx.beginPath();
      ctx.moveTo(connectStartNode.x, connectStartNode.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw a highlight around the start node to indicate it's selected for connection
      ctx.beginPath();
      ctx.arc(connectStartNode.x, connectStartNode.y, NODE_RADIUS + 5, 0, 2 * Math.PI);
      ctx.strokeStyle = '#4caf50';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [nodes, edges, selectedNode, selectedEdge, connectStartNode, pendingConnection, mode]);

  // Track mouse position for drawing connection line
  useEffect(() => {
    const trackMouse = (e) => {
      window.mouseX = e.clientX;
      window.mouseY = e.clientY;
    };
    
    window.addEventListener('mousemove', trackMouse);
    
    return () => {
      window.removeEventListener('mousemove', trackMouse);
    };
  }, []);

  // Set canvas size
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    updateNodeProperties: (nodeId, updatedProperties) => {
      setNodes(nodes.map(node => {
        if (node.id === nodeId) {
          const updatedNode = { ...node, properties: updatedProperties };
          
          // Update selected node if it's the one being modified
          if (selectedNode && selectedNode.id === nodeId) {
            setSelectedNode(updatedNode);
            setSelectedElement({ type: 'node', data: updatedNode });
          }
          
          return updatedNode;
        }
        return node;
      }));
    },
    updateEdgeProperties: (edgeId, updatedProperties) => {
      setEdges(edges.map(edge => {
        if (edge.id === edgeId) {
          const updatedEdge = { ...edge, properties: updatedProperties };
          
          // Update selected edge if it's the one being modified
          if (selectedEdge && selectedEdge.id === edgeId) {
            setSelectedEdge(updatedEdge);
            setSelectedElement({ type: 'edge', data: updatedEdge });
          }
          
          return updatedEdge;
        }
        return edge;
      }));
    }
  }));

  return (
    <canvas
      ref={canvasRef}
      className={`graph-canvas mode-${mode}`}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
});

export default GraphCanvas;
