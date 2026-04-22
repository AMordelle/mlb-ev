export const EV_THRESHOLD = 0.04;

export function hasPositiveEdge(ev: number): boolean {
  return ev > 0;
}

export function meetsEvThreshold(ev: number): boolean {
  return ev >= EV_THRESHOLD;
}
