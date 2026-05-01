import { describe, expect, it } from "vitest";

import type { EnrichedGame, EnrichedGameRunProjection, GameOdds } from "../dto/types";
import { buildGameAnalysis } from "./gameAnalysisService";

function buildEnrichedGame(overrides: Partial<EnrichedGame> = {}): EnrichedGame {
  return {
    gamePk: 1,
    gameDate: "2026-05-01",
    homeTeam: "Yankees",
    awayTeam: "Red Sox",
    homeTeamId: 147,
    awayTeamId: 111,
    venue: "Yankee Stadium",
    status: "Scheduled",
    season: 2026,
    homeProbablePitcher: null,
    awayProbablePitcher: null,
    homePitcherEra: 3.3,
    awayPitcherEra: 3.9,
    homeRunsPerGame: 4.7,
    awayRunsPerGame: 4.6,
    ...overrides,
  };
}

function buildProjection(overrides: Partial<EnrichedGameRunProjection> = {}): EnrichedGameRunProjection {
  return {
    gamePk: 1,
    gameDate: "2026-05-01",
    homeTeam: "Yankees",
    awayTeam: "Red Sox",
    homeExpectedRuns: 4.2,
    awayExpectedRuns: 4.0,
    totalExpectedRuns: 8.2,
    reason: "OK",
    ...overrides,
  };
}

function buildOdds(overrides: Partial<GameOdds> = {}): GameOdds {
  return {
    gamePk: 1,
    lineTotal: 7.5,
    overOdds: -110,
    underOdds: -110,
    sportsbook: "Testbook",
    retrievedAt: "2026-05-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildGameAnalysis", () => {
  it("returns probabilities and EV when all required inputs are present", () => {
    const [result] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame()],
      runProjections: [buildProjection()],
      odds: new Map([[1, buildOdds()]]),
    });

    expect(result.valid).toBe(true);
    expect(result.reason).toBe("OK");
    expect(result.overProbability).not.toBeNull();
    expect(result.underProbability).not.toBeNull();
    expect(result.overEV).not.toBeNull();
    expect(result.underEV).not.toBeNull();
  });

  it("returns invalid when run projection is missing", () => {
    const [result] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame()],
      runProjections: [],
      odds: new Map([[1, buildOdds()]]),
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing data for probability or EV calculation");
  });

  it("returns invalid when odds are missing", () => {
    const [result] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame()],
      runProjections: [buildProjection()],
      odds: new Map(),
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing data for probability or EV calculation");
  });

  it("returns invalid when line total is missing", () => {
    const [result] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame()],
      runProjections: [buildProjection()],
      odds: new Map([[1, buildOdds({ lineTotal: null })]]),
    });

    expect(result.valid).toBe(false);
    expect(result.reason).toBe("Missing data for probability or EV calculation");
  });

  it("produces positive and negative EV signs based on probability edge", () => {
    const [positive] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame()],
      runProjections: [buildProjection({ totalExpectedRuns: 10.4 })],
      odds: new Map([[1, buildOdds({ lineTotal: 8, overOdds: -110, underOdds: -110 })]]),
    });

    expect(positive.overEV).toBeGreaterThan(0);
    expect(positive.underEV).toBeLessThan(0);

    const [negative] = buildGameAnalysis({
      enrichedGames: [buildEnrichedGame({ gamePk: 2 })],
      runProjections: [buildProjection({ gamePk: 2, totalExpectedRuns: 6.1 })],
      odds: new Map([[2, buildOdds({ gamePk: 2, lineTotal: 8, overOdds: -110, underOdds: -110 })]]),
    });

    expect(negative.overEV).toBeLessThan(0);
    expect(negative.underEV).toBeGreaterThan(0);
  });
});
