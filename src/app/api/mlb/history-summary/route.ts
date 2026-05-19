import { NextResponse } from "next/server";

import { buildHistorySummary } from "@/features/mlb/application/services/historySummaryService";
import { getAllBets } from "@/features/mlb/infrastructure/repositories/betRepository";

export async function GET() {
  try {
    return NextResponse.json({ ok: true, summary: buildHistorySummary(await getAllBets()) });
  } catch (error) {
    console.error("Failed to load history summary", error);
    return NextResponse.json({ ok: false, error: "Failed to load history summary" }, { status: 500 });
  }
}
