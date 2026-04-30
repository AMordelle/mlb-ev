import type { SettingsRecord } from "../dto/types";

export type SettingsRow = {
  id: string;
  bankroll: number;
  stake_base_pct: number;
  ev_threshold: number;
  max_daily_picks: number;
  market: "TOTALS";
  created_at: string;
  updated_at: string;
};

export type SettingsWriteRow = {
  id?: string;
  bankroll: number;
  stake_base_pct: number;
  ev_threshold: number;
  max_daily_picks: number;
  market: "TOTALS";
};

export function mapSettingsRowToRecord(row: SettingsRow): SettingsRecord {
  return {
    id: row.id,
    bankroll: row.bankroll,
    stakeBasePct: row.stake_base_pct,
    evThreshold: row.ev_threshold,
    maxDailyPicks: row.max_daily_picks,
    market: row.market,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapSettingsRecordToWriteRow(record: SettingsRecord): SettingsWriteRow {
  return {
    id: record.id,
    bankroll: record.bankroll,
    stake_base_pct: record.stakeBasePct,
    ev_threshold: record.evThreshold,
    max_daily_picks: record.maxDailyPicks,
    market: record.market,
  };
}
