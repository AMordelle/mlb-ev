import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import type { BetRecord, BetResultStatus } from "@/features/mlb/domain/models/betRecord";
import { getAllBets, saveBet, updateBetResult } from "@/features/mlb/infrastructure/repositories/betRepository";

type CreateBetBody = {
  date: string;
  gamePk: number;
  betType: "OVER" | "UNDER";
  line: number;
  odds: number;
  modelProbability: number;
  ev: number;
  stake: number;
  bankrollBefore: number;
};

type UpdateBetResultBody = {
  id: string;
  result: BetResultStatus;
  bankrollAfter?: number;
};

const betResultStatuses = ["PENDING", "WIN", "LOSS", "PUSH"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isBetType(value: unknown): value is CreateBetBody["betType"] {
  return value === "OVER" || value === "UNDER";
}

function isBetResultStatus(value: unknown): value is BetResultStatus {
  return typeof value === "string" && betResultStatuses.some((status) => status === value);
}

function parseCreateBetBody(value: unknown): CreateBetBody | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.date !== "string" ||
    value.date.trim().length === 0 ||
    !isFiniteNumber(value.gamePk) ||
    !isBetType(value.betType) ||
    !isFiniteNumber(value.line) ||
    !isFiniteNumber(value.odds) ||
    !isFiniteNumber(value.modelProbability) ||
    !isFiniteNumber(value.ev) ||
    !isFiniteNumber(value.stake) ||
    !isFiniteNumber(value.bankrollBefore)
  ) {
    return null;
  }

  return {
    date: value.date,
    gamePk: value.gamePk,
    betType: value.betType,
    line: value.line,
    odds: value.odds,
    modelProbability: value.modelProbability,
    ev: value.ev,
    stake: value.stake,
    bankrollBefore: value.bankrollBefore,
  };
}

function parseUpdateBetResultBody(value: unknown): UpdateBetResultBody | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== "string" || value.id.trim().length === 0 || !isBetResultStatus(value.result)) {
    return null;
  }

  if (value.bankrollAfter !== undefined && !isFiniteNumber(value.bankrollAfter)) {
    return null;
  }

  return {
    id: value.id,
    result: value.result,
    ...(value.bankrollAfter === undefined ? {} : { bankrollAfter: value.bankrollAfter }),
  };
}

export async function GET() {
  try {
    return NextResponse.json({ ok: true, bets: await getAllBets() });
  } catch (error) {
    console.error("Failed to load bets", error);
    return NextResponse.json({ ok: false, error: "Failed to load bets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = parseCreateBetBody(await request.json());

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid bet payload" }, { status: 400 });
  }

  const bet: BetRecord = {
    id: crypto.randomUUID(),
    ...body,
    result: "PENDING",
  };

  try {
    return NextResponse.json({ ok: true, bet: await saveBet(bet) });
  } catch (error) {
    console.error("Failed to save bet", error);
    return NextResponse.json({ ok: false, error: "Failed to save bet" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = parseUpdateBetResultBody(await request.json());

  if (!body) {
    return NextResponse.json({ ok: false, error: "Invalid bet result payload" }, { status: 400 });
  }

  try {
    const bet = await updateBetResult(body);

    if (!bet) {
      return NextResponse.json({ ok: false, error: "Bet not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, bet });
  } catch (error) {
    console.error("Failed to update bet", error);
    return NextResponse.json({ ok: false, error: "Failed to update bet" }, { status: 500 });
  }
}
