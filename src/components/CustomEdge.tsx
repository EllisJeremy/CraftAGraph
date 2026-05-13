import { useState } from "react";
import { getStraightPath, EdgeLabelRenderer } from "reactflow";
import type { EdgeProps } from "reactflow";
import type { CustomEdgeData } from "../types";
import { useGraphSettings } from "../context/GraphSettings";

export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  selected,
  data,
}: EdgeProps<CustomEdgeData>) {
  const { showWeights, showDirection } = useGraphSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  // Shorten both ends so the line starts/ends at the circle edge, not the center
  const NODE_RADIUS = 30;
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const len = Math.hypot(dx, dy);
  const ux = len > 0 ? dx / len : 0;
  const uy = len > 0 ? dy / len : 0;
  const sx = sourceX + ux * NODE_RADIUS;
  const sy = sourceY + uy * NODE_RADIUS;
  const tx = targetX - ux * NODE_RADIUS;
  const ty = targetY - uy * NODE_RADIUS;

  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX: sx,
    sourceY: sy,
    targetX: tx,
    targetY: ty,
  });

  const color = selected ? "#f97316" : "#000";
  const strokeWidth = selected ? 3 : 2;
  const markerId = `arrow-${id}`;

  const startEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(String(data?.weight ?? 0));
    setIsEditing(true);
  };

  const commitEdit = () => {
    setIsEditing(false);
    const num = parseFloat(editValue);
    if (!isNaN(num)) data?.onWeightChange?.(id, num);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <>
      {showDirection && (
        <defs>
          <marker
            id={markerId}
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
            markerUnits="userSpaceOnUse"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
          </marker>
        </defs>
      )}

      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        markerEnd={showDirection ? `url(#${markerId})` : undefined}
      />

      {showWeights && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {isEditing ? (
              <input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                autoFocus
                style={{
                  width: 52,
                  textAlign: "center",
                  border: "1px solid #f97316",
                  borderRadius: 4,
                  padding: "2px 4px",
                  fontSize: 12,
                  outline: "none",
                }}
              />
            ) : (
              <div
                onClick={startEditing}
                style={{
                  background: "white",
                  border: `1px solid ${selected ? "#f97316" : "#d1d5db"}`,
                  borderRadius: 4,
                  padding: "1px 7px",
                  fontSize: 12,
                  cursor: "text",
                  lineHeight: "1.5",
                  userSelect: "none",
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {data?.weight ?? 0}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
