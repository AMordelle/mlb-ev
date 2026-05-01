import { describe, expect, it } from "vitest";

import type { EnrichedGame } from "../dto/types";
import { buildAnalysisInputsFromEnrichedGames, mapEnrichedGameToAnalysisInput } from "./enrichedGameMapper";

function createEnrichedGame(overrides: Partial<EnrichedGame> = {}): EnrichedGame {
  return {
    gamePk: 12345,
    gameDate: "2026-05-01",
    homeTeam: "NYY",
    awayTeam: "BOS",
    venue: "Sample Park",
    status: "Scheduled",
    season: 2026,
    homeProbablePitcher: { id: 1, fullName: "Home Pitcher" },
    awayProbablePitcher: { id: 2, fullName: "Away Pitcher" },
    homePitcherEra: 3.21,
    awayPitcherEra: 3.89,
    ...overrides,
  };
}

describe("mapEnrichedGameToAnalysisInput", () => {
  it("returns null even when ERA exists because R/G and odds are missing", () => {
    const input = mapEnrichedGameToAnalysisInput(createEnrichedGame());

    expect(input).toBeNull();
  });

  it("returns null when either ERA is missing", () => {
    const missingHomeEra = mapEnrichedGameToAnalysisInput(createEnrichedGame({ homePitcherEra: null }));
    const missingAwayEra = mapEnrichedGameToAnalysisInput(createEnrichedGame({ awayPitcherEra: null }));

    expect(missingHomeEra).toBeNull();
    expect(missingAwayEra).toBeNull();
  });
});

describe("buildAnalysisInputsFromEnrichedGames", () => {
  it("filters mapper output and currently returns an empty list", () => {
    const inputs = buildAnalysisInputsFromEnrichedGames([
      createEnrichedGame({ gamePk: 1, homePitcherEra: 2.9, awayPitcherEra: 4.1 }),
      createEnrichedGame({ gamePk: 2, homePitcherEra: null }),
      createEnrichedGame({ gamePk: 3, homePitcherEra: 3.5, awayPitcherEra: 3.7 }),
    ]);

    expect(inputs).toEqual([]);
  });
});
