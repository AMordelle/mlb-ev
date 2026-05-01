import type { GameOdds } from "../../application/dto/types";

function getLineOffset(gamePk: number): number {
  const offsets = [-0.5, 0, 0.5];
  return offsets[Math.abs(gamePk) % offsets.length];
}

function getOddsOffset(gamePk: number): number {
  const offsets = [-10, -5, 0, 5, 10];
  return offsets[Math.abs(gamePk) % offsets.length];
}

export async function mockOddsProvider(gamePk: number): Promise<GameOdds> {
  const hasMissingOdds = gamePk % 11 === 0;

  return {
    gamePk,
    lineTotal: hasMissingOdds ? null : 8.5 + getLineOffset(gamePk),
    overOdds: hasMissingOdds ? null : -110 + getOddsOffset(gamePk),
    underOdds: hasMissingOdds ? null : -110 - getOddsOffset(gamePk),
    sportsbook: "mock-book-v1",
    retrievedAt: new Date().toISOString(),
  };
}
