import { useState, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useViewport,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";

import CircleNode from "./CircleNode";
import CustomEdge from "./CustomEdge";
import ColorPalette from "./ColorPalette";
import FreeDrawOverlay from "./FreeDrawOverlay";
import { useFreeDrawing } from "../hooks/useFreeDrawing";
import { useNodeConnecting } from "../hooks/useNodeConnecting";
import { GraphSettingsContext } from "../context/GraphSettings";
import style from "../App.module.css";

const nodeTypes = { circle: CircleNode };
const edgeTypes = { custom: CustomEdge };

export default function GraphBuilder() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [selectedColor, setSelectedColor] = useState("#667eea");
  const [showWeights, setShowWeights] = useState(false);
  const [showDirection, setShowDirection] = useState(false);
  const { screenToFlowPosition } = useReactFlow();
  const { x: vpX, y: vpY, zoom } = useViewport();

  const {
    freeDrawMode,
    freePaths,
    setFreePaths,
    currentPath,
    selectedFreePathId,
    setSelectedFreePathId,
    onDrawMouseDown,
    onDrawMouseMove,
    onDrawMouseUp,
  } = useFreeDrawing();

  const handleWeightChange = useCallback(
    (edgeId: string, weight: number) => {
      setEdges((eds) =>
        eds.map((e) =>
          e.id === edgeId ? { ...e, data: { ...e.data, weight } } : e,
        ),
      );
    },
    [setEdges],
  );

  const { connectingFrom, onNodeClick, onEdgeClick, onPaneClick } =
    useNodeConnecting(setEdges, setSelectedFreePathId, handleWeightChange);

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

  const onNodeDragStart = useCallback(
    (_event: React.MouseEvent, draggedNode: Node) => {
      const THRESHOLD = 50;
      const nodeCenter = (n: Node) => ({ x: n.position.x + 30, y: n.position.y + 30 });
      const pathNear = (
        fp: { points: { x: number; y: number }[] },
        pt: { x: number; y: number },
      ) => fp.points.some((p) => Math.hypot(p.x - pt.x, p.y - pt.y) < THRESHOLD);

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
            type: "custom",
            data: { weight: 0, onWeightChange: handleWeightChange },
          });
        }
      }

      if (toRemove.length > 0)
        setFreePaths((paths) => paths.filter((p) => !toRemove.includes(p.id)));
      if (newEdges.length > 0)
        setEdges((eds) => newEdges.reduce((acc, e) => addEdge(e, acc), eds));
    },
    [freePaths, nodes, setEdges, setFreePaths, handleWeightChange],
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
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
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
    <GraphSettingsContext.Provider value={{ showWeights, showDirection }}>
      <div className={style.app}>
        <h1>Craft a Graph</h1>
        <ul className={style.instructions}>
          <li>Drag a colored node onto the canvas. Double-click nodes to rename.</li>
          <li>Click a node to start an edge, then click the target node.</li>
          <li>Click a node or edge then hit Delete to remove it.</li>
          <li>Hold <strong>D</strong> to free-draw annotation lines.</li>
        </ul>

        <div className={style.toggleRow}>
          <button
            className={`${style.toggle} ${showWeights ? style.toggleActive : ""}`}
            onClick={() => setShowWeights((v) => !v)}
          >
            Weighted
          </button>
          <button
            className={`${style.toggle} ${showDirection ? style.toggleActive : ""}`}
            onClick={() => setShowDirection((v) => !v)}
          >
            Directed
          </button>
        </div>

        <ColorPalette onDragStart={onDragStart} />

        <div className={style.graphArea} ref={reactFlowWrapper} style={{ position: "relative" }}>
          <ReactFlow
            nodes={nodes.map((n) => ({
              ...n,
              data: { ...n.data, isConnectingSource: n.id === connectingFrom },
            }))}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={freeDrawMode ? undefined : onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            deleteKeyCode={["Delete", "Backspace"]}
            panOnDrag={!freeDrawMode}
            nodesDraggable={!freeDrawMode}
          >
            <Background color="#000" gap={20} />
            <Controls />
          </ReactFlow>

          <FreeDrawOverlay
            vpX={vpX}
            vpY={vpY}
            zoom={zoom}
            freeDrawMode={freeDrawMode}
            freePaths={freePaths}
            currentPath={currentPath}
            selectedFreePathId={selectedFreePathId}
            onDrawMouseDown={onDrawMouseDown}
            onDrawMouseMove={onDrawMouseMove}
            onDrawMouseUp={onDrawMouseUp}
            onSelectPath={(id) => setSelectedFreePathId((cur) => (cur === id ? null : id))}
          />
        </div>
      </div>
    </GraphSettingsContext.Provider>
  );
}
