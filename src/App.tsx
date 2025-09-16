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

import dagre from "dagre";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  dagreGraph.setGraph({ rankdir: "LR" }); // TB = top-bottom, LR = left-right

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 80, height: 80 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = { x: pos.x, y: pos.y };
    return node;
  });
}

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [input, setInput] = useState<string>("");

  const handleBuildGraph = () => {
    const lines = input.split("\n").map((line) => line.trim());

    let parsedNodes: Node[] = [];
    let parsedEdges: Edge[] = [];

    lines.forEach((line, idx) => {
      if (line.startsWith("Nodes:")) {
        const nodeLabels = line.replace("Nodes:", "").split(",");
        parsedNodes = nodeLabels.map((label, i) => ({
          id: label.trim(),
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
            type: "smoothstep",
          };
        });
      }
    });

    const layouted = getLayoutedElements(parsedNodes, parsedEdges);
    setNodes(layouted);
    setEdges(parsedEdges);
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
        >
          <Background color="#000" gap={20} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
