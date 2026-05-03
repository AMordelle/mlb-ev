import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/features/mlb/infrastructure/providers/scheduleProvider", () => ({
  scheduleProvider: vi.fn(),
}));
vi.mock("@/features/mlb/infrastructure/repositories/gamesRepository", () => ({
  gamesRepository: { upsertGames: vi.fn() },
}));
vi.mock("@/features/mlb/application/use-cases/enrichDailyGames", () => ({
  enrichDailyGames: vi.fn(),
  buildRunProjectionsFromEnrichedGames: vi.fn(),
}));
vi.mock("@/features/mlb/infrastructure/providers/oddsProvider", () => ({
  getOddsForGames: vi.fn(),
}));

import { POST } from "./route";
import { scheduleProvider } from "@/features/mlb/infrastructure/providers/scheduleProvider";
import { gamesRepository } from "@/features/mlb/infrastructure/repositories/gamesRepository";
import { enrichDailyGames, buildRunProjectionsFromEnrichedGames } from "@/features/mlb/application/use-cases/enrichDailyGames";
import { getOddsForGames } from "@/features/mlb/infrastructure/providers/oddsProvider";

const mockedScheduleProvider = vi.mocked(scheduleProvider);
const mockedUpsertGames = vi.mocked(gamesRepository.upsertGames);
const mockedEnrichDailyGames = vi.mocked(enrichDailyGames);
const mockedBuildRunProjections = vi.mocked(buildRunProjectionsFromEnrichedGames);
const mockedGetOddsForGames = vi.mocked(getOddsForGames);

describe("POST /api/mlb/refresh-games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns selectedBets array", async () => {
    const date = "2026-05-01";
    mockedScheduleProvider.mockResolvedValue([
      { gamePk: 10, gameDate: date, officialDatetime: null, homeTeam: "A", awayTeam: "B", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026 },
    ] as any);
    mockedUpsertGames.mockResolvedValue([
      { id: "g1", gamePk: 10, gameDate: date, officialDatetime: null, homeTeam: "A", awayTeam: "B", venue: null, status: "Scheduled", season: 2026 },
    ] as any);
    mockedEnrichDailyGames.mockResolvedValue([
      { gamePk: 10, gameDate: date, homeTeam: "A", awayTeam: "B", homeTeamId: 1, awayTeamId: 2, venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: null, awayProbablePitcher: null, homePitcherEra: 3.1, awayPitcherEra: 3.8, homeRunsPerGame: 4.8, awayRunsPerGame: 4.5 },
    ] as any);
    mockedBuildRunProjections.mockReturnValue([
      { gamePk: 10, gameDate: date, homeTeam: "A", awayTeam: "B", homeExpectedRuns: 4.7, awayExpectedRuns: 4.5, totalExpectedRuns: 9.2, reason: "ok" },
    ] as any);
    mockedGetOddsForGames.mockResolvedValue(new Map([[10, { gamePk: 10, lineTotal: 8.5, overOdds: -110, underOdds: -110, sportsbook: "x", retrievedAt: "2026-05-01T00:00:00.000Z" }]]));

    const response = await POST(new Request("http://localhost/api/mlb/refresh-games", { method: "POST", body: JSON.stringify({ date }) }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.selectedBets)).toBe(true);
    expect(body.selectedBets.length).toBeGreaterThan(0);
  });

  it("returns empty selectedBets when no valid bets", async () => {
    const date = "2026-05-01";
    mockedScheduleProvider.mockResolvedValue([
      { gamePk: 20, gameDate: date, officialDatetime: null, homeTeam: "C", awayTeam: "D", homeTeamId: 3, awayTeamId: 4, venue: null, status: "Scheduled", season: 2026 },
    ] as any);
    mockedUpsertGames.mockResolvedValue([
      { id: "g2", gamePk: 20, gameDate: date, officialDatetime: null, homeTeam: "C", awayTeam: "D", venue: null, status: "Scheduled", season: 2026 },
    ] as any);
    mockedEnrichDailyGames.mockResolvedValue([
      { gamePk: 20, gameDate: date, homeTeam: "C", awayTeam: "D", homeTeamId: 3, awayTeamId: 4, venue: null, status: "Scheduled", season: 2026, homeProbablePitcher: null, awayProbablePitcher: null, homePitcherEra: 4.1, awayPitcherEra: 3.9, homeRunsPerGame: 3.8, awayRunsPerGame: 3.7 },
    ] as any);
    mockedBuildRunProjections.mockReturnValue([
      { gamePk: 20, gameDate: date, homeTeam: "C", awayTeam: "D", homeExpectedRuns: 3.9, awayExpectedRuns: 3.8, totalExpectedRuns: 7.7, reason: "ok" },
    ] as any);
    mockedGetOddsForGames.mockResolvedValue(new Map([[20, { gamePk: 20, lineTotal: 8.5, overOdds: -110, underOdds: -110, sportsbook: "x", retrievedAt: "2026-05-01T00:00:00.000Z" }]]));

    const response = await POST(new Request("http://localhost/api/mlb/refresh-games", { method: "POST", body: JSON.stringify({ date }) }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.selectedBets).toEqual([]);
  });
});
