import { useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
} from "reactflow";
import type { Node, Edge } from "reactflow";
import style from "./App.module.css";
import "reactflow/dist/style.css";
import CircleNode from "./components/sideNode";
import nodeLayout from "./fucntions/nodeLayout";

const nodeTypes = { circle: CircleNode };

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // dynamic form state
  const [nodeInputs, setNodeInputs] = useState<string[]>([""]);
  const [edgeInputs, setEdgeInputs] = useState<
    { source: string; target: string }[]
  >([{ source: "", target: "" }]);

  // handle node input change
  const updateNode = (index: number, value: string) => {
    const updated = [...nodeInputs];
    updated[index] = value;
    setNodeInputs(updated);

    // add new empty row if last one is filled
    if (index === nodeInputs.length - 1 && value.trim() !== "") {
      setNodeInputs([...updated, ""]);
    }
  };

  // handle edge input change
  const updateEdge = (
    index: number,
    field: "source" | "target",
    value: string
  ) => {
    const updated = [...edgeInputs];
    updated[index][field] = value;
    setEdgeInputs(updated);

    // add new row if last row is fully filled
    if (
      index === edgeInputs.length - 1 &&
      updated[index].source.trim() !== "" &&
      updated[index].target.trim() !== ""
    ) {
      setEdgeInputs([...updated, { source: "", target: "" }]);
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

    const parsedEdges: Edge[] = edgeInputs
      .filter((e) => e.source.trim() !== "" && e.target.trim() !== "")
      .map((e, i) => ({
        id: `e${i}`,
        source: e.source.trim(),
        target: e.target.trim(),
        style: { stroke: "#ff6600", strokeWidth: 2 },
        type: "smoothstep",
      }));

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

      <h3>Nodes</h3>
      <div className={style.nodeInputs}>
        {nodeInputs.map((value, i) => (
          <input
            key={i}
            value={value}
            onChange={(e) => updateNode(i, e.target.value)}
            placeholder={`Node ${i + 1}`}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateNode(i, value);
              }
            }}
          />
        ))}
      </div>

      <h3>Edges</h3>
      {edgeInputs.map((edge, i) => (
        <div key={i} style={{ display: "flex", gap: "8px" }}>
          <input
            value={edge.source}
            onChange={(e) => updateEdge(i, "source", e.target.value)}
            placeholder="Source"
          />
          <input
            value={edge.target}
            onChange={(e) => updateEdge(i, "target", e.target.value)}
            placeholder="Target"
          />
        </div>
      ))}

      <button onClick={handleBuildGraph}>Build Graph</button>

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
