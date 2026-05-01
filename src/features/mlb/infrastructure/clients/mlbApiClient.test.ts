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
                  home: { team: { id: 10, name: "Home" }, probablePitcher: { id: 1, fullName: "Home Pitcher" } },
                  away: { team: { id: 20, name: "Away" }, probablePitcher: { id: 2, fullName: "Away Pitcher" } },
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
    expect(games[0]?.homeTeamId).toBe(10);
    expect(games[0]?.awayTeamId).toBe(20);
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

  it("parses numeric ERA from pitcher stats", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [{ splits: [{ stat: { era: 2.91 } }] }] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBe(2.91);
  });


  it("calls MLB people stats endpoint with pitcher id and season", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [{ splits: [{ stat: { era: "4.12" } }] }] }),
    } as Response);

    await mlbApiClient.getPitcherSeasonStats(42, 2026);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://statsapi.mlb.com/api/v1/people/42/stats?stats=season&group=pitching&season=2026",
      { method: "GET", cache: "no-store" },
    );
  });

  it("returns null ERA when the ERA value is invalid", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [{ splits: [{ stat: { era: "N/A" } }] }] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBeNull();
  });

  it("returns null ERA when pitcher stats are missing", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBeNull();
  });

  it("returns null ERA when splits are empty", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ stats: [{ splits: [] }] }),
    } as Response);

    const stats = await mlbApiClient.getPitcherSeasonStats(10, 2026);

    expect(stats.era).toBeNull();
  });

  it("parses team hitting stats using requested MLB team IDs", async () => {
    const fetchMock = vi.spyOn(global, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: [
            {
              group: { displayName: "hitting" },
              splits: [{ team: { id: 4864, name: "Home" }, stat: { runs: "141", gamesPlayed: "30" } }],
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          stats: [
            {
              group: { displayName: "hitting" },
              splits: [{ team: { id: 5323, name: "Away" }, stat: { runs: 99, gamesPlayed: 25 } }],
            },
          ],
        }),
      } as Response);

    const stats = await mlbApiClient.getTeamSeasonHittingStats(2026, [112, 109]);

    expect(fetchMock.mock.calls[0]?.[0]).toContain("/teams/112/stats");
    expect(fetchMock.mock.calls[1]?.[0]).toContain("/teams/109/stats");
    expect(stats).toEqual([
      { teamId: 112, teamName: "Home", season: 2026, runs: 141, gamesPlayed: 30 },
      { teamId: 109, teamName: "Away", season: 2026, runs: 99, gamesPlayed: 25 },
    ]);
  });
});
