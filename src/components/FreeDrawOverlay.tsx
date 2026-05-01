import type { MouseEvent } from "react";
import type { FreePath, FreePoint } from "../types";
import { toPathD } from "../utils/pathUtils";

type Props = {
  vpX: number;
  vpY: number;
  zoom: number;
  freeDrawMode: boolean;
  freePaths: FreePath[];
  currentPath: FreePoint[] | null;
  selectedFreePathId: string | null;
  onDrawMouseDown: (e: MouseEvent) => void;
  onDrawMouseMove: (e: MouseEvent) => void;
  onDrawMouseUp: () => void;
  onSelectPath: (id: string) => void;
};

export default function FreeDrawOverlay({
  vpX,
  vpY,
  zoom,
  freeDrawMode,
  freePaths,
  currentPath,
  selectedFreePathId,
  onDrawMouseDown,
  onDrawMouseMove,
  onDrawMouseUp,
  onSelectPath,
}: Props) {
  return (
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
            onClick={() => onSelectPath(fp.id)}
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
  );
}
