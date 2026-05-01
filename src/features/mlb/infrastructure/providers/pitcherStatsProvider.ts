import { mlbApiClient } from "../clients/mlbApiClient";

import type { PitcherStatLine } from "../../application/dto/types";

type ProbablePitcherInput = {
  id: number;
  fullName: string;
};

export async function pitcherStatsProvider(pitcher: ProbablePitcherInput, season: number | null): Promise<PitcherStatLine> {
  if (season === null) {
    return {
      pitcherId: pitcher.id,
      pitcherName: pitcher.fullName,
      era: null,
    };
  }

  try {
    const stats = await mlbApiClient.getPitcherSeasonStats(pitcher.id, season);

    return {
      pitcherId: pitcher.id,
      pitcherName: pitcher.fullName,
      era: stats.era,
    };
  } catch {
    return {
      pitcherId: pitcher.id,
      pitcherName: pitcher.fullName,
      era: null,
    };
  }
}
