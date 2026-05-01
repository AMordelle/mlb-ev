import type { EnrichedGame, GameAnalysisInput } from "../dto/types";

function hasEligibleEraData(enrichedGame: EnrichedGame): boolean {
  return (
    typeof enrichedGame.homePitcherEra === "number" &&
    Number.isFinite(enrichedGame.homePitcherEra) &&
    typeof enrichedGame.awayPitcherEra === "number" &&
    Number.isFinite(enrichedGame.awayPitcherEra)
  );
}

export function mapEnrichedGameToAnalysisInput(enrichedGame: EnrichedGame): GameAnalysisInput | null {
  if (!hasEligibleEraData(enrichedGame)) {
    return null;
  }

  // ERA data alone is not sufficient to construct a valid GameAnalysisInput.
  // We intentionally skip until real R/G and odds inputs are available.
  return null;
}

export function buildAnalysisInputsFromEnrichedGames(enrichedGames: EnrichedGame[]): GameAnalysisInput[] {
  return enrichedGames
    .map((game) => mapEnrichedGameToAnalysisInput(game))
    .filter((input): input is GameAnalysisInput => input !== null);
}
