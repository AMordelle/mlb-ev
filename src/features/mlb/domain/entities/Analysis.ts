import type { ConfidenceLevel } from "../value-objects/Confidence";

export type Analysis = {
  gamePk: number;
  confidence: ConfidenceLevel;
  recommendation: "OVER" | "UNDER" | "NO_BET";
};
