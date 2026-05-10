import { describe, expect, it } from "vitest";

import type { BetRecord } from "@/features/mlb/domain/models/betRecord";

import { buildHistorySummary, calculateBetProfit } from "./historySummaryService";

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

describe("historySummaryService", () => {
  it("returns an empty summary for empty history", () => {
    expect(buildHistorySummary([])).toEqual({
      totalBets: 0,
      pendingBets: 0,
      wins: 0,
      losses: 0,
      pushes: 0,
      totalStaked: 0,
      totalProfit: 0,
      winRate: 0,
      yield: 0,
      bankrollCurrent: null,
    });
  });

  it("counts only pending bets without resolved performance", () => {
    const summary = buildHistorySummary([
      buildBetRecord({ id: "bet-1", stake: 20 }),
      buildBetRecord({ id: "bet-2", stake: 30 }),
    ]);

    expect(summary).toEqual({
      totalBets: 2,
      pendingBets: 2,
      wins: 0,
      losses: 0,
      pushes: 0,
      totalStaked: 50,
      totalProfit: 0,
      winRate: 0,
      yield: 0,
      bankrollCurrent: null,
    });
  });

  it("summarizes a wins and losses mix", () => {
    const summary = buildHistorySummary([
      buildBetRecord({ id: "bet-1", result: "WIN", odds: 100, stake: 10 }),
      buildBetRecord({ id: "bet-2", result: "LOSS", odds: -110, stake: 25 }),
      buildBetRecord({ id: "bet-3", result: "PENDING", stake: 15 }),
    ]);

    expect(summary.wins).toBe(1);
    expect(summary.losses).toBe(1);
    expect(summary.pendingBets).toBe(1);
    expect(summary.totalStaked).toBe(50);
    expect(summary.totalProfit).toBe(-15);
    expect(summary.winRate).toBe(0.5);
    expect(summary.yield).toBe(-0.3);
  });

  it("handles pushes as resolved bets with zero profit", () => {
    const summary = buildHistorySummary([
      buildBetRecord({ id: "bet-1", result: "WIN", odds: 100, stake: 10 }),
      buildBetRecord({ id: "bet-2", result: "PUSH", stake: 10 }),
    ]);

    expect(summary.pushes).toBe(1);
    expect(summary.totalProfit).toBe(10);
    expect(summary.winRate).toBe(0.5);
    expect(calculateBetProfit(buildBetRecord({ result: "PUSH", stake: 10 }))).toBe(0);
  });

  it("calculates profit for positive american odds", () => {
    const bet = buildBetRecord({ result: "WIN", odds: 150, stake: 20 });

    expect(calculateBetProfit(bet)).toBe(30);
    expect(buildHistorySummary([bet]).totalProfit).toBe(30);
  });

  it("calculates profit for negative american odds", () => {
    const bet = buildBetRecord({ result: "WIN", odds: -125, stake: 25 });

    expect(calculateBetProfit(bet)).toBe(20);
    expect(buildHistorySummary([bet]).totalProfit).toBe(20);
  });

  it("detects bankrollCurrent from the last resolved bet by insertion order", () => {
    const summary = buildHistorySummary([
      buildBetRecord({ id: "bet-1", result: "WIN", bankrollAfter: 1020 }),
      buildBetRecord({ id: "bet-2", result: "PENDING", bankrollAfter: 1100 }),
      buildBetRecord({ id: "bet-3", result: "LOSS", bankrollAfter: 995 }),
    ]);

    expect(summary.bankrollCurrent).toBe(995);
  });

  it("rounds profit, winRate, and yield", () => {
    const summary = buildHistorySummary([
      buildBetRecord({ id: "bet-1", result: "WIN", odds: -110, stake: 10 }),
      buildBetRecord({ id: "bet-2", result: "WIN", odds: -110, stake: 10 }),
      buildBetRecord({ id: "bet-3", result: "LOSS", odds: -110, stake: 10 }),
    ]);

    expect(summary.totalProfit).toBe(8.18);
    expect(summary.winRate).toBe(0.667);
    expect(summary.yield).toBe(0.273);
  });
});
