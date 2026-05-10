import type { BetRecord } from "@/features/mlb/domain/models/betRecord";

export type HistorySummary = {
  totalBets: number;
  pendingBets: number;
  wins: number;
  losses: number;
  pushes: number;
  totalStaked: number;
  totalProfit: number;
  winRate: number;
  yield: number;
  bankrollCurrent: number | null;
};

function roundToDecimals(value: number, decimals: number): number {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function calculateBetProfit(bet: BetRecord): number {
  if (bet.result === "LOSS") {
    return -bet.stake;
  }

  if (bet.result === "PUSH" || bet.result === "PENDING") {
    return 0;
  }

  if (bet.odds < 0) {
    return bet.stake * (100 / Math.abs(bet.odds));
  }

  return bet.stake * (bet.odds / 100);
}

export function buildHistorySummary(bets: BetRecord[]): HistorySummary {
  const resolvedBets = bets.filter((bet) => bet.result !== "PENDING");
  const wins = bets.filter((bet) => bet.result === "WIN").length;
  const losses = bets.filter((bet) => bet.result === "LOSS").length;
  const pushes = bets.filter((bet) => bet.result === "PUSH").length;
  const pendingBets = bets.filter((bet) => bet.result === "PENDING").length;
  const totalStaked = bets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfit = bets.reduce((sum, bet) => sum + calculateBetProfit(bet), 0);
  const lastResolvedBet = resolvedBets.at(-1);

  return {
    totalBets: bets.length,
    pendingBets,
    wins,
    losses,
    pushes,
    totalStaked,
    totalProfit: roundToDecimals(totalProfit, 2),
    winRate: resolvedBets.length === 0 ? 0 : roundToDecimals(wins / resolvedBets.length, 3),
    yield: totalStaked === 0 ? 0 : roundToDecimals(totalProfit / totalStaked, 3),
    bankrollCurrent: lastResolvedBet?.bankrollAfter ?? null,
  };
}
