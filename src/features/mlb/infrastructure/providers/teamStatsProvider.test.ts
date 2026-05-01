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
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get(1)?.runsPerGame).toBe(4);
    expect(result.get(2)?.runsPerGame).toBe(4);
    expect(result.size).toBe(2);
  });

  it("creates map entries keyed by schedule team IDs", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 10, teamName: "Home", season: 2026, runs: 141, gamesPlayed: 30 },
      { teamId: 20, teamName: "Away", season: 2026, runs: 99, gamesPlayed: 25 },
      { teamId: 30, teamName: "Other", season: 2026, runs: 110, gamesPlayed: 26 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 10, awayTeamId: 20, venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect([...result.keys()]).toEqual([10, 20]);
    expect(result.get(10)?.runsPerGame).toBe(4.7);
    expect(result.get(20)?.runsPerGame).toBe(3.96);
  });

  it("returns null runsPerGame when runs are missing", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 1, teamName: "Home", season: 2026, runs: null, gamesPlayed: 30 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get(1)?.runsPerGame).toBeNull();
  });

  it("returns null runsPerGame when games played are zero", async () => {
    vi.spyOn(mlbApiClient, "getTeamSeasonHittingStats").mockResolvedValue([
      { teamId: 1, teamName: "Home", season: 2026, runs: 100, gamesPlayed: 0 },
    ]);

    const result = await teamStatsProvider([
      { gamePk: 1, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);

    expect(result.get(1)?.runsPerGame).toBeNull();
  });
});
