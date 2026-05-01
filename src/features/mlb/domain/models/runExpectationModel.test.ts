import { describe, expect, it } from "vitest";

import type { EnrichedGame } from "../../application/dto/types";
import { computeExpectedRuns } from "./runExpectationModel";

function buildGame(overrides: Partial<EnrichedGame> = {}): EnrichedGame {
  return {
    gamePk: 1,
    gameDate: "2026-05-01",
    homeTeam: "Home",
    awayTeam: "Away",
    homeTeamId: 100,
    awayTeamId: 200,
    venue: "Ballpark",
    status: "Scheduled",
    season: 2026,
    homeProbablePitcher: null,
    awayProbablePitcher: null,
    homePitcherEra: 4.1,
    awayPitcherEra: 3.8,
    homeRunsPerGame: 4.9,
    awayRunsPerGame: 4.5,
    ...overrides,
  };
}

describe("computeExpectedRuns", () => {
  it("returns correct values when all inputs exist", () => {
    const game = buildGame({
      homeRunsPerGame: 5,
      awayRunsPerGame: 4,
      homePitcherEra: 3,
      awayPitcherEra: 5,
    });

    expect(computeExpectedRuns(game)).toEqual({
      homeExpectedRuns: 5,
      awayExpectedRuns: 3.5,
      totalExpectedRuns: 8.5,
    });
  });

  it("returns null when any required field is missing", () => {
    expect(computeExpectedRuns(buildGame({ homeRunsPerGame: null }))).toBeNull();
    expect(computeExpectedRuns(buildGame({ awayRunsPerGame: null }))).toBeNull();
    expect(computeExpectedRuns(buildGame({ homePitcherEra: null }))).toBeNull();
    expect(computeExpectedRuns(buildGame({ awayPitcherEra: null }))).toBeNull();
  });

  it("rounding works correctly", () => {
    const game = buildGame({
      homeRunsPerGame: 4.9999,
      awayPitcherEra: 3.3333,
      awayRunsPerGame: 4.4444,
      homePitcherEra: 2.2222,
    });

    expect(computeExpectedRuns(game)).toEqual({
      homeExpectedRuns: 4.167,
      awayExpectedRuns: 3.333,
      totalExpectedRuns: 7.5,
    });
  });
});
