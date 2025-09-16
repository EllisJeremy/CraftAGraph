import { Handle, Position, NodeProps } from "reactflow";

type CircleNodeData = {
  label: string;
  title: string;
};

export default function CircleNode({ data }: NodeProps<CircleNodeData>) {
  return (
    <div
      style={{
        background: "#0178ff",
        color: "white",

        width: 50,
        height: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        textAlign: "center",
        overflow: "hidden",
      }}
      title={data.title}
    >
      {data.label}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
