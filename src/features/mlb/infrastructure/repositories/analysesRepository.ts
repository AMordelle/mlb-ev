import type { PostgrestError } from "@supabase/supabase-js";

import { mapAnalysisResultRowToRecord, mapAnalysisResultToWriteRow, type AnalysisResultRow } from "@/features/mlb/application/mappers/analysisMapper";
import type { GameAnalysisResult } from "@/features/mlb/application/dto/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new Error(`analysesRepository.${operation} failed: ${error.message}`);
}

export const analysesRepository = {
  async findByGameId(gameId: string): Promise<GameAnalysisResult | null> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("analyses").select("*").eq("game_id", gameId).maybeSingle();

    if (error) throwSupabaseError("findByGameId", error);
    if (!data) return null;

    return mapAnalysisResultRowToRecord(data as AnalysisResultRow);
  },

  async upsertAnalysis(result: GameAnalysisResult): Promise<GameAnalysisResult> {
    const supabase = await getSupabaseServerClient();
    const payload = mapAnalysisResultToWriteRow(result);

    const { data, error } = await supabase.from("analyses").upsert(payload, { onConflict: "game_id" }).select("*").single();

    if (error) throwSupabaseError("upsertAnalysis", error);

    return mapAnalysisResultRowToRecord(data as AnalysisResultRow);
  },
};
