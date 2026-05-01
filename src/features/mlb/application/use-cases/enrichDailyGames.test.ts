import { describe, expect, it, vi } from "vitest";

import { enrichDailyGames } from "./enrichDailyGames";

vi.mock("../../infrastructure/providers/scheduleProvider", () => ({
  scheduleProvider: vi.fn(),
}));

vi.mock("../../infrastructure/providers/pitcherStatsProvider", () => ({
  pitcherStatsProvider: vi.fn(),
}));

vi.mock("../../infrastructure/providers/teamStatsProvider", () => ({
  teamStatsProvider: vi.fn(),
}));

vi.mock("../../infrastructure/clients/mlbApiClient", () => ({
  mlbApiClient: {
    getSchedule: vi.fn(),
  },
}));

import { scheduleProvider } from "../../infrastructure/providers/scheduleProvider";
import { pitcherStatsProvider } from "../../infrastructure/providers/pitcherStatsProvider";
import { teamStatsProvider } from "../../infrastructure/providers/teamStatsProvider";
import { mlbApiClient } from "../../infrastructure/clients/mlbApiClient";

describe("enrichDailyGames", () => {
  it("attaches home and away runs per game", async () => {
    vi.mocked(scheduleProvider).mockResolvedValue([
      { gamePk: 100, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);
    vi.mocked(mlbApiClient.getSchedule).mockResolvedValue([
      {
        gamePk: 100, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2,
        venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: null, awayProbablePitcher: null,
      },
    ]);
    vi.mocked(pitcherStatsProvider).mockResolvedValue({ pitcherId: 0, pitcherName: "Unknown", era: null });
    vi.mocked(teamStatsProvider).mockResolvedValue(new Map([
      [1, { teamId: 1, teamName: "Home", runs: 120, gamesPlayed: 30, runsPerGame: 4 }],
      [2, { teamId: 2, teamName: "Away", runs: 100, gamesPlayed: 25, runsPerGame: 4 }],
    ]));

    const enriched = await enrichDailyGames({ date: "2026-04-01" });

    expect(enriched[0]?.homeRunsPerGame).toBe(4);
    expect(enriched[0]?.awayRunsPerGame).toBe(4);
  });

  it("returns null runs per game when team ids are missing", async () => {
    vi.mocked(scheduleProvider).mockResolvedValue([
      { gamePk: 101, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: null, awayTeamId: null, venue: null, status: "Scheduled", season: 2026 },
    ]);
    vi.mocked(mlbApiClient.getSchedule).mockResolvedValue([
      {
        gamePk: 101, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: null, awayTeamId: null,
        venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: null, awayProbablePitcher: null,
      },
    ]);
    vi.mocked(teamStatsProvider).mockResolvedValue(new Map([
      [1, { teamId: 1, teamName: "Home", runs: 120, gamesPlayed: 30, runsPerGame: 4 }],
    ]));

    const enriched = await enrichDailyGames({ date: "2026-04-01" });

    expect(enriched[0]?.homeRunsPerGame).toBeNull();
    expect(enriched[0]?.awayRunsPerGame).toBeNull();
  });
});
