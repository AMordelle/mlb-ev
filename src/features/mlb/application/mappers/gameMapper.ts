import type { GameRecord } from "../dto/types";

export type GameRow = {
  id: string;
  game_pk: number;
  game_date: string;
  official_datetime: string | null;
  home_team: string;
  away_team: string;
  venue: string | null;
  status: string;
  season: number | null;
  created_at: string;
  updated_at: string;
};

export function mapGameRowToRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    gamePk: row.game_pk,
    gameDate: row.game_date,
    officialDatetime: row.official_datetime,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    venue: row.venue,
    status: row.status,
    season: row.season,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
