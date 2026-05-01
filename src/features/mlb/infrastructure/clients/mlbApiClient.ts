const MLB_SCHEDULE_BASE_URL = "https://statsapi.mlb.com/api/v1/schedule";
const MLB_PEOPLE_BASE_URL = "https://statsapi.mlb.com/api/v1/people";
const MLB_TEAMS_BASE_URL = "https://statsapi.mlb.com/api/v1/teams";

type MlbApiProbablePitcher = {
  id?: number;
  fullName?: string;
};

type MlbApiTeam = {
  team?: {
    id?: number;
    name?: string;
  };
  probablePitcher?: MlbApiProbablePitcher;
};

type MlbApiGame = {
  gamePk?: number;
  gameDate?: string;
  season?: string;
  teams?: {
    home?: MlbApiTeam;
    away?: MlbApiTeam;
  };
  venue?: {
    name?: string;
  };
  status?: {
    detailedState?: string;
    abstractGameState?: string;
  };
};

type MlbApiDate = {
  date?: string;
  games?: MlbApiGame[];
};

type MlbScheduleResponse = {
  dates?: MlbApiDate[];
};

type MlbPitchingStat = {
  era?: string;
};

type MlbPitcherStatsSplit = {
  stat?: MlbPitchingStat;
};

type MlbPitcherStatsEntry = {
  splits?: MlbPitcherStatsSplit[];
};

type MlbPitcherStatsResponse = {
  stats?: MlbPitcherStatsEntry[];
};

type MlbTeamHittingStat = {
  runs?: string | number;
  gamesPlayed?: string | number;
};

type MlbTeamStatsSplit = {
  team?: {
    id?: number;
    name?: string;
  };
  stat?: MlbTeamHittingStat;
};

type MlbTeamStatsEntry = {
  splits?: MlbTeamStatsSplit[];
};

type MlbTeamStatsResponse = {
  stats?: MlbTeamStatsEntry[];
};

export type MlbProbablePitcher = {
  id: number;
  fullName: string;
};

export type MlbPitcherSeasonStats = {
  pitcherId: number;
  season: number;
  era: number | null;
};

export type MlbTeamSeasonHittingStats = {
  teamId: number;
  teamName: string;
  season: number;
  runs: number | null;
  gamesPlayed: number | null;
};

export type MlbScheduleGame = {
  gamePk: number;
  officialDate: string | null;
  gameDateTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeTeamId: number | null;
  awayTeamId: number | null;
  venue: string | null;
  status: string | null;
  season: number | null;
  homeProbablePitcher: MlbProbablePitcher | null;
  awayProbablePitcher: MlbProbablePitcher | null;
};

function parseSeason(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProbablePitcher(pitcher: MlbApiProbablePitcher | undefined): MlbProbablePitcher | null {
  if (!pitcher || typeof pitcher.id !== "number" || typeof pitcher.fullName !== "string" || pitcher.fullName.trim().length === 0) {
    return null;
  }

  return {
    id: pitcher.id,
    fullName: pitcher.fullName,
  };
}

function parseEra(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export const mlbApiClient = {
  async getSchedule(date: string): Promise<MlbScheduleGame[]> {
    const url = `${MLB_SCHEDULE_BASE_URL}?sportId=1&date=${encodeURIComponent(date)}`;

    let response: Response;

    try {
      response = await fetch(url, { method: "GET", cache: "no-store" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new Error(`mlbApiClient.getSchedule network error for ${date}: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`mlbApiClient.getSchedule failed for ${date}: HTTP ${response.status} ${response.statusText}`);
    }

    let payload: MlbScheduleResponse;
    try {
      payload = (await response.json()) as MlbScheduleResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON response";
      throw new Error(`mlbApiClient.getSchedule parse error for ${date}: ${message}`);
    }

    const games: MlbScheduleGame[] = [];

    for (const dateEntry of payload.dates ?? []) {
      for (const game of dateEntry.games ?? []) {
        if (typeof game.gamePk !== "number") {
          continue;
        }

        games.push({
          gamePk: game.gamePk,
          officialDate: dateEntry.date ?? null,
          gameDateTime: game.gameDate ?? null,
          homeTeam: game.teams?.home?.team?.name ?? null,
          awayTeam: game.teams?.away?.team?.name ?? null,
          homeTeamId: game.teams?.home?.team?.id ?? null,
          awayTeamId: game.teams?.away?.team?.id ?? null,
          venue: game.venue?.name ?? null,
          status: game.status?.detailedState ?? game.status?.abstractGameState ?? null,
          season: parseSeason(game.season),
          homeProbablePitcher: normalizeProbablePitcher(game.teams?.home?.probablePitcher),
          awayProbablePitcher: normalizeProbablePitcher(game.teams?.away?.probablePitcher),
        });
      }
    }

    return games;
  },

  async getPitcherSeasonStats(pitcherId: number, season: number): Promise<MlbPitcherSeasonStats> {
    const url = `${MLB_PEOPLE_BASE_URL}/${pitcherId}/stats?stats=season&group=pitching&season=${season}`;

    let response: Response;

    try {
      response = await fetch(url, { method: "GET", cache: "no-store" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new Error(`mlbApiClient.getPitcherSeasonStats network error for pitcher ${pitcherId}, season ${season}: ${message}`);
    }

    if (!response.ok) {
      throw new Error(
        `mlbApiClient.getPitcherSeasonStats failed for pitcher ${pitcherId}, season ${season}: HTTP ${response.status} ${response.statusText}`,
      );
    }

    let payload: MlbPitcherStatsResponse;
    try {
      payload = (await response.json()) as MlbPitcherStatsResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON response";
      throw new Error(`mlbApiClient.getPitcherSeasonStats parse error for pitcher ${pitcherId}, season ${season}: ${message}`);
    }

    const era = parseEra(payload.stats?.[0]?.splits?.[0]?.stat?.era);

    return {
      pitcherId,
      season,
      era,
    };
  },

  async getTeamSeasonHittingStats(season: number): Promise<MlbTeamSeasonHittingStats[]> {
    const url = `${MLB_TEAMS_BASE_URL}/stats?stats=season&group=hitting&season=${season}`;

    let response: Response;

    try {
      response = await fetch(url, { method: "GET", cache: "no-store" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown network error";
      throw new Error(`mlbApiClient.getTeamSeasonHittingStats network error for season ${season}: ${message}`);
    }

    if (!response.ok) {
      throw new Error(`mlbApiClient.getTeamSeasonHittingStats failed for season ${season}: HTTP ${response.status} ${response.statusText}`);
    }

    let payload: MlbTeamStatsResponse;
    try {
      payload = (await response.json()) as MlbTeamStatsResponse;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid JSON response";
      throw new Error(`mlbApiClient.getTeamSeasonHittingStats parse error for season ${season}: ${message}`);
    }

    const firstStat = payload.stats?.[0]?.splits?.[0]?.stat;
    console.debug("mlbApiClient.getTeamSeasonHittingStats payload sample", {
      season,
      runs: firstStat?.runs,
      gamesPlayed: firstStat?.gamesPlayed,
      splitCount: payload.stats?.[0]?.splits?.length ?? 0,
    });

    return (payload.stats?.[0]?.splits ?? [])
      .filter((split): split is MlbTeamStatsSplit & { team: { id: number; name: string } } => {
        return typeof split.team?.id === "number" && typeof split.team?.name === "string";
      })
      .map((split) => ({
        teamId: split.team.id,
        teamName: split.team.name,
        season,
        runs: parseInteger(split.stat?.runs),
        gamesPlayed: parseInteger(split.stat?.gamesPlayed),
      }));
  },
};
