import type { GameUpsertInput } from "../../application/dto/types";
import { mlbApiClient } from "../clients/mlbApiClient";

function mapScheduleGameToRecord(game: Awaited<ReturnType<typeof mlbApiClient.getSchedule>>[number], date: string): GameUpsertInput | null {
  if (!game.homeTeam || !game.awayTeam) {
    return null;
  }

  const gameDate = game.officialDate ?? date;

  return {
    gamePk: game.gamePk,
    gameDate,
    officialDatetime: game.gameDateTime,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeTeamId: game.homeTeamId,
    awayTeamId: game.awayTeamId,
    venue: game.venue,
    status: game.status ?? "Unknown",
    season: game.season,
  };
}

export async function scheduleProvider(date: string): Promise<GameUpsertInput[]> {
  const scheduleGames = await mlbApiClient.getSchedule(date);

  return scheduleGames
    .map((game) => mapScheduleGameToRecord(game, date))
    .filter((game): game is GameUpsertInput => game !== null);
}
