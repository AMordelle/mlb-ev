import type { EnrichedGame, EnrichedGameRunProjection, GameAnalysis, GameOdds } from "../dto/types";
import { computeEV } from "../../domain/models/evCalculator";
import { computeTotalProbabilities } from "../../domain/models/totalProbabilityModel";

const MISSING_DATA_REASON = "Missing data for probability or EV calculation";

export function buildGameAnalysis(params: {
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Map<number, GameOdds>;
}): GameAnalysis[] {
  const { enrichedGames, runProjections, odds } = params;

  const projectionByGamePk = new Map(runProjections.map((projection) => [projection.gamePk, projection]));

  return enrichedGames.map((game) => {
    const projection = projectionByGamePk.get(game.gamePk);
    const gameOdds = odds.get(game.gamePk);

    const analysis: GameAnalysis = {
      gamePk: game.gamePk,
      gameDate: game.gameDate,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      lineTotal: gameOdds?.lineTotal ?? null,
      overOdds: gameOdds?.overOdds ?? null,
      underOdds: gameOdds?.underOdds ?? null,
      homeExpectedRuns: projection?.homeExpectedRuns ?? null,
      awayExpectedRuns: projection?.awayExpectedRuns ?? null,
      totalExpectedRuns: projection?.totalExpectedRuns ?? null,
      overProbability: null,
      underProbability: null,
      overEV: null,
      underEV: null,
      valid: false,
      reason: MISSING_DATA_REASON,
    };

    if (
      analysis.totalExpectedRuns === null
      || analysis.lineTotal === null
      || analysis.overOdds === null
      || analysis.underOdds === null
    ) {
      return analysis;
    }

    const probability = computeTotalProbabilities({
      totalExpectedRuns: analysis.totalExpectedRuns,
      line: analysis.lineTotal,
    });

    if (!probability) {
      return analysis;
    }

    const ev = computeEV({
      overProbability: probability.overProbability,
      underProbability: probability.underProbability,
      overOdds: analysis.overOdds,
      underOdds: analysis.underOdds,
    });

    if (!ev) {
      return analysis;
    }

    return {
      ...analysis,
      overProbability: probability.overProbability,
      underProbability: probability.underProbability,
      overEV: ev.overEV,
      underEV: ev.underEV,
      valid: true,
      reason: "OK",
    };
  });
}
