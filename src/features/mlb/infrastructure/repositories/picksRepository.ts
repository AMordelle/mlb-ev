import type { PostgrestError } from "@supabase/supabase-js";

import { mapPickRecordToInsertRow, mapPickRowToRecord, type PickRow } from "@/features/mlb/application/mappers/pickMapper";
import type { PickRecord } from "@/features/mlb/application/dto/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new Error(`picksRepository.${operation} failed: ${error.message}`);
}

export const picksRepository = {
  async findByDate(date: string): Promise<PickRecord[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("picks").select("*").eq("pick_date", date).order("created_at", { ascending: true });

    if (error) throwSupabaseError("findByDate", error);

    return (data as PickRow[]).map(mapPickRowToRecord);
  },

  async insertPick(pick: PickRecord): Promise<PickRecord> {
    const supabase = await getSupabaseServerClient();
    const payload = mapPickRecordToInsertRow(pick);
    const { data, error } = await supabase.from("picks").insert(payload).select("*").single();

    if (error) throwSupabaseError("insertPick", error);

    return mapPickRowToRecord(data as PickRow);
  },

  async findPrimaryByDate(date: string): Promise<PickRecord | null> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("picks")
      .select("*")
      .eq("pick_date", date)
      .eq("is_primary", true)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throwSupabaseError("findPrimaryByDate", error);
    if (!data) return null;

    return mapPickRowToRecord(data as PickRow);
  },
};
