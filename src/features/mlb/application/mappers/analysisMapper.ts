import type { GameAnalysisInput, GameAnalysisResult } from "../dto/types";

export type AnalysisInputRow = {
  id?: string;
  game_id: string;
  home_rg: number;
  away_rg: number;
  home_pitcher: string;
  away_pitcher: string;
  home_era: number;
  away_era: number;
  line_total: number;
  over_odds: number;
  under_odds: number;
  data_confidence: GameAnalysisInput["dataConfidence"];
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AnalysisResultRow = {
  id?: string;
  game_id: string;
  expected_runs_home: number;
  expected_runs_away: number;
  expected_total: number;
  prob_over: number;
  prob_under: number;
  implied_prob_over: number;
  implied_prob_under: number;
  ev_over: number;
  ev_under: number;
  confidence: GameAnalysisResult["confidence"];
  recommendation: GameAnalysisResult["recommendation"];
  recommended_line?: number | null;
  recommended_odds?: number | null;
  reason?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function mapAnalysisInputRowToRecord(row: AnalysisInputRow): GameAnalysisInput {
  return {
    id: row.id,
    gameId: row.game_id,
    homeRG: row.home_rg,
    awayRG: row.away_rg,
    homePitcher: row.home_pitcher,
    awayPitcher: row.away_pitcher,
    homeERA: row.home_era,
    awayERA: row.away_era,
    lineTotal: row.line_total,
    overOdds: row.over_odds,
    underOdds: row.under_odds,
    dataConfidence: row.data_confidence,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapAnalysisResultRowToRecord(row: AnalysisResultRow): GameAnalysisResult {
  return {
    id: row.id,
    gameId: row.game_id,
    expectedRunsHome: row.expected_runs_home,
    expectedRunsAway: row.expected_runs_away,
    expectedTotal: row.expected_total,
    probOver: row.prob_over,
    probUnder: row.prob_under,
    impliedProbOver: row.implied_prob_over,
    impliedProbUnder: row.implied_prob_under,
    evOver: row.ev_over,
    evUnder: row.ev_under,
    confidence: row.confidence,
    recommendation: row.recommendation,
    recommendedLine: row.recommended_line,
    recommendedOdds: row.recommended_odds,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
