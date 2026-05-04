import { describe, expect, it } from "vitest";

import type { GameAnalysis } from "@/features/mlb/application/dto/types";
import { buildRefreshGamesPayload } from "./response";

const BASE_GAME_ANALYSIS: Omit<
  GameAnalysis,
  "gamePk" | "lineTotal" | "overEV" | "underEV" | "overProbability" | "underProbability"
> = {
  gameDate: "2026-05-01",
  homeTeam: "A",
  awayTeam: "B",
  overOdds: -110,
  underOdds: -110,
  homeExpectedRuns: 4.7,
  awayExpectedRuns: 4.5,
  totalExpectedRuns: 9.2,
  valid: true,
  reason: "ok",
};

describe("buildRefreshGamesPayload", () => {
  it("returns selectedBets array", () => {
    const analysis: GameAnalysis[] = [
      {
        ...BASE_GAME_ANALYSIS,
        gamePk: 10,
        lineTotal: 8.5,
        overProbability: 0.56,
        underProbability: 0.44,
        overEV: 0.04,
        underEV: -0.02,
      },
    ];

    const payload = buildRefreshGamesPayload({
      date: "2026-05-01",
      games: [],
      enrichedGames: [],
      runProjections: [],
      odds: new Map(),
      analysis,
    });

    expect(Array.isArray(payload.selectedBets)).toBe(true);
    expect(payload.selectedBets.length).toBeGreaterThan(0);
  });

  it("returns empty selectedBets when no valid bets", () => {
    const analysis: GameAnalysis[] = [
      {
        ...BASE_GAME_ANALYSIS,
        gamePk: 20,
        lineTotal: 8.5,
        overProbability: 0.51,
        underProbability: 0.49,
        overEV: 0.01,
        underEV: -0.03,
      },
    ];

    const payload = buildRefreshGamesPayload({
      date: "2026-05-01",
      games: [],
      enrichedGames: [],
      runProjections: [],
      odds: new Map(),
      analysis,
    });

    expect(payload.selectedBets).toEqual([]);
  });
});
