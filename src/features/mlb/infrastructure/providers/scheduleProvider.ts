import type { GameRecord } from "../../application/dto/types";
import { mlbApiClient } from "../clients/mlbApiClient";

function mapScheduleGameToRecord(game: Awaited<ReturnType<typeof mlbApiClient.getSchedule>>[number], date: string): GameRecord | null {
  if (!game.homeTeam || !game.awayTeam) {
    return null;
  }

  const gameDate = game.officialDate ?? date;

  return {
    id: String(game.gamePk),
    gamePk: game.gamePk,
    gameDate,
    officialDatetime: game.gameDateTime,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    venue: game.venue,
    status: game.status ?? "Unknown",
    season: game.season,
  };
}

export async function scheduleProvider(date: string): Promise<GameRecord[]> {
  const scheduleGames = await mlbApiClient.getSchedule(date);

  return scheduleGames
    .map((game) => mapScheduleGameToRecord(game, date))
    .filter((game): game is GameRecord => game !== null);
}
