import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import style from "./App.module.css";

const hiddenHandle: React.CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  top: 30,
  left: 30,
  right: "auto",
  bottom: "auto",
  transform: "none",
};

// Custom Circle Node Component
const CircleNode = ({
  data,
  id,
}: {
  data: {
    label: string;
    title: string;
    color: string;
    isConnectingSource: boolean;
    onLabelChange: (id: string, label: string) => void;
  };
  id: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim()) {
      data.onLabelChange(id, editValue.trim());
    } else {
      setEditValue(data.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
  };

  return (
      <div
        style={{
          position: "relative",
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: data.color,
          border: data.isConnectingSource ? "3px solid #ff6600" : "3px solid #fff",
          boxShadow: data.isConnectingSource
            ? "0 0 0 3px #ff6600, 0 4px 6px rgba(0,0,0,0.3)"
            : "0 4px 6px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "14px",
          cursor: data.isConnectingSource ? "crosshair" : "pointer",
        }}
        title={data.title}
        onDoubleClick={handleDoubleClick}
      >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: "50px",
              textAlign: "center",
              background: "transparent",
              border: "none",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "14px",
              outline: "none",
            }}
          />
        ) : (
          data.label
        )}
      </div>
  );
};

const nodeTypes = { circle: CircleNode };

function GraphBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#667eea");
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const connectingFromRef = useRef<string | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const colors = [
    { name: "Purple", value: "#667eea" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#22c55e" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Orange", value: "#f97316" },
  ];

  const handleLabelChange = useCallback(
    (nodeId: string, newLabel: string) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, label: newLabel } }
            : node,
        ),
      );
    },
    [setNodes],
  );

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const current = connectingFromRef.current;
      if (!current) {
        connectingFromRef.current = node.id;
        setConnectingFrom(node.id);
        return;
      }
      if (current === node.id) {
        connectingFromRef.current = null;
        setConnectingFrom(null);
        return;
      }
      setEdges((eds) =>
        addEdge(
          {
            id: `e-${current}-${node.id}`,
            source: current,
            target: node.id,
            style: { stroke: "#ff6600", strokeWidth: 2 },
            type: "straight",
          },
          eds,
        ),
      );
      connectingFromRef.current = null;
      setConnectingFrom(null);
    },
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const color = event.dataTransfer.getData("application/reactflow-color");

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `node-${nodeIdCounter}`,
        type: "circle",
        position,
        data: {
          label: `${nodeIdCounter}`,
          title: `Node ${nodeIdCounter}`,
          color: color || selectedColor,
          isConnectingSource: false,
          onLabelChange: handleLabelChange,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((id) => id + 1);
    },
    [nodeIdCounter, screenToFlowPosition, setNodes, selectedColor, handleLabelChange],
  );

  const onDragStart = (event: React.DragEvent, color: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/reactflow-color", color);
    setSelectedColor(color);
  };

  return (
    <div className={style.app}>
      <h1>Craft a Graph</h1>

      <ul className={style.instructions}>
        <li>
          Drag a colored node below onto the canvas. Double-click nodes to edit
        </li>
        <li>Click a node to start an edge, then click the target node.</li>
        <li>
          To remove a node or connection, click on it then hit the delete key.
        </li>
      </ul>

      <div className={style.colorNodes}>
        {colors.map((color) => (
          <div
            key={color.value}
            draggable
            onDragStart={(e) => onDragStart(e, color.value)}
            className={style.dragNode}
            style={{
              background: color.value,
            }}
            title={color.name}
          >
            +
          </div>
        ))}
      </div>

      <div className={style.graphArea} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.map((n) => ({
            ...n,
            data: { ...n.data, isConnectingSource: n.id === connectingFrom },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode="Delete"
        >
          <Background color="#000" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <GraphBuilder />
    </ReactFlowProvider>
  );
}
