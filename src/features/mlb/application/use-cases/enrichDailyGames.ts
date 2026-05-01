import type { GameUpsertInput } from "../dto/types";
import { scheduleProvider } from "../../infrastructure/providers/scheduleProvider";

type EnrichDailyGamesParams = {
  date: string;
};

export async function enrichDailyGames({ date }: EnrichDailyGamesParams): Promise<GameUpsertInput[]> {
  return scheduleProvider(date);
}
