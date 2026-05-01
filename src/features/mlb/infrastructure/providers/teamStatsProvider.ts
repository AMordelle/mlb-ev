import type { GameUpsertInput, TeamStatLine } from "../../application/dto/types";
import { mlbApiClient } from "../clients/mlbApiClient";

function normalizeRunsPerGame(runs: number | null, gamesPlayed: number | null): number | null {
  if (runs === null || gamesPlayed === null || gamesPlayed === 0) {
    return null;
  }

  return Number((runs / gamesPlayed).toFixed(3));
}

export async function teamStatsProvider(games: GameUpsertInput[]): Promise<Map<number, TeamStatLine>> {
  const seasons = new Set(games.map((game) => game.season).filter((season): season is number => season !== null));

  if (seasons.size !== 1) {
    return new Map();
  }

  const [season] = [...seasons];
  const stats = await mlbApiClient.getTeamSeasonHittingStats(season);
  const teamIds = new Set(games.flatMap((game) => [game.homeTeamId, game.awayTeamId]).filter((teamId): teamId is number => teamId !== null));
  const statsByTeamId = new Map<number, TeamStatLine>();

  const availableStatsTeamIds = new Set(stats.map((stat) => stat.teamId));
  const missingTeamIds = [...teamIds].filter((teamId) => !availableStatsTeamIds.has(teamId));
  if (missingTeamIds.length > 0) {
    console.warn("teamStatsProvider missing season hitting stats for schedule team IDs", {
      season,
      missingTeamIds,
    });
  }

  for (const stat of stats) {
    if (!teamIds.has(stat.teamId)) {
      continue;
    }

    statsByTeamId.set(stat.teamId, {
      teamId: stat.teamId,
      teamName: stat.teamName,
      runs: stat.runs,
      gamesPlayed: stat.gamesPlayed,
      runsPerGame: normalizeRunsPerGame(stat.runs, stat.gamesPlayed),
    });
  }

  if (statsByTeamId.size === 0 && teamIds.size > 0) {
    console.warn("teamStatsProvider produced empty stats map", {
      season,
      scheduleTeamIds: [...teamIds],
      statsTeamIds: [...availableStatsTeamIds],
    });
  }

  return statsByTeamId;
}
