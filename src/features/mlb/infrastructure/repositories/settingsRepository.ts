import type { PostgrestError } from "@supabase/supabase-js";

import { mapSettingsRecordToWriteRow, mapSettingsRowToRecord, type SettingsRow } from "@/features/mlb/application/mappers/settingsMapper";
import type { SettingsRecord } from "@/features/mlb/application/dto/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new Error(`settingsRepository.${operation} failed: ${error.message}`);
}

export const settingsRepository = {
  async getSettings(): Promise<SettingsRecord | null> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();

    if (error) throwSupabaseError("getSettings", error);
    if (!data) return null;

    return mapSettingsRowToRecord(data as SettingsRow);
  },

  async upsertSettings(settings: SettingsRecord): Promise<SettingsRecord> {
    const supabase = await getSupabaseServerClient();
    const payload = mapSettingsRecordToWriteRow(settings);

    const { data, error } = await supabase.from("settings").upsert(payload).select("*").single();

    if (error) throwSupabaseError("upsertSettings", error);

    return mapSettingsRowToRecord(data as SettingsRow);
  },
};
