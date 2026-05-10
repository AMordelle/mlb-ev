import { NextResponse } from "next/server";

import { buildHistorySummary } from "@/features/mlb/application/services/historySummaryService";
import { getAllBets } from "@/features/mlb/infrastructure/repositories/betRepository";

export async function GET() {
  return NextResponse.json({ ok: true, summary: buildHistorySummary(getAllBets()) });
}
