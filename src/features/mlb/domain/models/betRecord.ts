export type BetResultStatus = "PENDING" | "WIN" | "LOSS" | "PUSH";

export type BetRecord = {
  id: string;
  date: string;
  gamePk: number;
  betType: "OVER" | "UNDER";
  line: number;
  odds: number;
  modelProbability: number;
  ev: number;
  stake: number;
  result: BetResultStatus;
  closingLine?: number;
  closingOdds?: number;
  bankrollBefore: number;
  bankrollAfter?: number;
};
