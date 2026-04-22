import { describe, expect, it } from "vitest";

import type { GameAnalysisResult } from "../../application/dto/types";
import { getRecommendedStakePct, MAX_STAKE_PCT } from "./stakeRules";
import { getConfidenceLevel } from "./confidenceRules";
import { rankOpportunities } from "../services/rankOpportunities";

describe("stake rules", () => {
  it("returns 0 below EV threshold, 1 at threshold, and 2 for higher edge", () => {
    expect(getRecommendedStakePct(0.0399)).toBe(0);
    expect(getRecommendedStakePct(0.04)).toBe(1);
    expect(getRecommendedStakePct(0.0799)).toBe(1);
    expect(getRecommendedStakePct(0.08)).toBe(2);
  });

  it("never exceeds max stake", () => {
    expect(getRecommendedStakePct(100)).toBeLessThanOrEqual(MAX_STAKE_PCT);
  });
});

describe("confidence rules", () => {
  it("returns LOW for invalid inputs and unstable ERA values", () => {
    expect(
      getConfidenceLevel({
        homeERA: 0,
        awayERA: 3.5,
        lineTotal: 8,
        overOdds: 1.91,
        underOdds: 1.91,
      }),
    ).toBe("LOW");

    expect(
      getConfidenceLevel({
        homeERA: 3.2,
        awayERA: 3.6,
        lineTotal: 0,
        overOdds: 1.91,
        underOdds: 1.91,
      }),
    ).toBe("LOW");

    expect(
      getConfidenceLevel({
        homeERA: 0.5,
        awayERA: 3.2,
        lineTotal: 8,
        overOdds: 1.91,
        underOdds: 1.91,
      }),
    ).toBe("LOW");
  });

  it("returns HIGH for stable ERA range and MEDIUM otherwise", () => {
    expect(
      getConfidenceLevel({
        homeERA: 3.2,
        awayERA: 4.1,
        lineTotal: 8.5,
        overOdds: 1.95,
        underOdds: 1.87,
      }),
    ).toBe("HIGH");

    expect(
      getConfidenceLevel({
        homeERA: 6.5,
        awayERA: 3.4,
        lineTotal: 8.5,
        overOdds: 1.95,
        underOdds: 1.87,
      }),
    ).toBe("MEDIUM");
  });
});

describe("rankOpportunities", () => {
  function createResult(overrides: Partial<GameAnalysisResult>): GameAnalysisResult {
    return {
      gameId: "g-default",
      expectedRunsHome: 4,
      expectedRunsAway: 4,
      expectedTotal: 8,
      probOver: 0.5,
      probUnder: 0.5,
      impliedProbOver: 0.5,
      impliedProbUnder: 0.5,
      evOver: 0.01,
      evUnder: 0.01,
      confidence: "MEDIUM",
      recommendation: "OVER",
      recommendedLine: 8,
      recommendedOdds: 2,
      reason: "test",
      ...overrides,
    };
  }

  it("ranks by recommended-side EV first", () => {
    const ranked = rankOpportunities([
      createResult({ gameId: "g2", recommendation: "OVER", evOver: 0.09 }),
      createResult({ gameId: "g1", recommendation: "UNDER", evUnder: 0.12 }),
    ]);

    expect(ranked.map((item) => item.gameId)).toEqual(["g1", "g2"]);
  });

  it("applies deterministic tie-breakers and stable final ordering", () => {
    const ranked = rankOpportunities([
      createResult({ gameId: "b", recommendation: "OVER", evOver: 0.08, evUnder: 0.01, confidence: "MEDIUM" }),
      createResult({ gameId: "a", recommendation: "OVER", evOver: 0.08, evUnder: 0.01, confidence: "MEDIUM" }),
      createResult({ gameId: "c", recommendation: "OVER", evOver: 0.08, evUnder: 0.01, confidence: "HIGH" }),
    ]);

    expect(ranked.map((item) => item.gameId)).toEqual(["c", "a", "b"]);
  });
});
