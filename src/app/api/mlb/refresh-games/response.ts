import type {
  EnrichedGame,
  EnrichedGameRunProjection,
  GameAnalysis,
  GameOdds,
  GameRecord,
} from "@/features/mlb/application/dto/types";
import { selectBets, type SelectedBet } from "@/features/mlb/domain/models/betSelector";

export type RefreshGamesPayload = {
  ok: true;
  date: string;
  count: number;
  games: GameRecord[];
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Record<string, GameOdds>;
  analysis: GameAnalysis[];
  selectedBets: SelectedBet[];
};

export function buildRefreshGamesPayload(params: {
  date: string;
  games: GameRecord[];
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Map<number, GameOdds>;
  analysis: GameAnalysis[];
}): RefreshGamesPayload {
  const { date, games, enrichedGames, runProjections, odds, analysis } = params;

  return {
    ok: true,
    date,
    count: games.length,
    games,
    enrichedGames,
    runProjections,
    odds: Object.fromEntries(odds),
    analysis,
    selectedBets: selectBets(analysis),
  };
}
