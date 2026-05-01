import { describe, expect, it } from "vitest";

import type { GameAnalysis } from "../dto/types";
import { buildDataReadinessSummary } from "./dataReadinessService";

function buildAnalysis(overrides: Partial<GameAnalysis> = {}): GameAnalysis {
  return {
    gamePk: 1,
    gameDate: "2026-05-01",
    homeTeam: "Yankees",
    awayTeam: "Red Sox",
    lineTotal: 8.5,
    overOdds: -110,
    underOdds: -110,
    homeExpectedRuns: 4.1,
    awayExpectedRuns: 4,
    totalExpectedRuns: 8.1,
    overProbability: 0.5,
    underProbability: 0.5,
    overEV: 0.01,
    underEV: -0.01,
    valid: true,
    reason: "OK",
    ...overrides,
  };
}

describe("buildDataReadinessSummary", () => {
  it("summarizes all valid games", () => {
    const summary = buildDataReadinessSummary([buildAnalysis(), buildAnalysis({ gamePk: 2 })]);

    expect(summary).toEqual({
      totalGames: 2,
      validGames: 2,
      invalidGames: 0,
      readinessRate: 1,
      missingProjection: 0,
      missingOdds: 0,
      missingLine: 0,
      other: 0,
    });
  });

  it("summarizes all invalid games", () => {
    const summary = buildDataReadinessSummary([
      buildAnalysis({ gamePk: 1, valid: false, reason: "Missing projection data" }),
      buildAnalysis({ gamePk: 2, valid: false, reason: "Missing odds data" }),
      buildAnalysis({ gamePk: 3, valid: false, reason: "Missing line data" }),
      buildAnalysis({ gamePk: 4, valid: false, reason: "Unknown failure" }),
    ]);

    expect(summary.totalGames).toBe(4);
    expect(summary.validGames).toBe(0);
    expect(summary.invalidGames).toBe(4);
    expect(summary.readinessRate).toBe(0);
    expect(summary.missingProjection).toBe(1);
    expect(summary.missingOdds).toBe(1);
    expect(summary.missingLine).toBe(1);
    expect(summary.other).toBe(1);
  });

  it("handles mixed valid and invalid games", () => {
    const summary = buildDataReadinessSummary([
      buildAnalysis({ gamePk: 1, valid: true }),
      buildAnalysis({ gamePk: 2, valid: false, reason: "Missing projection for this game" }),
      buildAnalysis({ gamePk: 3, valid: true }),
      buildAnalysis({ gamePk: 4, valid: false, reason: "Missing odds for this game" }),
    ]);

    expect(summary.totalGames).toBe(4);
    expect(summary.validGames).toBe(2);
    expect(summary.invalidGames).toBe(2);
    expect(summary.readinessRate).toBe(0.5);
    expect(summary.missingProjection).toBe(1);
    expect(summary.missingOdds).toBe(1);
    expect(summary.missingLine).toBe(0);
    expect(summary.other).toBe(0);
  });

  it("classifies reasons case-insensitively", () => {
    const summary = buildDataReadinessSummary([
      buildAnalysis({ gamePk: 1, valid: false, reason: "PROJECTION unavailable" }),
      buildAnalysis({ gamePk: 2, valid: false, reason: "ODDS unavailable" }),
      buildAnalysis({ gamePk: 3, valid: false, reason: "LINE unavailable" }),
    ]);

    expect(summary.missingProjection).toBe(1);
    expect(summary.missingOdds).toBe(1);
    expect(summary.missingLine).toBe(1);
  });

  it("rounds readiness rate to 3 decimals", () => {
    const summary = buildDataReadinessSummary([
      buildAnalysis({ gamePk: 1, valid: true }),
      buildAnalysis({ gamePk: 2, valid: false, reason: "Missing projection" }),
      buildAnalysis({ gamePk: 3, valid: false, reason: "Missing odds" }),
    ]);

    expect(summary.readinessRate).toBe(0.333);
  });
});
