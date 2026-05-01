import type { GameUpsertInput, TeamStatLine } from "../../application/dto/types";
import { mlbApiClient } from "../clients/mlbApiClient";

function normalizeRunsPerGame(runs: number | null, gamesPlayed: number | null): number | null {
  if (runs === null || gamesPlayed === null || gamesPlayed === 0) {
    return null;
  }

  return Number((runs / gamesPlayed).toFixed(3));
}

export async function teamStatsProvider(games: GameUpsertInput[]): Promise<Map<string, TeamStatLine>> {
  const seasons = new Set(games.map((game) => game.season).filter((season): season is number => season !== null));

  if (seasons.size !== 1) {
    return new Map();
  }

  const [season] = [...seasons];
  const stats = await mlbApiClient.getTeamSeasonHittingStats(season);
  const teamNames = new Set(games.flatMap((game) => [game.homeTeam, game.awayTeam]));

  const statsByTeamName = new Map<string, TeamStatLine>();

  for (const stat of stats) {
    if (!teamNames.has(stat.teamName)) {
      continue;
    }

    statsByTeamName.set(stat.teamName, {
      teamId: stat.teamId,
      teamName: stat.teamName,
      runs: stat.runs,
      gamesPlayed: stat.gamesPlayed,
      runsPerGame: normalizeRunsPerGame(stat.runs, stat.gamesPlayed),
    });
  }

  return statsByTeamName;
}
