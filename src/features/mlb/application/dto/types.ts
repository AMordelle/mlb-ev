export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export type PickRecommendation = "OVER" | "UNDER" | "NO_BET";

export type PickResultStatus = "PENDING" | "WIN" | "LOSS" | "VOID";

export type GameRecord = {
  id: string;
  gamePk: number;
  gameDate: string;
  officialDatetime: string | null;
  homeTeam: string;
  awayTeam: string;
  venue: string | null;
  status: string;
  season: number | null;
  createdAt: string;
  updatedAt: string;
};

export type GameAnalysisInput = {
  id?: string;
  gameId: string;
  homeRG: number;
  awayRG: number;
  homePitcher: string;
  awayPitcher: string;
  homeERA: number;
  awayERA: number;
  lineTotal: number;
  overOdds: number;
  underOdds: number;
  dataConfidence: Confidence;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type GameAnalysisResult = {
  id?: string;
  gameId: string;
  expectedRunsHome: number;
  expectedRunsAway: number;
  expectedTotal: number;
  probOver: number;
  probUnder: number;
  impliedProbOver: number;
  impliedProbUnder: number;
  evOver: number;
  evUnder: number;
  confidence: Confidence;
  recommendation: PickRecommendation;
  recommendedLine?: number | null;
  recommendedOdds?: number | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type PickRecord = {
  id?: string;
  gameId: string;
  pickDate: string;
  market: "TOTALS";
  recommendation: Exclude<PickRecommendation, "NO_BET">;
  line: number;
  odds: number;
  ev: number;
  stakePct: number;
  stakeAmount?: number | null;
  confidence: Confidence;
  reason?: string | null;
  isPrimary: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ResultRecord = {
  id?: string;
  gameId: string;
  pickId?: string | null;
  finalHomeRuns: number;
  finalAwayRuns: number;
  finalTotal?: number;
  resultStatus: PickResultStatus;
  pnl?: number | null;
  settledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type DailyScanResult = {
  date: string;
  analyzed: number;
  discarded: number;
  primaryPick: GameAnalysisResult | null;
  topOpportunities: GameAnalysisResult[];
  risks: string[];
};
