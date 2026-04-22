import type { GameAnalysisResult } from "../dto/types";
import { rankOpportunities } from "../../domain/services/rankOpportunities";

export function getTopOpportunities(results: GameAnalysisResult[]): GameAnalysisResult[] {
  const bettable = results.filter((result) => result.recommendation !== "NO_BET");

  return rankOpportunities(bettable);
}
