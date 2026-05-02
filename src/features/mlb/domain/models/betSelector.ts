import type { GameAnalysis } from "@/features/mlb/application/dto/types";

export type SelectedBet = {
  gamePk: number;
  betType: "OVER" | "UNDER";
  line: number;
  odds: number;
  probability: number;
  ev: number;
  reason: string;
};

const MIN_EV = 0.02;
const MIN_PROBABILITY = 0.52;

export function selectBets(analysis: GameAnalysis[]): SelectedBet[] {
  return analysis.flatMap((game) => {
    if (!game.valid) {
      return [];
    }

    const line = game.lineTotal;
    const overOdds = game.overOdds;
    const underOdds = game.underOdds;
    const overProbability = game.overProbability;
    const underProbability = game.underProbability;
    const overEV = game.overEV;
    const underEV = game.underEV;

    if (
      line === null ||
      overOdds === null ||
      underOdds === null ||
      overProbability === null ||
      underProbability === null ||
      overEV === null ||
      underEV === null
    ) {
      return [];
    }

    const selectedSide =
      overEV >= underEV
        ? {
            betType: "OVER" as const,
            odds: overOdds,
            probability: overProbability,
            ev: overEV,
          }
        : {
            betType: "UNDER" as const,
            odds: underOdds,
            probability: underProbability,
            ev: underEV,
          };

    if (selectedSide.ev < MIN_EV || selectedSide.probability < MIN_PROBABILITY) {
      return [];
    }

    return [
      {
        gamePk: game.gamePk,
        betType: selectedSide.betType,
        line: line,
        odds: selectedSide.odds,
        probability: selectedSide.probability,
        ev: selectedSide.ev,
        reason: "Selected because EV and probability pass thresholds.",
      },
    ];
  });
}
