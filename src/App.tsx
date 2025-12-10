import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  Handle,
  Position,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import style from "./App.module.css";

// Custom Circle Node Component
const CircleNode = ({
  data,
  id,
}: {
  data: {
    label: string;
    title: string;
    color: string;
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
    <>
      <Handle type="target" position={Position.Top} id="top" />
      <Handle type="target" position={Position.Left} id="left" />
      <Handle type="target" position={Position.Right} id="right" />
      <Handle type="target" position={Position.Bottom} id="bottom" />
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: data.color,
          border: "3px solid #fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: "bold",
          fontSize: "14px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        }}
        title={data.title}
        onDoubleClick={handleDoubleClick}
      >
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
      <Handle type="source" position={Position.Top} id="top-source" />
      <Handle type="source" position={Position.Left} id="left-source" />
      <Handle type="source" position={Position.Right} id="right-source" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
    </>
  );
};

const nodeTypes = { circle: CircleNode };

function GraphBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#667eea");
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
            : node
        )
      );
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            style: { stroke: "#ff6600", strokeWidth: 2 },
            type: "straight",
          },
          eds
        )
      ),
    [setEdges]
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
          onLabelChange: handleLabelChange,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      setNodeIdCounter((id) => id + 1);
    },
    [nodeIdCounter, screenToFlowPosition, setNodes, selectedColor]
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
        <li>Connect nodes by dragging from one node's edge to another.</li>
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
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
