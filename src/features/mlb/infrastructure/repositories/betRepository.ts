import type { PostgrestError } from "@supabase/supabase-js";

import type { BetRecord, BetResultStatus } from "@/features/mlb/domain/models/betRecord";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

export type BetRow = {
  id: string;
  created_at: string;
  date: string;
  game_pk: number;
  bet_type: "OVER" | "UNDER";
  line: number;
  odds: number;
  model_probability: number;
  ev: number;
  stake: number;
  result: BetResultStatus;
  closing_line: number | null;
  closing_odds: number | null;
  bankroll_before: number;
  bankroll_after: number | null;
};

type BetWriteRow = {
  id: string;
  date: string;
  game_pk: number;
  bet_type: "OVER" | "UNDER";
  line: number;
  odds: number;
  model_probability: number;
  ev: number;
  stake: number;
  result: BetResultStatus;
  closing_line?: number | null;
  closing_odds?: number | null;
  bankroll_before: number;
  bankroll_after?: number | null;
};

type BetResultUpdateRow = {
  result: BetResultStatus;
  bankroll_after?: number;
};

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new Error(`betRepository.${operation} failed: ${error.message}`);
}

export function mapBetRowToRecord(row: BetRow): BetRecord {
  return {
    id: row.id,
    date: row.date,
    gamePk: Number(row.game_pk),
    betType: row.bet_type,
    line: Number(row.line),
    odds: Number(row.odds),
    modelProbability: Number(row.model_probability),
    ev: Number(row.ev),
    stake: Number(row.stake),
    result: row.result,
    ...(row.closing_line === null ? {} : { closingLine: Number(row.closing_line) }),
    ...(row.closing_odds === null ? {} : { closingOdds: Number(row.closing_odds) }),
    bankrollBefore: Number(row.bankroll_before),
    ...(row.bankroll_after === null ? {} : { bankrollAfter: Number(row.bankroll_after) }),
  };
}

export function mapBetRecordToWriteRow(record: BetRecord): BetWriteRow {
  return {
    id: record.id,
    date: record.date,
    game_pk: record.gamePk,
    bet_type: record.betType,
    line: record.line,
    odds: record.odds,
    model_probability: record.modelProbability,
    ev: record.ev,
    stake: record.stake,
    result: record.result,
    ...(record.closingLine === undefined ? {} : { closing_line: record.closingLine }),
    ...(record.closingOdds === undefined ? {} : { closing_odds: record.closingOdds }),
    bankroll_before: record.bankrollBefore,
    ...(record.bankrollAfter === undefined ? {} : { bankroll_after: record.bankrollAfter }),
  };
}

export async function saveBet(record: BetRecord): Promise<BetRecord> {
  const supabase = getSupabaseServiceRoleClient();
  const existingBetResponse = await supabase.from("bets").select("*").eq("id", record.id).maybeSingle();

  if (existingBetResponse.error) throwSupabaseError("saveBet.findExisting", existingBetResponse.error);
  if (existingBetResponse.data) return mapBetRowToRecord(existingBetResponse.data as BetRow);

  const payload = mapBetRecordToWriteRow(record);
  const { data, error } = await supabase.from("bets").insert(payload).select("*").single();

  if (error) throwSupabaseError("saveBet", error);

  return mapBetRowToRecord(data as BetRow);
}

export async function getAllBets(): Promise<BetRecord[]> {
  const supabase = getSupabaseServiceRoleClient();
  const { data, error } = await supabase.from("bets").select("*").order("created_at", { ascending: true });

  if (error) throwSupabaseError("getAllBets", error);

  return (data as BetRow[]).map(mapBetRowToRecord);
}

export async function updateBetResult(params: { id: string; result: BetResultStatus; bankrollAfter?: number }): Promise<BetRecord | null> {
  const supabase = getSupabaseServiceRoleClient();
  const payload: BetResultUpdateRow = {
    result: params.result,
    ...(params.bankrollAfter === undefined ? {} : { bankroll_after: params.bankrollAfter }),
  };

  const { data, error } = await supabase.from("bets").update(payload).eq("id", params.id).select("*").maybeSingle();

  if (error) throwSupabaseError("updateBetResult", error);
  if (!data) return null;

  return mapBetRowToRecord(data as BetRow);
}

export async function clearBetsForTests(): Promise<void> {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("clearBetsForTests can only be used in test environments");
  }

  const supabase = getSupabaseServiceRoleClient();
  const { error } = await supabase.from("bets").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) throwSupabaseError("clearBetsForTests", error);
}
