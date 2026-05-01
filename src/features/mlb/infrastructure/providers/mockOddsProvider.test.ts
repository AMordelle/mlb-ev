import { describe, expect, it } from "vitest";

import { mockOddsProvider } from "./mockOddsProvider";
import { getOddsForGames } from "./oddsProvider";

describe("mockOddsProvider", () => {
  it("returns deterministic mock values that vary by gamePk", async () => {
    const odds101 = await mockOddsProvider(101);
    const odds102 = await mockOddsProvider(102);

    expect(odds101.lineTotal).not.toBe(odds102.lineTotal);
    expect(odds101.overOdds).not.toBe(odds102.overOdds);
    expect(odds101.underOdds).not.toBe(odds102.underOdds);
    expect(odds101.sportsbook).toBe("mock-book-v1");
    expect(typeof odds101.retrievedAt).toBe("string");
  });

  it("maps odds by gamePk using provider layer", async () => {
    const gamePks = [700001, 700002, 700003];
    const odds = await getOddsForGames(gamePks);

    expect(odds.size).toBe(3);
    expect(odds.get(700002)?.gamePk).toBe(700002);
  });

  it("handles missing odds safely as null", async () => {
    const missingOdds = await mockOddsProvider(110);

    expect(missingOdds.lineTotal).toBeNull();
    expect(missingOdds.overOdds).toBeNull();
    expect(missingOdds.underOdds).toBeNull();
  });
});
