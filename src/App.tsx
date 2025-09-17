import { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import "reactflow/dist/style.css";
import style from "./App.module.css";

import CircleNode from "./components/sideNode";
import nodeLayout from "./fucntions/nodeLayout";

const nodeTypes = { circle: CircleNode };

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // dynamic form state
  const [nodeInputs, setNodeInputs] = useState<string[]>([""]);
  const [edgeInputs, setEdgeInputs] = useState<{ [key: string]: string[] }>({});

  // handle node input change
  const updateNode = (index: number, value: string) => {
    const updated = [...nodeInputs];
    updated[index] = value;
    setNodeInputs(updated);

    // auto-add new node row if last one is filled
    if (index === nodeInputs.length - 1 && value.trim() !== "") {
      setNodeInputs([...updated, ""]);
    }
  };

  // handle edge input change for adjacency list
  const updateTarget = (node: string, index: number, value: string) => {
    const targets = edgeInputs[node] ? [...edgeInputs[node]] : [];
    targets[index] = value;
    const updated = { ...edgeInputs, [node]: targets };
    setEdgeInputs(updated);

    // auto-add empty input if last is filled
    if (index === targets.length - 1 && value.trim() !== "") {
      setEdgeInputs({ ...updated, [node]: [...targets, ""] });
    }
  };

  // build graph
  const handleBuildGraph = async () => {
    const parsedNodes: Node[] = nodeInputs
      .filter((n) => n.trim() !== "")
      .map((label, i) => ({
        id: label.trim(),
        type: "circle",
        position: { x: 100 + i * 100, y: 100 },
        data: { label: label.slice(0, 7), title: label },
      }));

    const parsedEdges: Edge[] = Object.entries(edgeInputs).flatMap(
      ([source, targets], i) =>
        targets
          .filter((t) => t.trim() !== "")
          .map((target, j) => ({
            id: `e${i}-${j}`,
            source,
            target: target.trim(),
            style: { stroke: "#ff6600", strokeWidth: 2 },
            type: "smoothstep",
          }))
    );

    const { nodes: layoutedNodes, edges: layoutedEdges } = await nodeLayout(
      parsedNodes,
      parsedEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  return (
    <div className={style.app}>
      <h1>Craft a Graph</h1>

      {/* Edges under each node (adjacency list style) */}
      <h3>vertices</h3>
      <div className={style.adjacencyGrid}>
        {nodeInputs.map((node, i) => (
          <div key={i} className={style.adjacencyColumn}>
            {/* node name input at top */}
            <input
              value={node}
              onChange={(e) => updateNode(i, e.target.value)}
              placeholder={`Node ${i + 1}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  updateNode(i, node);
                }
              }}
            />

            {/* edges directly below */}
            {(edgeInputs[node] || [""]).map((target, j) => (
              <input
                key={j}
                value={target}
                onChange={(e) => updateTarget(node, j, e.target.value)}
                placeholder="Target"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    updateTarget(node, j, target);
                  }
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <button onClick={handleBuildGraph}>Build Graph</button>

      {/* Graph */}
      <div className={style.graphArea}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          nodeTypes={nodeTypes}
        >
          <Background color="#000" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
