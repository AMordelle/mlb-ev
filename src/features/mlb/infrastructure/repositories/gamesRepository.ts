import type { PostgrestError } from "@supabase/supabase-js";

import { mapGameRecordToWriteRow, mapGameRowToRecord, type GameRow } from "@/features/mlb/application/mappers/gameMapper";
import type { GameRecord, GameUpsertInput } from "@/features/mlb/application/dto/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function throwSupabaseError(operation: string, error: PostgrestError): never {
  throw new Error(`gamesRepository.${operation} failed: ${error.message}`);
}

export const gamesRepository = {
  async findByDate(date: string): Promise<GameRecord[]> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("games").select("*").eq("game_date", date).order("game_pk", { ascending: true });

    if (error) throwSupabaseError("findByDate", error);

    return (data as GameRow[]).map(mapGameRowToRecord);
  },

  async findByGamePk(gamePk: number): Promise<GameRecord | null> {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase.from("games").select("*").eq("game_pk", gamePk).maybeSingle();

    if (error) throwSupabaseError("findByGamePk", error);
    if (!data) return null;

    return mapGameRowToRecord(data as GameRow);
  },

  async upsertGames(games: GameUpsertInput[]): Promise<GameRecord[]> {
    if (games.length === 0) return [];

    const supabase = await getSupabaseServerClient();
    const payload = games.map(mapGameRecordToWriteRow);

    const { data, error } = await supabase
      .from("games")
      .upsert(payload, { onConflict: "game_pk" })
      .select("*")
      .order("game_pk", { ascending: true });

    if (error) throwSupabaseError("upsertGames", error);

    return (data as GameRow[]).map(mapGameRowToRecord);
  },
};
