"use client";

import { useEffect, useState } from "react";

import { calculateBetProfit, type HistorySummary } from "@/features/mlb/application/services/historySummaryService";
import type { BetRecord } from "@/features/mlb/domain/models/betRecord";

type BetsResponse = {
  ok: true;
  bets: BetRecord[];
};

type HistorySummaryResponse = {
  ok: true;
  summary: HistorySummary;
};

type HistoryState = {
  bets: BetRecord[];
  summary: HistorySummary;
};

const emptySummary: HistorySummary = {
  totalBets: 0,
  pendingBets: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  totalStaked: 0,
  totalProfit: 0,
  winRate: 0,
  yield: 0,
  bankrollCurrent: null,
};

const cardStyle = {
  border: "1px solid #d1d5db",
  borderRadius: "0.5rem",
  padding: "1rem",
  background: "#ffffff",
} as const;

const tableCellStyle = {
  borderBottom: "1px solid #e5e7eb",
  padding: "0.5rem",
} as const;

const tableHeaderStyle = {
  textAlign: "left",
  borderBottom: "1px solid #d1d5db",
  padding: "0.5rem",
} as const;

function formatNumber(value: number | null, decimals: number): string {
  return value === null ? "-" : value.toFixed(decimals);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatCurrency(value: number | null): string {
  return value === null ? "-" : value.toFixed(2);
}

function formatBet(bet: BetRecord): string {
  return `${bet.betType} ${bet.line}`;
}

async function fetchHistory(): Promise<HistoryState> {
  const [betsResponse, summaryResponse] = await Promise.all([fetch("/api/mlb/bets"), fetch("/api/mlb/history-summary")]);

  if (!betsResponse.ok || !summaryResponse.ok) {
    throw new Error("Unable to load history");
  }

  const betsPayload = (await betsResponse.json()) as BetsResponse;
  const summaryPayload = (await summaryResponse.json()) as HistorySummaryResponse;

  return {
    bets: betsPayload.bets,
    summary: summaryPayload.summary,
  };
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryState>({ bets: [], summary: emptySummary });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      try {
        const nextHistory = await fetchHistory();

        if (isMounted) {
          setHistory(nextHistory);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load history");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, []);

  const { bets, summary } = history;

  return (
    <main style={{ padding: "1rem" }}>
      <h1>Historial</h1>
      <p>Resumen histórico y desempeño de las apuestas MLB EV+ trackeadas en memoria.</p>

      {isLoading ? <p>Loading history...</p> : null}
      {errorMessage ? <p style={{ color: "#b91c1c" }}>{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <>
          <section
            aria-label="History summary"
            style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", marginTop: "1rem" }}
          >
            <article style={cardStyle}>
              <strong>Total Bets</strong>
              <p>{summary.totalBets}</p>
            </article>
            <article style={cardStyle}>
              <strong>Wins</strong>
              <p>{summary.wins}</p>
            </article>
            <article style={cardStyle}>
              <strong>Losses</strong>
              <p>{summary.losses}</p>
            </article>
            <article style={cardStyle}>
              <strong>Pending</strong>
              <p>{summary.pendingBets}</p>
            </article>
            <article style={cardStyle}>
              <strong>Win Rate</strong>
              <p>{formatPercent(summary.winRate)}</p>
            </article>
            <article style={cardStyle}>
              <strong>Yield</strong>
              <p>{formatPercent(summary.yield)}</p>
            </article>
            <article style={cardStyle}>
              <strong>Total Profit</strong>
              <p>{formatCurrency(summary.totalProfit)}</p>
            </article>
            <article style={cardStyle}>
              <strong>Current Bankroll</strong>
              <p>{formatCurrency(summary.bankrollCurrent)}</p>
            </article>
          </section>

          <section style={{ marginTop: "2rem" }}>
            <h2>Tracked Bets</h2>
            {bets.length === 0 ? (
              <p>No bets tracked</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>Date</th>
                      <th style={tableHeaderStyle}>GamePk</th>
                      <th style={tableHeaderStyle}>Bet</th>
                      <th style={tableHeaderStyle}>Odds</th>
                      <th style={tableHeaderStyle}>EV</th>
                      <th style={tableHeaderStyle}>Stake</th>
                      <th style={tableHeaderStyle}>Result</th>
                      <th style={tableHeaderStyle}>Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bets.map((bet) => (
                      <tr key={bet.id}>
                        <td style={tableCellStyle}>{bet.date}</td>
                        <td style={tableCellStyle}>{bet.gamePk}</td>
                        <td style={tableCellStyle}>{formatBet(bet)}</td>
                        <td style={tableCellStyle}>{bet.odds}</td>
                        <td style={tableCellStyle}>{formatNumber(bet.ev, 4)}</td>
                        <td style={tableCellStyle}>{formatCurrency(bet.stake)}</td>
                        <td style={tableCellStyle}>{bet.result}</td>
                        <td style={tableCellStyle}>{formatCurrency(calculateBetProfit(bet))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
