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

import ELK from "elkjs/lib/elk.bundled.js";

const elk = new ELK();
const nodeTypes = { circle: CircleNode };

async function getElkLayout(nodes: Node[], edges: Edge[]) {
  const graph = {
    id: "root",
    layoutOptions: { "elk.algorithm": "layered" },
    children: nodes.map((n) => ({ id: n.id, width: 80, height: 80 })),
    edges: edges.map((e) => ({
      id: e.id,
      sources: [e.source],
      targets: [e.target],
    })),
  };

  const layout = await elk.layout(graph);

  return {
    nodes: nodes.map((n) => {
      const pos = layout.children?.find((c) => c.id === n.id);
      return { ...n, position: { x: pos?.x ?? 0, y: pos?.y ?? 0 } };
    }),
    edges,
  };
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [input, setInput] = useState<string>("");

  const handleBuildGraph = async () => {
    const lines = input.split("\n").map((line) => line.trim());

    let parsedNodes: Node[] = [];
    let parsedEdges: Edge[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith("Nodes:")) {
        const nodeLabels = line.replace("Nodes:", "").split(",");
        parsedNodes = nodeLabels.map((label, i) => ({
          id: label.trim(),
          type: "circle",
          position: { x: 150 * (i + 1), y: 100 + idx * 50 },
          data: { label: label.slice(0, 7), title: label },
          style: {
            background: "#0178ff",
            color: "white",
            borderRadius: "100%",
            width: 50,
            height: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            textAlign: "center",
            overflow: "hidden",
          },
        }));
      }

      if (line.startsWith("Edges:")) {
        const edgeDefs = line.replace("Edges:", "").split(",");
        parsedEdges = edgeDefs.map((pair, i) => {
          const [source, target] = pair.split("-");
          return {
            id: `e${i}`,
            source: source.trim(),
            target: target.trim(),
            style: { stroke: "#ff6600", strokeWidth: 2 },
            type: "straight",
          };
        });
      }
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = await getElkLayout(
      parsedNodes,
      parsedEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  return (
    <div className={style.app}>
      <h1>Graph Builder</h1>

      <textarea
        className={style.graphInput}
        rows={5}
        placeholder={"Nodes: A, B, C\nEdges: A-B, B-C"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

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
