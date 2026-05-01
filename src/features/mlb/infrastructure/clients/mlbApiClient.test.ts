import { describe, expect, it, vi, afterEach } from "vitest";

import { mlbApiClient } from "./mlbApiClient";

describe("mlbApiClient", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves probable pitcher data from schedule payload", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dates: [
          {
            date: "2026-04-01",
            games: [
              {
                gamePk: 111,
                season: "2026",
                teams: {
                  home: { team: { name: "Home" }, probablePitcher: { id: 1, fullName: "Home Pitcher" } },
                  away: { team: { name: "Away" }, probablePitcher: { id: 2, fullName: "Away Pitcher" } },
                },
              },
            ],
          },
        ],
      }),
    } as Response);

    const games = await mlbApiClient.getSchedule("2026-04-01");

    expect(games[0]?.homeProbablePitcher).toEqual({ id: 1, fullName: "Home Pitcher" });
    expect(games[0]?.awayProbablePitcher).toEqual({ id: 2, fullName: "Away Pitcher" });
  });

  it("handles missing probable pitcher data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        dates: [{ date: "2026-04-01", games: [{ gamePk: 111, teams: { home: { team: { name: "Home" } }, away: { team: { name: "Away" } } } }] }],
      }),
    } as Response);

    const games = await mlbApiClient.getSchedule("2026-04-01");

    expect(games[0]?.homeProbablePitcher).toBeNull();
    expect(games[0]?.awayProbablePitcher).toBeNull();
  });

  it("parses ERA from pitcher stats", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [{ splits: [{ stat: { era: "3.45" } }] }] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBe(3.45);
  });

  it("returns null ERA when pitcher stats are missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBeNull();
  });
});
