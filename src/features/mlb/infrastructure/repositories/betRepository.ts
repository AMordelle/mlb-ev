import type { BetRecord, BetResultStatus } from "@/features/mlb/domain/models/betRecord";

let bets: BetRecord[] = [];

export function saveBet(record: BetRecord): BetRecord {
  const existingBet = bets.find((bet) => bet.id === record.id);

  if (existingBet) {
    return existingBet;
  }

  bets = [...bets, record];

  return record;
}

export function getAllBets(): BetRecord[] {
  return [...bets];
}

export function updateBetResult(params: { id: string; result: BetResultStatus; bankrollAfter?: number }): BetRecord | null {
  const betIndex = bets.findIndex((bet) => bet.id === params.id);

  if (betIndex === -1) {
    return null;
  }

  const currentBet = bets[betIndex];
  if (!currentBet) {
    return null;
  }

  const updatedBet: BetRecord = {
    ...currentBet,
    result: params.result,
    ...(params.bankrollAfter === undefined ? {} : { bankrollAfter: params.bankrollAfter }),
  };

  bets = bets.map((bet) => (bet.id === params.id ? updatedBet : bet));

  return updatedBet;
}

export function clearBetsForTests(): void {
  bets = [];
}
