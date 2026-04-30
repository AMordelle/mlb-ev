import type { GameRecord } from "../dto/types";
import { scheduleProvider } from "../../infrastructure/providers/scheduleProvider";

type EnrichDailyGamesParams = {
  date: string;
};

export async function enrichDailyGames({ date }: EnrichDailyGamesParams): Promise<GameRecord[]> {
  return scheduleProvider(date);
}
