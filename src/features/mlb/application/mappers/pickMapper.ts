import type { PickRecord } from "../dto/types";

export type PickRow = {
  id: string;
  game_id: string;
  pick_date: string;
  market: "TOTALS";
  recommendation: PickRecord["recommendation"];
  line: number;
  odds: number;
  ev: number;
  stake_pct: number;
  stake_amount: number | null;
  confidence: PickRecord["confidence"];
  reason: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type PickInsertRow = {
  game_id: string;
  pick_date: string;
  market: "TOTALS";
  recommendation: PickRecord["recommendation"];
  line: number;
  odds: number;
  ev: number;
  stake_pct: number;
  stake_amount?: number | null;
  confidence: PickRecord["confidence"];
  reason?: string | null;
  is_primary: boolean;
};

export function mapPickRowToRecord(row: PickRow): PickRecord {
  return {
    id: row.id,
    gameId: row.game_id,
    pickDate: row.pick_date,
    market: row.market,
    recommendation: row.recommendation,
    line: row.line,
    odds: row.odds,
    ev: row.ev,
    stakePct: row.stake_pct,
    stakeAmount: row.stake_amount,
    confidence: row.confidence,
    reason: row.reason,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPickRecordToInsertRow(record: PickRecord): PickInsertRow {
  return {
    game_id: record.gameId,
    pick_date: record.pickDate,
    market: record.market,
    recommendation: record.recommendation,
    line: record.line,
    odds: record.odds,
    ev: record.ev,
    stake_pct: record.stakePct,
    stake_amount: record.stakeAmount,
    confidence: record.confidence,
    reason: record.reason,
    is_primary: record.isPrimary,
  };
}
