import { NextResponse } from "next/server";

import { buildRunProjectionsFromEnrichedGames, enrichDailyGames } from "@/features/mlb/application/use-cases/enrichDailyGames";
import { gamesRepository } from "@/features/mlb/infrastructure/repositories/gamesRepository";
import { scheduleProvider } from "@/features/mlb/infrastructure/providers/scheduleProvider";
import { getOddsForGames } from "@/features/mlb/infrastructure/providers/oddsProvider";
import { buildGameAnalysis } from "@/features/mlb/application/services/gameAnalysisService";
import { buildRefreshGamesPayload } from "./response";
import { todayISO } from "@/lib/utils/dates";

type RefreshGamesBody = {
  date?: string;
};

function getDateFromBody(body: unknown): string {
  if (!body || typeof body !== "object") {
    return todayISO();
  }

  const { date } = body as RefreshGamesBody;
  if (typeof date !== "string" || date.trim().length === 0) {
    return todayISO();
  }

  return date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const date = getDateFromBody(body);

    const normalizedGames = await scheduleProvider(date);
    const games = await gamesRepository.upsertGames(normalizedGames);
    const enrichedGames = await enrichDailyGames({ date });
    const runProjections = buildRunProjectionsFromEnrichedGames(enrichedGames);
    const odds = await getOddsForGames(enrichedGames.map((game) => game.gamePk));
    const analysis = buildGameAnalysis({
      enrichedGames,
      runProjections,
      odds,
    });
    return NextResponse.json(
      buildRefreshGamesPayload({
        date,
        games,
        enrichedGames,
        runProjections,
        odds,
        analysis,
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: `Failed to refresh MLB games: ${message}`,
      },
      { status: 500 },
    );
  }
}
