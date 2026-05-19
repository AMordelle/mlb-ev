import type { PostgrestError } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BetRecord } from "@/features/mlb/domain/models/betRecord";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service";

import { getAllBets, saveBet, updateBetResult, type BetRow } from "./betRepository";

vi.mock("@/lib/supabase/service", () => ({
  getSupabaseServiceRoleClient: vi.fn(),
}));

type SupabaseResponse<T> = {
  data: T;
  error: PostgrestError | null;
};

type CapturedInsertPayload = {
  value: unknown;
};

type CapturedUpdate = {
  payload: unknown;
  column: string;
  value: string;
};

const buildBetRecord = (overrides: Partial<BetRecord> = {}): BetRecord => ({
  id: "00000000-0000-0000-0000-000000000001",
  date: "2026-05-10",
  gamePk: 12345,
  betType: "OVER",
  line: 8.5,
  odds: -110,
  modelProbability: 0.54,
  ev: 0.03,
  stake: 25,
  result: "PENDING",
  bankrollBefore: 1000,
  ...overrides,
});

const buildBetRow = (overrides: Partial<BetRow> = {}): BetRow => ({
  id: "00000000-0000-0000-0000-000000000001",
  created_at: "2026-05-10T12:00:00.000Z",
  date: "2026-05-10",
  game_pk: 12345,
  bet_type: "OVER",
  line: 8.5,
  odds: -110,
  model_probability: 0.54,
  ev: 0.03,
  stake: 25,
  result: "PENDING",
  closing_line: null,
  closing_odds: null,
  bankroll_before: 1000,
  bankroll_after: null,
  ...overrides,
});

const supabaseError = (message: string): PostgrestError => ({
  name: "PostgrestError",
  message,
  details: "",
  hint: "",
  code: "TEST_ERROR",
  toJSON: () => ({
    name: "PostgrestError",
    message,
    details: "",
    hint: "",
    code: "TEST_ERROR",
  }),
});

function mockSupabaseClient(options: {
  existingBetResponse?: SupabaseResponse<BetRow | null>;
  insertResponse?: SupabaseResponse<BetRow | null>;
  getAllResponse?: SupabaseResponse<BetRow[]>;
  updateResponse?: SupabaseResponse<BetRow | null>;
  insertPayload?: CapturedInsertPayload;
  updateCapture?: CapturedUpdate;
}) {
  const from = vi.fn((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn(async () => options.existingBetResponse ?? { data: null, error: null }),
      })),
      order: vi.fn(async () => options.getAllResponse ?? { data: [], error: null }),
    })),
    insert: vi.fn((payload: unknown) => {
      if (options.insertPayload) options.insertPayload.value = payload;

      return {
        select: vi.fn(() => ({
          single: vi.fn(async () => options.insertResponse ?? { data: null, error: null }),
        })),
      };
    }),
    update: vi.fn((payload: unknown) => ({
      eq: vi.fn((column: string, value: string) => {
        if (options.updateCapture) {
          options.updateCapture.payload = payload;
          options.updateCapture.column = column;
          options.updateCapture.value = value;
        }

        return {
          select: vi.fn(() => ({
            maybeSingle: vi.fn(async () => options.updateResponse ?? { data: null, error: null }),
          })),
        };
      }),
    })),
    delete: vi.fn(() => ({
      neq: vi.fn(async () => ({ data: null, error: null })),
    })),
    table,
  }));

  vi.mocked(getSupabaseServiceRoleClient).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabaseServiceRoleClient>);

  return { from };
}

describe("betRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saveBet maps camelCase records to snake_case rows", async () => {
    const insertPayload: CapturedInsertPayload = { value: null };
    const savedRow = buildBetRow({ closing_line: 8, closing_odds: 100, bankroll_after: 1025 });
    mockSupabaseClient({
      existingBetResponse: { data: null, error: null },
      insertResponse: { data: savedRow, error: null },
      insertPayload,
    });

    const savedBet = await saveBet(buildBetRecord({ closingLine: 8, closingOdds: 100, bankrollAfter: 1025 }));

    expect(insertPayload.value).toEqual({
      id: "00000000-0000-0000-0000-000000000001",
      date: "2026-05-10",
      game_pk: 12345,
      bet_type: "OVER",
      line: 8.5,
      odds: -110,
      model_probability: 0.54,
      ev: 0.03,
      stake: 25,
      result: "PENDING",
      closing_line: 8,
      closing_odds: 100,
      bankroll_before: 1000,
      bankroll_after: 1025,
    });
    expect(savedBet).toEqual(buildBetRecord({ closingLine: 8, closingOdds: 100, bankrollAfter: 1025 }));
  });

  it("saveBet returns the existing persisted bet when the id already exists", async () => {
    const existingRow = buildBetRow({ line: 9.5, odds: 100 });
    const { from } = mockSupabaseClient({ existingBetResponse: { data: existingRow, error: null } });

    const savedBet = await saveBet(buildBetRecord());

    expect(savedBet).toEqual(buildBetRecord({ line: 9.5, odds: 100 }));
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("getAllBets maps snake_case rows to camelCase records", async () => {
    mockSupabaseClient({
      getAllResponse: {
        data: [buildBetRow({ closing_line: 7.5, closing_odds: -105, bankroll_after: 990 })],
        error: null,
      },
    });

    const bets = await getAllBets();

    expect(bets).toEqual([buildBetRecord({ closingLine: 7.5, closingOdds: -105, bankrollAfter: 990 })]);
  });

  it("updateBetResult updates by id and maps the updated row", async () => {
    const updateCapture: CapturedUpdate = { payload: null, column: "", value: "" };
    mockSupabaseClient({
      updateResponse: { data: buildBetRow({ result: "WIN", bankroll_after: 1025 }), error: null },
      updateCapture,
    });

    const updatedBet = await updateBetResult({ id: "00000000-0000-0000-0000-000000000001", result: "WIN", bankrollAfter: 1025 });

    expect(updateCapture).toEqual({
      payload: { result: "WIN", bankroll_after: 1025 },
      column: "id",
      value: "00000000-0000-0000-0000-000000000001",
    });
    expect(updatedBet).toEqual(buildBetRecord({ result: "WIN", bankrollAfter: 1025 }));
  });

  it("updateBetResult returns null when no row is found", async () => {
    mockSupabaseClient({ updateResponse: { data: null, error: null } });

    const updatedBet = await updateBetResult({ id: "missing-bet", result: "LOSS" });

    expect(updatedBet).toBeNull();
  });

  it("throws sanitized repository errors when Supabase fails", async () => {
    mockSupabaseClient({ getAllResponse: { data: [], error: supabaseError("database unavailable") } });

    await expect(getAllBets()).rejects.toThrow("betRepository.getAllBets failed: database unavailable");
  });
});
