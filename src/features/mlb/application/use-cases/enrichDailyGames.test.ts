import { beforeEach, describe, expect, it, vi } from "vitest";

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  it("propagates home/away probable pitcher ERA into enrichment", async () => {
    vi.mocked(scheduleProvider).mockResolvedValue([
      { gamePk: 200, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);
    vi.mocked(mlbApiClient.getSchedule).mockResolvedValue([
      {
        gamePk: 200, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2,
        venue: null, status: "Scheduled", season: 2026,
        homeProbablePitcher: { id: 11, fullName: "Home Starter" },
        awayProbablePitcher: { id: 22, fullName: "Away Starter" },
      },
    ]);
    vi.mocked(pitcherStatsProvider)
      .mockResolvedValueOnce({ pitcherId: 11, pitcherName: "Home Starter", era: 3.85 })
      .mockResolvedValueOnce({ pitcherId: 22, pitcherName: "Away Starter", era: 4.12 });
    vi.mocked(teamStatsProvider).mockResolvedValue(new Map());

    const enriched = await enrichDailyGames({ date: "2026-04-01" });

    expect(enriched[0]?.homePitcherEra).toBe(3.85);
    expect(enriched[0]?.awayPitcherEra).toBe(4.12);
  });

  it("keeps ERA null when probable pitchers are missing", async () => {
    vi.mocked(scheduleProvider).mockResolvedValue([
      { gamePk: 201, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ]);
    vi.mocked(mlbApiClient.getSchedule).mockResolvedValue([
      {
        gamePk: 201, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home", awayTeam: "Away", homeTeamId: 1, awayTeamId: 2,
        venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: null, awayProbablePitcher: null,
      },
    ]);
    vi.mocked(teamStatsProvider).mockResolvedValue(new Map());

    const enriched = await enrichDailyGames({ date: "2026-04-01" });

    expect(vi.mocked(pitcherStatsProvider)).not.toHaveBeenCalled();
    expect(enriched[0]?.homePitcherEra).toBeNull();
    expect(enriched[0]?.awayPitcherEra).toBeNull();
  });

  it("caches pitcher ERA requests by pitcher id and season within a single enrichment run", async () => {
    vi.mocked(scheduleProvider).mockResolvedValue([
      { gamePk: 301, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home A", awayTeam: "Away A", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
      { gamePk: 302, gameDate: "2026-04-01", officialDatetime: null, homeTeam: "Home B", awayTeam: "Away B", homeTeamId: 3, awayTeamId: 4, venue: null, status: "Scheduled", season: 2026 },
    ]);
    vi.mocked(mlbApiClient.getSchedule).mockResolvedValue([
      {
        gamePk: 301, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home A", awayTeam: "Away A", homeTeamId: 1, awayTeamId: 2,
        venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: { id: 77, fullName: "Shared Starter" }, awayProbablePitcher: null,
      },
      {
        gamePk: 302, officialDate: "2026-04-01", gameDateTime: null, homeTeam: "Home B", awayTeam: "Away B", homeTeamId: 3, awayTeamId: 4,
        venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: { id: 77, fullName: "Shared Starter" }, awayProbablePitcher: null,
      },
    ]);
    vi.mocked(pitcherStatsProvider).mockResolvedValue({ pitcherId: 77, pitcherName: "Shared Starter", era: 3.01 });
    vi.mocked(teamStatsProvider).mockResolvedValue(new Map());

    const enriched = await enrichDailyGames({ date: "2026-04-01" });

    expect(vi.mocked(pitcherStatsProvider)).toHaveBeenCalledTimes(1);
    expect(enriched[0]?.homePitcherEra).toBe(3.01);
    expect(enriched[1]?.homePitcherEra).toBe(3.01);
  });

});
