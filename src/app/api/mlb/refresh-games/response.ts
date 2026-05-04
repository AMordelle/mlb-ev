import type {
  EnrichedGame,
  EnrichedGameRunProjection,
  GameAnalysis,
  GameOdds,
  GameRecord,
} from "@/features/mlb/application/dto/types";

export type RefreshGamesPayload<TSelectedBet = unknown> = {
  ok: true;
  date: string;
  count: number;
  games: GameRecord[];
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Record<string, GameOdds>;
  analysis: GameAnalysis[];
  selectedBets: TSelectedBet[];
};

export function buildRefreshGamesPayload<TSelectedBet>(params: {
  date: string;
  games: GameRecord[];
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Map<number, GameOdds>;
  analysis: GameAnalysis[];
  selectedBets: TSelectedBet[];
}): RefreshGamesPayload<TSelectedBet> {
  const { date, games, enrichedGames, runProjections, odds, analysis, selectedBets } = params;

  return {
    ok: true,
    date,
    count: games.length,
    games,
    enrichedGames,
    runProjections,
    odds: Object.fromEntries(odds),
    analysis,
    selectedBets,
  };
}
