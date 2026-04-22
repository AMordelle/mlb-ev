import type { GameAnalysisInput } from "../dto/types";

type EnrichDailyGamesParams = {
  date: string;
  gameInputs: GameAnalysisInput[];
};

export function enrichDailyGames({ date, gameInputs }: EnrichDailyGamesParams): GameAnalysisInput[] {
  void date;

  return gameInputs;
}
