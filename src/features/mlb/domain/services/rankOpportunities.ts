import type { GameAnalysisResult } from "../../application/dto/types";

const CONFIDENCE_SCORE: Record<GameAnalysisResult["confidence"], number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

function getRecommendedSideEv(result: GameAnalysisResult): number {
  if (result.recommendation === "OVER") {
    return result.evOver;
  }

  if (result.recommendation === "UNDER") {
    return result.evUnder;
  }

  return Math.max(result.evOver, result.evUnder);
}

function getAbsoluteEdge(result: GameAnalysisResult): number {
  return Math.abs(result.evOver - result.evUnder);
}

export function rankOpportunities(opportunities: GameAnalysisResult[]): GameAnalysisResult[] {
  return [...opportunities].sort((a, b) => {
    // Tie-breaker 1: highest EV on the recommended side.
    const evDiff = getRecommendedSideEv(b) - getRecommendedSideEv(a);
    if (evDiff !== 0) {
      return evDiff;
    }

    // Tie-breaker 2: stronger confidence.
    const confidenceDiff = CONFIDENCE_SCORE[b.confidence] - CONFIDENCE_SCORE[a.confidence];
    if (confidenceDiff !== 0) {
      return confidenceDiff;
    }

    // Tie-breaker 3: stronger absolute edge between over/under EV values.
    const absoluteEdgeDiff = getAbsoluteEdge(b) - getAbsoluteEdge(a);
    if (absoluteEdgeDiff !== 0) {
      return absoluteEdgeDiff;
    }

    // Final deterministic tie-breaker: gameId lexical order.
    return a.gameId.localeCompare(b.gameId);
  });
}
