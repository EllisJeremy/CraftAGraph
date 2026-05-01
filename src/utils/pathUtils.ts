import type { FreePoint } from "../types";

export const toPathD = (pts: FreePoint[]) =>
  pts.reduce(
    (d, p, i) => d + (i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`),
    "",
  );
