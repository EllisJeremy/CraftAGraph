import { ReactFlowProvider } from "reactflow";
import GraphBuilder from "./components/GraphBuilder";

export default function App() {
  return (
    <ReactFlowProvider>
      <GraphBuilder />
    </ReactFlowProvider>
  );
}
