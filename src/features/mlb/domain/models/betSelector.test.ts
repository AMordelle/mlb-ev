import { describe, expect, it } from "vitest";

import type { GameAnalysis } from "@/features/mlb/application/dto/types";

import { selectBets } from "./betSelector";

const buildGameAnalysis = (overrides: Partial<GameAnalysis> = {}): GameAnalysis => ({
  gamePk: 1001,
  gameDate: "2026-05-01",
  homeTeam: "LAD",
  awayTeam: "NYY",
  lineTotal: 8.5,
  overOdds: -110,
  underOdds: -110,
  homeExpectedRuns: 4.3,
  awayExpectedRuns: 4.2,
  totalExpectedRuns: 8.5,
  overProbability: 0.54,
  underProbability: 0.46,
  overEV: 0.03,
  underEV: 0.01,
  valid: true,
  reason: "Valid",
  ...overrides,
});

describe("selectBets", () => {
  it("selects OVER when overEV is higher and passes thresholds", () => {
    const result = selectBets([buildGameAnalysis()]);

    expect(result).toEqual([
      {
        gamePk: 1001,
        betType: "OVER",
        line: 8.5,
        odds: -110,
        probability: 0.54,
        ev: 0.03,
        reason: "Selected because EV and probability pass thresholds.",
      },
    ]);
  });

  it("selects UNDER when underEV is higher and passes thresholds", () => {
    const result = selectBets([
      buildGameAnalysis({
        overProbability: 0.45,
        underProbability: 0.55,
        overEV: 0.01,
        underEV: 0.04,
      }),
    ]);

    expect(result).toEqual([
      {
        gamePk: 1001,
        betType: "UNDER",
        line: 8.5,
        odds: -110,
        probability: 0.55,
        ev: 0.04,
        reason: "Selected because EV and probability pass thresholds.",
      },
    ]);
  });

  it("skips invalid games", () => {
    const result = selectBets([buildGameAnalysis({ valid: false })]);

    expect(result).toEqual([]);
  });

  it("skips when EV is below 0.02", () => {
    const result = selectBets([
      buildGameAnalysis({
        overEV: 0.019,
        underEV: 0.01,
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("skips when probability is below 0.52", () => {
    const result = selectBets([
      buildGameAnalysis({
        overProbability: 0.519,
        overEV: 0.03,
        underEV: 0.01,
      }),
    ]);

    expect(result).toEqual([]);
  });

  it("skips when required fields are null", () => {
    const missingLine = buildGameAnalysis({ lineTotal: null });
    const missingOverOdds = buildGameAnalysis({ gamePk: 1002, overOdds: null });
    const missingUnderOdds = buildGameAnalysis({ gamePk: 1003, underOdds: null });
    const missingOverProbability = buildGameAnalysis({ gamePk: 1004, overProbability: null });
    const missingUnderProbability = buildGameAnalysis({ gamePk: 1005, underProbability: null });
    const missingOverEV = buildGameAnalysis({ gamePk: 1006, overEV: null });
    const missingUnderEV = buildGameAnalysis({ gamePk: 1007, underEV: null });

    const result = selectBets([
      missingLine,
      missingOverOdds,
      missingUnderOdds,
      missingOverProbability,
      missingUnderProbability,
      missingOverEV,
      missingUnderEV,
    ]);

    expect(result).toEqual([]);
  });

  it("returns multiple valid selected bets", () => {
    const firstGame = buildGameAnalysis({ gamePk: 2001, overEV: 0.05, overProbability: 0.56 });
    const secondGame = buildGameAnalysis({
      gamePk: 2002,
      overEV: 0.01,
      underEV: 0.03,
      overProbability: 0.48,
      underProbability: 0.53,
    });

    const result = selectBets([firstGame, secondGame]);

    expect(result).toHaveLength(2);
    expect(result[0]?.betType).toBe("OVER");
    expect(result[1]?.betType).toBe("UNDER");
  });

  it("selects OVER on EV tie when thresholds pass", () => {
    const result = selectBets([
      buildGameAnalysis({
        overEV: 0.03,
        underEV: 0.03,
        overProbability: 0.53,
      }),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.betType).toBe("OVER");
  });
});
