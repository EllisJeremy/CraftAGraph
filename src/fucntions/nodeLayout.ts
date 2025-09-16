import ELK from "elkjs/lib/elk.bundled.js";
import type { Node, Edge } from "reactflow";
const elk = new ELK();

export default async function nodeLayout(nodes: Node[], edges: Edge[]) {
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
