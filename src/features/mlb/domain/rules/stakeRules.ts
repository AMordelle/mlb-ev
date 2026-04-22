import { EV_THRESHOLD } from "./evRules";

export const DEFAULT_STAKE_PCT = 1;
export const MAX_STAKE_PCT = 2;
const HIGHER_EDGE_STAKE_THRESHOLD = 0.08;

export function getRecommendedStakePct(ev: number): number {
  if (ev < EV_THRESHOLD) {
    return 0;
  }

  if (ev < HIGHER_EDGE_STAKE_THRESHOLD) {
    return DEFAULT_STAKE_PCT;
  }

  return MAX_STAKE_PCT;
}
