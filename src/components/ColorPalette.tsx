import type { DragEvent } from "react";
import style from "../App.module.css";

const COLORS = [
  { name: "Purple", value: "#667eea" },
  { name: "Red", value: "#ef4444" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Orange", value: "#ffe100" },
];

type Props = {
  onDragStart: (e: DragEvent, color: string) => void;
};

export default function ColorPalette({ onDragStart }: Props) {
  return (
    <div className={style.colorNodes}>
      {COLORS.map((color) => (
        <div
          key={color.value}
          draggable
          onDragStart={(e) => onDragStart(e, color.value)}
          className={style.dragNode}
          style={{ background: color.value }}
          title={color.name}
        >
          +
        </div>
      ))}
    </div>
  );
}
