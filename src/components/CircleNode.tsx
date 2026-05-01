import { useState } from "react";
import { Handle, Position } from "reactflow";
import type { CSSProperties } from "react";

const hiddenHandle: CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 1,
  border: "none",
  background: "transparent",
  opacity: 0,
  top: 30,
  left: 30,
  right: "auto",
  bottom: "auto",
  transform: "none",
};

type CircleNodeProps = {
  data: {
    label: string;
    title: string;
    color: string;
    isConnectingSource: boolean;
    onLabelChange: (id: string, label: string) => void;
  };
  id: string;
};

export default function CircleNode({ data, id }: CircleNodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);

  const handleDoubleClick = () => setIsEditing(true);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim()) {
      data.onLabelChange(id, editValue.trim());
    } else {
      setEditValue(data.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleBlur();
  };

  return (
    <div
      style={{
        position: "relative",
        width: 60,
        height: 60,
        borderRadius: "50%",
        background: data.color,
        border: data.isConnectingSource ? "3px solid #ff6600" : "3px solid #fff",
        boxShadow: data.isConnectingSource
          ? "0 0 0 3px #ff6600, 0 4px 6px rgba(0,0,0,0.3)"
          : "0 4px 6px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: data.isConnectingSource ? "crosshair" : "pointer",
      }}
      title={data.title}
      onDoubleClick={handleDoubleClick}
    >
      <Handle type="target" position={Position.Top} style={hiddenHandle} />
      <Handle type="source" position={Position.Bottom} style={hiddenHandle} />
      {isEditing ? (
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          style={{
            width: "50px",
            textAlign: "center",
            background: "transparent",
            border: "none",
            color: "#fff",
            fontWeight: "bold",
            fontSize: "14px",
            outline: "none",
          }}
        />
      ) : (
        data.label
      )}
    </div>
  );
}
