import type { EnrichedGame } from "../../application/dto/types";

export type RunExpectation = {
  homeExpectedRuns: number;
  awayExpectedRuns: number;
  totalExpectedRuns: number;
};

function roundToThreeDecimals(value: number): number {
  return Number(value.toFixed(3));
}

export function computeExpectedRuns(game: EnrichedGame): RunExpectation | null {
  if (
    game.homeRunsPerGame === null ||
    game.awayRunsPerGame === null ||
    game.homePitcherEra === null ||
    game.awayPitcherEra === null
  ) {
    return null;
  }

  const homeExpectedRuns =
    (game.homeRunsPerGame + game.awayPitcherEra) / 2;
  const awayExpectedRuns =
    (game.awayRunsPerGame + game.homePitcherEra) / 2;
  const totalExpectedRuns = homeExpectedRuns + awayExpectedRuns;

  return {
    homeExpectedRuns: roundToThreeDecimals(homeExpectedRuns),
    awayExpectedRuns: roundToThreeDecimals(awayExpectedRuns),
    totalExpectedRuns: roundToThreeDecimals(totalExpectedRuns),
  };
}
