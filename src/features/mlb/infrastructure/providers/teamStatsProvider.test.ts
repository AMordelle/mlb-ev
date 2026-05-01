import { describe, expect, it, vi } from "vitest";

import { mlbApiClient } from "../clients/mlbApiClient";
import { teamStatsProvider } from "./teamStatsProvider";

describe("teamStatsProvider", () => {
  it("computes runs per game from team hitting stats", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 1, teamName: "Home", season: 2026, runs: 120, gamesPlayed: 30 },
      { teamId: 2, teamName: "Away", season: 2026, runs: 100, gamesPlayed: 25 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get("Home")?.runsPerGame).toBe(4);
    expect(result.get("Away")?.runsPerGame).toBe(4);
  });

  it("returns null runsPerGame when runs are missing", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 1, teamName: "Home", season: 2026, runs: null, gamesPlayed: 30 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get("Home")?.runsPerGame).toBeNull();
  });

  it("returns null runsPerGame when games played are zero", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 1, teamName: "Home", season: 2026, runs: 100, gamesPlayed: 0 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get("Home")?.runsPerGame).toBeNull();
  });
});
