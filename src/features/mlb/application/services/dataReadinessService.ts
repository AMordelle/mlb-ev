import type { GameAnalysis } from "../dto/types";

export type DataReadinessSummary = {
  totalGames: number;
  validGames: number;
  invalidGames: number;
  readinessRate: number;
  missingProjection: number;
  missingOdds: number;
  missingLine: number;
  other: number;
};

function includesReason(reason: string, target: string): boolean {
  return reason.toLowerCase().includes(target);
}

export function buildDataReadinessSummary(analysis: GameAnalysis[]): DataReadinessSummary {
  let validGames = 0;
  let invalidGames = 0;
  let missingProjection = 0;
  let missingOdds = 0;
  let missingLine = 0;
  let other = 0;

  for (const game of analysis) {
    if (game.valid) {
      validGames += 1;
      continue;
    }

    invalidGames += 1;

    if (includesReason(game.reason, "projection")) {
      missingProjection += 1;
    } else if (includesReason(game.reason, "odds")) {
      missingOdds += 1;
    } else if (includesReason(game.reason, "line")) {
      missingLine += 1;
    } else {
      other += 1;
    }
  }

  const totalGames = analysis.length;
  const readinessRate = totalGames === 0 ? 0 : Number((validGames / totalGames).toFixed(3));

  return {
    totalGames,
    validGames,
    invalidGames,
    readinessRate,
    missingProjection,
    missingOdds,
    missingLine,
    other,
  };
}
