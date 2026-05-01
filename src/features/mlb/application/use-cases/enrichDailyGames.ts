import { scheduleProvider } from "../../infrastructure/providers/scheduleProvider";
import { pitcherStatsProvider } from "../../infrastructure/providers/pitcherStatsProvider";
import { mlbApiClient } from "../../infrastructure/clients/mlbApiClient";
import type { EnrichedGame, GameAnalysisInput } from "../dto/types";
import { buildAnalysisInputsFromEnrichedGames as buildAnalysisInputs } from "../mappers/enrichedGameMapper";

type EnrichDailyGamesParams = {
  date: string;
};

export async function enrichDailyGames({ date }: EnrichDailyGamesParams): Promise<EnrichedGame[]> {
  const baseGames = await scheduleProvider(date);
  const scheduleGames = await mlbApiClient.getSchedule(date);
  const scheduleByGamePk = new Map(scheduleGames.map((game) => [game.gamePk, game]));

  return Promise.all(
    baseGames.map(async (game) => {
      const scheduleGame = scheduleByGamePk.get(game.gamePk);
      const homeProbablePitcher = scheduleGame?.homeProbablePitcher ?? null;
      const awayProbablePitcher = scheduleGame?.awayProbablePitcher ?? null;

      const [homePitcherStats, awayPitcherStats] = await Promise.all([
        homeProbablePitcher ? pitcherStatsProvider(homeProbablePitcher, game.season) : Promise.resolve(null),
        awayProbablePitcher ? pitcherStatsProvider(awayProbablePitcher, game.season) : Promise.resolve(null),
      ]);

      return {
        gamePk: game.gamePk,
        gameDate: game.gameDate,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        venue: game.venue,
        status: game.status,
        season: game.season,
        homeProbablePitcher,
        awayProbablePitcher,
        homePitcherEra: homePitcherStats?.era ?? null,
        awayPitcherEra: awayPitcherStats?.era ?? null,
      };
    }),
  );
}


export function buildAnalysisInputsFromEnrichedGames(enrichedGames: EnrichedGame[]): GameAnalysisInput[] {
  return buildAnalysisInputs(enrichedGames);
}
