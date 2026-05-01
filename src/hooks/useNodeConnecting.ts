import { useState, useRef, useCallback } from "react";
import { addEdge } from "reactflow";
import type { Node, Edge } from "reactflow";
import type { MouseEvent, Dispatch, SetStateAction } from "react";

export function useNodeConnecting(
  setEdges: Dispatch<SetStateAction<Edge[]>>,
  setSelectedFreePathId: (id: string | null) => void,
  onWeightChange: (id: string, weight: number) => void,
) {
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const connectingFromRef = useRef<string | null>(null);

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node) => {
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
            type: "custom",
            data: { weight: 0, onWeightChange },
          },
          eds,
        ),
      );
      connectingFromRef.current = null;
      setConnectingFrom(null);
    },
    [setEdges, setSelectedFreePathId, onWeightChange],
  );

  const onEdgeClick = useCallback(
    (_event: MouseEvent, edge: Edge) => {
      setEdges((eds) => eds.map((e) => ({ ...e, selected: e.id === edge.id })));
      connectingFromRef.current = null;
      setConnectingFrom(null);
      setSelectedFreePathId(null);
    },
    [setEdges, setSelectedFreePathId],
  );

  const onPaneClick = useCallback(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    connectingFromRef.current = null;
    setConnectingFrom(null);
    setSelectedFreePathId(null);
  }, [setEdges, setSelectedFreePathId]);

  return {
    connectingFrom,
    connectingFromRef,
    onNodeClick,
    onEdgeClick,
    onPaneClick,
  };
}
