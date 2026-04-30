const MLB_SCHEDULE_BASE_URL = "https://statsapi.mlb.com/api/v1/schedule";

type MlbApiTeam = {
  team?: {
    name?: string;
  };
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

export type MlbScheduleGame = {
  gamePk: number;
  officialDate: string | null;
  gameDateTime: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  venue: string | null;
  status: string | null;
  season: number | null;
};

function parseSeason(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
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
          venue: game.venue?.name ?? null,
          status: game.status?.detailedState ?? game.status?.abstractGameState ?? null,
          season: parseSeason(game.season),
        });
      }
    }

    return games;
  },
};
