import { useState, useCallback, useRef, useEffect } from "react";
import { flushSync } from "react-dom";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  useReactFlow,
  useViewport,
  Handle,
  Position,
} from "reactflow";
import type { Node, Edge } from "reactflow";

type FreePoint = { x: number; y: number };
type FreePath = { id: string; points: FreePoint[] };

const toPathD = (pts: FreePoint[]) =>
  pts.reduce(
    (d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    "",
  );
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
        border: data.isConnectingSource
          ? "3px solid #ff6600"
          : "3px solid #fff",
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
  const { x: vpX, y: vpY, zoom } = useViewport();
  const [freeDrawMode, setFreeDrawMode] = useState(false);
  const [freePaths, setFreePaths] = useState<FreePath[]>([]);
  const [currentPath, setCurrentPath] = useState<FreePoint[] | null>(null);
  const [selectedFreePathId, setSelectedFreePathId] = useState<string | null>(
    null,
  );
  const selectedFreePathIdRef = useRef<string | null>(null);
  selectedFreePathIdRef.current = selectedFreePathId;
  const isDrawing = useRef(false);

  useEffect(() => {
    const isTyping = () => document.activeElement?.tagName === "INPUT";

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTyping()) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedFreePathIdRef.current) {
        const id = selectedFreePathIdRef.current;
        setFreePaths((paths) => paths.filter((p) => p.id !== id));
        setSelectedFreePathId(null);
      }
      if (e.key === "d" && !e.repeat) {
        setFreeDrawMode(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "d") {
        isDrawing.current = false;
        flushSync(() => {
          setFreeDrawMode(false);
          setCurrentPath(null);
        });
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const colors = [
    { name: "Purple", value: "#667eea" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#22c55e" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Orange", value: "#ffe100" },
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
      setSelectedFreePathId(null);
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
            style: { stroke: "#000", strokeWidth: 2 },
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

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setSelectedFreePathId(null);
    },
    [setEdges],
  );

  const onPaneClick = useCallback(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    connectingFromRef.current = null;
    setConnectingFrom(null);
    setSelectedFreePathId(null);
  }, [setEdges]);

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      const THRESHOLD = 50; // flow-space px — how close a path point must be to a node center
      const nodeCenter = (n: Node) => ({ x: n.position.x + 30, y: n.position.y + 30 });
      const pathNear = (fp: FreePath, pt: { x: number; y: number }) =>
        fp.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < THRESHOLD);

      const draggedCenter = nodeCenter(draggedNode);
      const toRemove: string[] = [];
      const newEdges: Parameters<typeof addEdge>[0][] = [];

      for (const fp of freePaths) {
        if (!pathNear(fp, draggedCenter)) continue;
        const other = nodes.find(
          (n) => n.id !== draggedNode.id && pathNear(fp, nodeCenter(n)),
        );
        if (other) {
          toRemove.push(fp.id);
          newEdges.push({
            id: `e-${draggedNode.id}-${other.id}`,
            source: draggedNode.id,
            target: other.id,
            style: { stroke: "#000", strokeWidth: 2 },
            type: "straight",
          });
        }
      }

      if (toRemove.length > 0)
        setFreePaths((paths) => paths.filter((p) => !toRemove.includes(p.id)));
      if (newEdges.length > 0)
        setEdges((eds) => newEdges.reduce((acc, e) => addEdge(e, acc), eds));
    },
    [freePaths, nodes, setEdges],
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
    [
      nodeIdCounter,
      screenToFlowPosition,
      setNodes,
      selectedColor,
      handleLabelChange,
    ],
  );

  const onDragStart = (event: React.DragEvent, color: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/reactflow-color", color);
    setSelectedColor(color);
  };

  const onDrawMouseDown = (e: React.MouseEvent) => {
    if (!freeDrawMode) return;
    isDrawing.current = true;
    connectingFromRef.current = null;
    setConnectingFrom(null);
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentPath([pos]);
  };

  const onDrawMouseMove = (e: React.MouseEvent) => {
    if (!freeDrawMode || !isDrawing.current) return;
    const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setCurrentPath((prev) => (prev ? [...prev, pos] : [pos]));
  };

  const onDrawMouseUp = () => {
    if (!freeDrawMode || !isDrawing.current) return;
    isDrawing.current = false;
    setCurrentPath((prev) => {
      if (prev && prev.length >= 2) {
        setFreePaths((paths) => [
          ...paths,
          { id: `fp-${Date.now()}`, points: prev },
        ]);
      }
      return null;
    });
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
        <li>Hold <strong>D</strong> to free-draw annotation lines.</li>
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

      <div
        className={style.graphArea}
        ref={reactFlowWrapper}
        style={{ position: "relative" }}
      >
        <ReactFlow
          nodes={nodes.map((n) => ({
            ...n,
            data: { ...n.data, isConnectingSource: n.id === connectingFrom },
          }))}
          edges={edges.map((e) => ({
            ...e,
            style: e.selected
              ? { stroke: "#f97316", strokeWidth: 3 }
              : { stroke: "#000", strokeWidth: 2 },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={freeDrawMode ? undefined : onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onEdgeClick={onEdgeClick}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={["Delete", "Backspace"]}
          panOnDrag={!freeDrawMode}
          nodesDraggable={!freeDrawMode}
        >
          <Background color="#000" gap={20} />
          <Controls />
        </ReactFlow>

        {/* Free-draw SVG overlay — lives in flow-space via viewport transform */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            cursor: freeDrawMode ? "crosshair" : "default",
            zIndex: 10,
          }}
        >
          <g transform={`translate(${vpX}, ${vpY}) scale(${zoom})`}>
            {/* Capture draw gestures without blocking ReactFlow */}
            {freeDrawMode && (
              <rect
                x={-vpX / zoom}
                y={-vpY / zoom}
                width={99999}
                height={99999}
                fill="transparent"
                style={{ pointerEvents: "all" }}
                onMouseDown={onDrawMouseDown}
                onMouseMove={onDrawMouseMove}
                onMouseUp={onDrawMouseUp}
                onMouseLeave={onDrawMouseUp}
              />
            )}
            {freePaths.map((fp) => (
              <g
                key={fp.id}
                style={{ cursor: freeDrawMode ? "crosshair" : "pointer" }}
                onClick={() =>
                  setSelectedFreePathId((cur) => (cur === fp.id ? null : fp.id))
                }
              >
                {/* Wide transparent hit area */}
                <path
                  d={toPathD(fp.points)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={12 / zoom}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: freeDrawMode ? "none" : "stroke" }}
                />
                {/* Visible stroke */}
                <path
                  d={toPathD(fp.points)}
                  fill="none"
                  stroke={fp.id === selectedFreePathId ? "#f97316" : "black"}
                  strokeWidth={2 / zoom}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: "none" }}
                />
              </g>
            ))}
            {currentPath && currentPath.length >= 2 && (
              <path
                d={toPathD(currentPath)}
                fill="none"
                stroke="black"
                strokeWidth={2 / zoom}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={`${4 / zoom} ${4 / zoom}`}
              />
            )}
          </g>
        </svg>
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
