import { useState } from "react";
import ReactFlow, { Node, Edge } from "reactflow";
import style from "./App.module.css";

export default function App() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
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
          data: { label: label.trim() },
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
          };
        });
      }
    });

    setNodes(parsedNodes);
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
        <ReactFlow nodes={nodes} edges={edges} fitView />
      </div>
    </div>
  );
}
