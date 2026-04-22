import { describe, expect, it } from "vitest";

import type { GameAnalysisInput, GameAnalysisResult } from "../dto/types";
import { analyzeTodayGames } from "./analyzeTodayGames";
import { getTopOpportunities } from "./getTopOpportunities";

function createGameInput(overrides: Partial<GameAnalysisInput>): GameAnalysisInput {
  return {
    gameId: "game-default",
    homeRG: 5.1,
    awayRG: 4.8,
    homePitcher: "Home Pitcher",
    awayPitcher: "Away Pitcher",
    homeERA: 3.7,
    awayERA: 3.9,
    lineTotal: 8.5,
    overOdds: 2.2,
    underOdds: 1.85,
    dataConfidence: "MEDIUM",
    ...overrides,
  };
}

function createAnalysisResult(overrides: Partial<GameAnalysisResult>): GameAnalysisResult {
  return {
    gameId: "result-default",
    expectedRunsHome: 4,
    expectedRunsAway: 4,
    expectedTotal: 8,
    probOver: 0.5,
    probUnder: 0.5,
    impliedProbOver: 0.5,
    impliedProbUnder: 0.5,
    evOver: 0.05,
    evUnder: 0.01,
    confidence: "MEDIUM",
    recommendation: "OVER",
    recommendedLine: 8,
    recommendedOdds: 2,
    reason: "fixture",
    ...overrides,
  };
}

describe("getTopOpportunities", () => {
  it("excludes NO_BET results and returns ranked bettable opportunities", () => {
    const results = [
      createAnalysisResult({ gameId: "g1", recommendation: "NO_BET", evOver: 0.01, evUnder: 0.02 }),
      createAnalysisResult({ gameId: "g2", recommendation: "OVER", evOver: 0.06 }),
      createAnalysisResult({ gameId: "g3", recommendation: "UNDER", evUnder: 0.11 }),
    ];

    const top = getTopOpportunities(results);

    expect(top.map((item) => item.gameId)).toEqual(["g3", "g2"]);
    expect(top.every((item) => item.recommendation !== "NO_BET")).toBe(true);
  });
});

describe("analyzeTodayGames", () => {
  it("returns daily scan summary for valid opportunities", () => {
    const result = analyzeTodayGames({
      date: "2026-04-22",
      gameInputs: [
        createGameInput({ gameId: "g-over", homeRG: 6, awayRG: 5.5, lineTotal: 8.5, overOdds: 2.25, underOdds: 1.8 }),
        createGameInput({ gameId: "g-under", homeRG: 2.8, awayRG: 2.6, lineTotal: 8.5, overOdds: 1.95, underOdds: 2.1 }),
      ],
    });

    expect(result.analyzed).toBe(2);
    expect(result.discarded).toBe(0);
    expect(result.topOpportunities.length).toBeGreaterThan(0);
    expect(result.primaryPick).not.toBeNull();
    expect(Array.isArray(result.risks)).toBe(true);
  });

  it("returns no primary pick and no top opportunities when all games are NO_BET", () => {
    const result = analyzeTodayGames({
      date: "2026-04-22",
      gameInputs: [
        createGameInput({ gameId: "g1", homeRG: 4, awayRG: 4, homeERA: 4, awayERA: 4, lineTotal: 8, overOdds: 2, underOdds: 2 }),
        createGameInput({ gameId: "g2", homeRG: 5, awayRG: 5, homeERA: 4, awayERA: 6, lineTotal: 10, overOdds: 2, underOdds: 2 }),
      ],
    });

    expect(result.primaryPick).toBeNull();
    expect(result.topOpportunities).toEqual([]);
    expect(result.risks).toContain("No opportunities cleared EV threshold.");
  });

  it("discards invalid inputs while keeping analyzed count and adding input risk", () => {
    const result = analyzeTodayGames({
      date: "2026-04-22",
      gameInputs: [
        createGameInput({ gameId: "g-valid", homeRG: 6.2, awayRG: 5.1, lineTotal: 8.5, overOdds: 2.2, underOdds: 1.84 }),
        createGameInput({ gameId: "", homePitcher: "", lineTotal: -1, overOdds: 1, underOdds: 1.9 }),
      ],
    });

    expect(result.analyzed).toBe(2);
    expect(result.discarded).toBe(1);
    expect(result.risks).toContain("Some games were discarded due to invalid or incomplete inputs.");
  });
});
