import { afterEach, describe, expect, it } from "vitest";

import type { BetRecord } from "@/features/mlb/domain/models/betRecord";

import { clearBetsForTests, getAllBets, saveBet, updateBetResult } from "./betRepository";

const buildBetRecord = (overrides: Partial<BetRecord> = {}): BetRecord => ({
  id: "bet-1",
  date: "2026-05-10",
  gamePk: 12345,
  betType: "OVER",
  line: 8.5,
  odds: -110,
  modelProbability: 0.54,
  ev: 0.03,
  stake: 25,
  result: "PENDING",
  bankrollBefore: 1000,
  ...overrides,
});

describe("betRepository", () => {
  afterEach(() => {
    clearBetsForTests();
  });

  it("saves a bet", () => {
    const bet = buildBetRecord();

    const savedBet = saveBet(bet);

    expect(savedBet).toEqual(bet);
    expect(getAllBets()).toEqual([bet]);
  });

  it("returns a copy of all bets", () => {
    const bet = buildBetRecord();
    saveBet(bet);

    const allBets = getAllBets();
    allBets.push(buildBetRecord({ id: "bet-2", gamePk: 67890 }));

    expect(getAllBets()).toEqual([bet]);
  });

  it("does not save duplicate ids twice", () => {
    const originalBet = buildBetRecord();
    const duplicateBet = buildBetRecord({ line: 9.5, odds: 100 });

    const savedDuplicate = saveBet(originalBet);
    const secondSave = saveBet(duplicateBet);

    expect(savedDuplicate).toEqual(originalBet);
    expect(secondSave).toEqual(originalBet);
    expect(getAllBets()).toEqual([originalBet]);
  });

  it("updates a result by id", () => {
    const firstBet = buildBetRecord({ id: "bet-1", gamePk: 111 });
    const secondBet = buildBetRecord({ id: "bet-2", gamePk: 111, betType: "UNDER" });
    saveBet(firstBet);
    saveBet(secondBet);

    const updatedBet = updateBetResult({ id: "bet-2", result: "WIN", bankrollAfter: 1025 });

    expect(updatedBet).toEqual({ ...secondBet, result: "WIN", bankrollAfter: 1025 });
    expect(getAllBets()).toEqual([firstBet, { ...secondBet, result: "WIN", bankrollAfter: 1025 }]);
  });

  it("returns null when updating a missing bet", () => {
    const updatedBet = updateBetResult({ id: "missing-bet", result: "LOSS" });

    expect(updatedBet).toBeNull();
  });

  it("resets state for tests", () => {
    saveBet(buildBetRecord());

    clearBetsForTests();

    expect(getAllBets()).toEqual([]);
  });
});
