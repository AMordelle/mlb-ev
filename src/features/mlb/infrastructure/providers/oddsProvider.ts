import type { GameOdds } from "../../application/dto/types";
import { mockOddsProvider } from "./mockOddsProvider";

export async function getOddsForGames(gamePks: number[]): Promise<Map<number, GameOdds>> {
  const oddsByGamePk = await Promise.all(gamePks.map(async (gamePk) => [gamePk, await mockOddsProvider(gamePk)] as const));

  return new Map(oddsByGamePk);
}
