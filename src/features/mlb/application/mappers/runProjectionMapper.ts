import type { EnrichedGame, EnrichedGameRunProjection } from "../dto/types";
import { computeExpectedRuns } from "../../domain/models/runExpectationModel";

const AVAILABLE_REASON = "Projection available from team R/G and pitcher ERA.";
const UNAVAILABLE_REASON = "Projection unavailable because team R/G or pitcher ERA is missing.";

export function buildRunProjectionsFromEnrichedGames(enrichedGames: EnrichedGame[]): EnrichedGameRunProjection[] {
  return enrichedGames.map((game) => {
    const expectedRuns = computeExpectedRuns(game);

    if (expectedRuns === null) {
      return {
        gamePk: game.gamePk,
        gameDate: game.gameDate,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeExpectedRuns: null,
        awayExpectedRuns: null,
        totalExpectedRuns: null,
        reason: UNAVAILABLE_REASON,
      };
    }

    return {
      gamePk: game.gamePk,
      gameDate: game.gameDate,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      homeExpectedRuns: expectedRuns.homeExpectedRuns,
      awayExpectedRuns: expectedRuns.awayExpectedRuns,
      totalExpectedRuns: expectedRuns.totalExpectedRuns,
      reason: AVAILABLE_REASON,
    };
  });
}
