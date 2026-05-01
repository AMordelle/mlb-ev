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
  createdAt?: string;
  updatedAt?: string;
};

export type GameUpsertInput = {
  id?: string;
  gamePk: number;
  gameDate: string;
  officialDatetime: string | null;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  venue: string | null;
  status: string;
  season: number | null;
};



export type ProbablePitcherInfo = {
  id: number;
  fullName: string;
};

export type PitcherStatLine = {
  pitcherId: number;
  pitcherName: string;
  era: number | null;
};

export type TeamStatLine = {
  teamId: number;
  teamName: string;
  runs: number | null;
  gamesPlayed: number | null;
  runsPerGame: number | null;
};

export type EnrichedGame = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number | null;
  awayTeamId: number | null;
  venue: string | null;
  status: string;
  season: number | null;
  homeProbablePitcher: ProbablePitcherInfo | null;
  awayProbablePitcher: ProbablePitcherInfo | null;
  homePitcherEra: number | null;
  awayPitcherEra: number | null;
  homeRunsPerGame: number | null;
  awayRunsPerGame: number | null;
};


export type EnrichedGameRunProjection = {
  gamePk: number;
  gameDate: string;
  homeTeam: string;
  awayTeam: string;
  homeExpectedRuns: number | null;
  awayExpectedRuns: number | null;
  totalExpectedRuns: number | null;
  reason: string;
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


export type SettingsRecord = {
  id?: string;
  bankroll: number;
  stakeBasePct: number;
  evThreshold: number;
  maxDailyPicks: number;
  market: "TOTALS";
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
