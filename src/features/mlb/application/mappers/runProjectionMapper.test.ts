import { describe, expect, it } from "vitest";

import type { EnrichedGame } from "../dto/types";
import { buildRunProjectionsFromEnrichedGames } from "./runProjectionMapper";

function buildEnrichedGame(overrides: Partial<EnrichedGame> = {}): EnrichedGame {
  return {
    gamePk: 1,
    gameDate: "2026-05-01",
    homeTeam: "Home",
    awayTeam: "Away",
    homeTeamId: 10,
    awayTeamId: 20,
    venue: null,
    status: "Scheduled",
    season: 2026,
    homeProbablePitcher: { id: 100, fullName: "Home Pitcher" },
    awayProbablePitcher: { id: 200, fullName: "Away Pitcher" },
    homePitcherEra: 3,
    awayPitcherEra: 4,
    homeRunsPerGame: 5,
    awayRunsPerGame: 4,
    ...overrides,
  };
}

describe("buildRunProjectionsFromEnrichedGames", () => {
  it("creates projection when game has R/G and ERA", () => {
    const projections = buildRunProjectionsFromEnrichedGames([buildEnrichedGame()]);

    expect(projections).toEqual([
      {
        gamePk: 1,
        gameDate: "2026-05-01",
        homeTeam: "Home",
        awayTeam: "Away",
        homeExpectedRuns: 4.5,
        awayExpectedRuns: 3.5,
        totalExpectedRuns: 8,
        reason: "Projection available from team R/G and pitcher ERA.",
      },
    ]);
  });

  it("returns null projection when ERA is missing", () => {
    const projections = buildRunProjectionsFromEnrichedGames([buildEnrichedGame({ homePitcherEra: null })]);

    expect(projections[0]).toMatchObject({
      homeExpectedRuns: null,
      awayExpectedRuns: null,
      totalExpectedRuns: null,
      reason: "Projection unavailable because team R/G or pitcher ERA is missing.",
    });
  });

  it("returns null projection when R/G is missing", () => {
    const projections = buildRunProjectionsFromEnrichedGames([buildEnrichedGame({ awayRunsPerGame: null })]);

    expect(projections[0]).toMatchObject({
      homeExpectedRuns: null,
      awayExpectedRuns: null,
      totalExpectedRuns: null,
      reason: "Projection unavailable because team R/G or pitcher ERA is missing.",
    });
  });

  it("preserves all games in list mapping", () => {
    const projections = buildRunProjectionsFromEnrichedGames([
      buildEnrichedGame({ gamePk: 1 }),
      buildEnrichedGame({ gamePk: 2, homePitcherEra: null }),
    ]);

    expect(projections).toHaveLength(2);
    expect(projections[0]?.gamePk).toBe(1);
    expect(projections[1]?.gamePk).toBe(2);
  });
});
