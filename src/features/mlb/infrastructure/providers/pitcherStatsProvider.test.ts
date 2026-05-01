import { afterEach, describe, expect, it, vi } from "vitest";

import { pitcherStatsProvider } from "./pitcherStatsProvider";
import { mlbApiClient } from "../clients/mlbApiClient";

vi.mock("../clients/mlbApiClient", () => ({
  mlbApiClient: {
    getPitcherSeasonStats: vi.fn(),
  },
}));

describe("pitcherStatsProvider", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed ERA for a valid probable pitcher", async () => {
    vi.mocked(mlbApiClient.getPitcherSeasonStats).mockResolvedValue({ pitcherId: 123, season: 2026, era: 3.85 });

    const stats = await pitcherStatsProvider({ id: 123, fullName: "Ace Pitcher" }, 2026);

    expect(mlbApiClient.getPitcherSeasonStats).toHaveBeenCalledWith(123, 2026);
    expect(stats).toEqual({ pitcherId: 123, pitcherName: "Ace Pitcher", era: 3.85 });
  });

  it("returns null ERA when season is unavailable", async () => {
    const stats = await pitcherStatsProvider({ id: 123, fullName: "Ace Pitcher" }, null);

    expect(mlbApiClient.getPitcherSeasonStats).not.toHaveBeenCalled();
    expect(stats).toEqual({ pitcherId: 123, pitcherName: "Ace Pitcher", era: null });
  });

  it("returns null ERA on API failure", async () => {
    vi.mocked(mlbApiClient.getPitcherSeasonStats).mockRejectedValue(new Error("boom"));

    const stats = await pitcherStatsProvider({ id: 123, fullName: "Ace Pitcher" }, 2026);

    expect(stats).toEqual({ pitcherId: 123, pitcherName: "Ace Pitcher", era: null });
  });
});
