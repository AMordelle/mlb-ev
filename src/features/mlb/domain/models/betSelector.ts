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

    const requiredValues = [
      game.lineTotal,
      game.overOdds,
      game.underOdds,
      game.overProbability,
      game.underProbability,
      game.overEV,
      game.underEV,
    ];

    if (requiredValues.some((value) => value === null)) {
      return [];
    }

    const selectedSide =
      game.overEV >= game.underEV
        ? {
            betType: "OVER" as const,
            odds: game.overOdds,
            probability: game.overProbability,
            ev: game.overEV,
          }
        : {
            betType: "UNDER" as const,
            odds: game.underOdds,
            probability: game.underProbability,
            ev: game.underEV,
          };

    if (selectedSide.ev < MIN_EV || selectedSide.probability < MIN_PROBABILITY) {
      return [];
    }

    return [
      {
        gamePk: game.gamePk,
        betType: selectedSide.betType,
        line: game.lineTotal,
        odds: selectedSide.odds,
        probability: selectedSide.probability,
        ev: selectedSide.ev,
        reason: "Selected because EV and probability pass thresholds.",
      },
    ];
  });
}
