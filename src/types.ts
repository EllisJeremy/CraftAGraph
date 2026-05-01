export type FreePoint = { x: number; y: number };
export type FreePath = { id: string; points: FreePoint[] };

export type CustomEdgeData = {
  weight: number;
  onWeightChange: (id: string, weight: number) => void;
};
