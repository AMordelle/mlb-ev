import type { ConfidenceLevel } from "../value-objects/Confidence";

export type Pick = {
  gamePk: number;
  market: "TOTALS";
  confidence: ConfidenceLevel;
};
