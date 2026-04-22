import { meetsEvThreshold } from "../rules/evRules";

export function calculateEV(modelProbability: number, odds: number): number {
  if (!Number.isFinite(modelProbability) || modelProbability < 0 || modelProbability > 1) {
    throw new Error("Model probability must be a finite value between 0 and 1.");
  }

  if (!Number.isFinite(odds) || odds <= 1) {
    throw new Error("Odds must be a finite decimal value greater than 1.");
  }

  const profitIfWin = odds - 1;

  return modelProbability * profitIfWin - (1 - modelProbability);
}

export type Recommendation = "OVER" | "UNDER" | "NO_BET";

export type RecommendationResult = {
  recommendation: Recommendation;
  recommendedLine: number | null;
  recommendedOdds: number | null;
  reason: string;
};

export function getRecommendationFromEV(input: {
  evOver: number;
  evUnder: number;
  overOdds: number;
  underOdds: number;
  expectedTotal: number;
  lineTotal: number;
}): RecommendationResult {
  const { evOver, evUnder, overOdds, underOdds, expectedTotal, lineTotal } = input;

  if (!meetsEvThreshold(evOver) && !meetsEvThreshold(evUnder)) {
    return {
      recommendation: "NO_BET",
      recommendedLine: null,
      recommendedOdds: null,
      reason: "No bet because neither side clears EV threshold.",
    };
  }

  if (evOver >= evUnder) {
    return {
      recommendation: "OVER",
      recommendedLine: lineTotal,
      recommendedOdds: overOdds,
      reason:
        expectedTotal >= lineTotal
          ? "Expected total is above the market line and over EV meets threshold."
          : "Over EV is stronger than under EV and meets threshold.",
    };
  }

  return {
    recommendation: "UNDER",
    recommendedLine: lineTotal,
    recommendedOdds: underOdds,
    reason:
      expectedTotal <= lineTotal
        ? "Expected total is below the market line and under EV meets threshold."
        : "Under EV is stronger than over EV and meets threshold.",
  };
}
