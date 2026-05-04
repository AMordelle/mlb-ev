"use client";

import { useMemo, useState } from "react";

import { OpportunityTable } from "@/components/picks/OpportunityTable";
import { PickCard } from "@/components/picks/PickCard";
import { RiskPanel } from "@/components/picks/RiskPanel";
import type {
  Confidence,
  DailyScanResult,
  EnrichedGame,
  EnrichedGameRunProjection,
  GameAnalysis,
  GameOdds,
  GameAnalysisInput,
  GameRecord,
} from "@/features/mlb/application/dto/types";
import type { SelectedBet } from "@/features/mlb/domain/models/betSelector";
import { buildDataReadinessSummary } from "@/features/mlb/application/services/dataReadinessService";
import { analyzeTodayGames } from "@/features/mlb/application/use-cases/analyzeTodayGames";
import { todayISO } from "@/lib/utils/dates";

type GameInputFormRow = {
  gameId: string;
  homeRG: string;
  awayRG: string;
  homePitcher: string;
  awayPitcher: string;
  homeERA: string;
  awayERA: string;
  lineTotal: string;
  overOdds: string;
  underOdds: string;
  dataConfidence: Confidence;
};

type RefreshGamesSuccess = {
  ok: true;
  date: string;
  count: number;
  games: GameRecord[];
  enrichedGames: EnrichedGame[];
  runProjections: EnrichedGameRunProjection[];
  odds: Record<string, GameOdds>;
  analysis: GameAnalysis[];
  selectedBets: SelectedBet[];
};

type RefreshGamesError = {
  ok: false;
  error: string;
};

const defaultRows: GameInputFormRow[] = [
  {
    gameId: "NYY-BOS-2026-04-30",
    homeRG: "4.8",
    awayRG: "4.4",
    homePitcher: "Cole",
    awayPitcher: "Bello",
    homeERA: "3.2",
    awayERA: "4.1",
    lineTotal: "8.5",
    overOdds: "1.95",
    underOdds: "1.87",
    dataConfidence: "HIGH",
  },
  {
    gameId: "LAD-SD-2026-04-30",
    homeRG: "5.3",
    awayRG: "4.6",
    homePitcher: "Yamamoto",
    awayPitcher: "Darvish",
    homeERA: "2.9",
    awayERA: "3.6",
    lineTotal: "8.0",
    overOdds: "1.91",
    underOdds: "1.91",
    dataConfidence: "MEDIUM",
  },
  {
    gameId: "ATL-PHI-2026-04-30",
    homeRG: "5.0",
    awayRG: "4.9",
    homePitcher: "Sale",
    awayPitcher: "Nola",
    homeERA: "3.5",
    awayERA: "3.7",
    lineTotal: "8.5",
    overOdds: "1.93",
    underOdds: "1.89",
    dataConfidence: "MEDIUM",
  },
];

function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatNullableValue(value: number | string | null): string | number {
  return value ?? "-";
}

function formatProjectionValue(value: number | null): string {
  return value === null ? "-" : value.toFixed(3);
}

function formatProbabilityValue(value: number | null): string {
  return value === null ? "-" : value.toFixed(3);
}

function formatEvValue(value: number | null): string {
  return value === null ? "-" : value.toFixed(4);
}

function formatReadinessPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

type OddsRow = {
  gamePk: number;
  homeTeam: string;
  awayTeam: string;
  lineTotal: number | null;
  overOdds: number | null;
  underOdds: number | null;
  sportsbook: string;
};

export default function DashboardPage() {
  const [date, setDate] = useState("2026-04-30");
  const [rows, setRows] = useState<GameInputFormRow[]>(defaultRows);
  const [result, setResult] = useState<DailyScanResult | null>(null);

  const [refreshDate, setRefreshDate] = useState(todayISO());
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [refreshResult, setRefreshResult] = useState<RefreshGamesSuccess | null>(null);

  const rowIndexes = useMemo(() => [0, 1, 2], []);
  const oddsRows = useMemo<OddsRow[]>(() => {
    if (!refreshResult) {
      return [];
    }

    return Object.entries(refreshResult.odds as Record<string, GameOdds>).map(([gamePkKey, gameOdds]) => {
      const gamePk = Number(gamePkKey);
      const matchedGame = refreshResult.games.find((game) => game.gamePk === gamePk);

      return {
        gamePk,
        homeTeam: matchedGame?.homeTeam ?? "-",
        awayTeam: matchedGame?.awayTeam ?? "-",
        lineTotal: gameOdds.lineTotal,
        overOdds: gameOdds.overOdds,
        underOdds: gameOdds.underOdds,
        sportsbook: gameOdds.sportsbook,
      };
    });
  }, [refreshResult]);
  const dataReadinessSummary = useMemo(() => {
    if (!refreshResult) {
      return null;
    }

    return buildDataReadinessSummary(refreshResult.analysis ?? []);
  }, [refreshResult]);

  function updateRow(index: number, patch: Partial<GameInputFormRow>) {
    setRows((prevRows) => prevRows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function buildInputRows(): GameAnalysisInput[] {
    return rows.map((row) => ({
      gameId: row.gameId.trim(),
      homeRG: parseNumber(row.homeRG),
      awayRG: parseNumber(row.awayRG),
      homePitcher: row.homePitcher.trim(),
      awayPitcher: row.awayPitcher.trim(),
      homeERA: parseNumber(row.homeERA),
      awayERA: parseNumber(row.awayERA),
      lineTotal: parseNumber(row.lineTotal),
      overOdds: parseNumber(row.overOdds),
      underOdds: parseNumber(row.underOdds),
      dataConfidence: row.dataConfidence,
    }));
  }

  async function handleRefreshGames() {
    setRefreshLoading(true);
    setRefreshError(null);
    setRefreshResult(null);

    try {
      const response = await fetch("/api/mlb/refresh-games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ date: refreshDate.trim() }),
      });

      const body: RefreshGamesSuccess | RefreshGamesError = await response.json();
      if (!response.ok || !body.ok) {
        throw new Error(body.ok ? "Failed to refresh MLB games." : body.error);
      }

      setRefreshResult(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setRefreshError(message);
    } finally {
      setRefreshLoading(false);
    }
  }

  function handleAnalyze() {
    const gameInputs = buildInputRows();
    const analysis = analyzeTodayGames({ date: date.trim(), gameInputs });
    setResult(analysis);
  }

  return (
    <main className="dashboard-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <h1>MLB EV+ Manual Dashboard</h1>
      <p>Enter up to 3 games, run analysis, and inspect the EV+ scan output.</p>

      <section className="refresh-games" style={{ marginTop: "1rem" }}>
        <h2>Actualizar juegos MLB</h2>
        <p>Dispara la ingesta de calendario desde el endpoint existente y revisa el resultado.</p>

        <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
          <label htmlFor="refresh-date">
            Fecha
            <br />
            <input
              id="refresh-date"
              type="date"
              value={refreshDate}
              onChange={(event) => setRefreshDate(event.target.value)}
            />
          </label>

          <button
            type="button"
            onClick={handleRefreshGames}
            disabled={refreshLoading}
            style={{ padding: "0.6rem 1rem", fontWeight: 600 }}
          >
            {refreshLoading ? "Actualizando..." : "Actualizar juegos"}
          </button>
        </div>

        {refreshError ? (
          <p role="alert" style={{ marginTop: "0.75rem", color: "#b91c1c" }}>
            {refreshError}
          </p>
        ) : null}

        {refreshResult ? (
          <div style={{ marginTop: "1rem" }}>
            <h3>Resultado</h3>
            <ul>
              <li>
                <strong>Date:</strong> {refreshResult.date}
              </li>
              <li>
                <strong>Count:</strong> {refreshResult.count}
              </li>
            </ul>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayTeam</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeTeam</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>venue</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>status</th>
                    <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>officialDatetime</th>
                  </tr>
                </thead>
                <tbody>
                  {refreshResult.games.map((game) => (
                    <tr key={game.id}>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.gamePk}</td>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.awayTeam}</td>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.homeTeam}</td>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.venue ?? "-"}</td>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.status}</td>
                      <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.officialDatetime ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 style={{ marginTop: "1rem" }}>Enriched Games</h3>
            {refreshResult.enrichedGames.length === 0 ? (
              <p>No enriched data available</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeTeamId</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayTeamId</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeRunsPerGame</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayRunsPerGame</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homePitcherEra</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayPitcherEra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshResult.enrichedGames.map((game) => (
                      <tr key={game.gamePk}>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.gamePk}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.homeTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{game.awayTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.homeTeamId)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.awayTeamId)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.homeRunsPerGame)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.awayRunsPerGame)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.homePitcherEra)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(game.awayPitcherEra)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginTop: "1rem" }}>Run Projections</h3>
            {refreshResult.runProjections.length === 0 ? (
              <p>No projections available</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeExpectedRuns</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayExpectedRuns</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>totalExpectedRuns</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshResult.runProjections.map((projection) => (
                      <tr key={projection.gamePk}>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{projection.gamePk}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{projection.homeTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{projection.awayTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProjectionValue(projection.homeExpectedRuns)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProjectionValue(projection.awayExpectedRuns)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProjectionValue(projection.totalExpectedRuns)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{projection.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginTop: "1rem" }}>Odds</h3>
            {oddsRows.length === 0 ? (
              <p>No odds available</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>homeTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>awayTeam</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>lineTotal</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>overOdds</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>underOdds</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>sportsbook</th>
                    </tr>
                  </thead>
                  <tbody>
                    {oddsRows.map((oddsRow) => (
                      <tr key={oddsRow.gamePk}>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{oddsRow.gamePk}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{oddsRow.homeTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{oddsRow.awayTeam}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(oddsRow.lineTotal)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(oddsRow.overOdds)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(oddsRow.underOdds)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{oddsRow.sportsbook}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginTop: "1rem" }}>Data Readiness</h3>
            {dataReadinessSummary ? (
              <ul>
                <li>
                  <strong>Total games:</strong> {dataReadinessSummary.totalGames}
                </li>
                <li>
                  <strong>Valid games:</strong> {dataReadinessSummary.validGames}
                </li>
                <li>
                  <strong>Invalid games:</strong> {dataReadinessSummary.invalidGames}
                </li>
                <li>
                  <strong>Readiness rate:</strong> {formatReadinessPercentage(dataReadinessSummary.readinessRate)}
                </li>
                <li>
                  <strong>Missing projection:</strong> {dataReadinessSummary.missingProjection}
                </li>
                <li>
                  <strong>Missing odds:</strong> {dataReadinessSummary.missingOdds}
                </li>
                <li>
                  <strong>Missing line:</strong> {dataReadinessSummary.missingLine}
                </li>
                <li>
                  <strong>Other:</strong> {dataReadinessSummary.other}
                </li>
              </ul>
            ) : (
              <p>No data readiness summary available.</p>
            )}

            <h3 style={{ marginTop: "1rem" }}>Game Analysis</h3>
            {!refreshResult.analysis || refreshResult.analysis.length === 0 ? (
              <p>No analysis available</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>matchup</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>lineTotal</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>odds</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>totalExpectedRuns</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>overProbability</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>underProbability</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>overEV</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>underEV</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>valid</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshResult.analysis.map((item) => (
                      <tr key={item.gamePk}>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{item.gamePk}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>
                          {item.awayTeam} @ {item.homeTeam}
                        </td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(item.lineTotal)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>
                          Over {formatNullableValue(item.overOdds)} / Under {formatNullableValue(item.underOdds)}
                        </td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>
                          {formatNullableValue(item.totalExpectedRuns)}
                        </td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProbabilityValue(item.overProbability)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProbabilityValue(item.underProbability)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatEvValue(item.overEV)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatEvValue(item.underEV)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{item.valid ? "Yes" : "No"}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{item.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <h3 style={{ marginTop: "1rem" }}>Selected Bets (EV+)</h3>
            {!refreshResult.selectedBets || refreshResult.selectedBets.length === 0 ? (
              <p>No bets selected</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>gamePk</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>betType</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>line</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>odds</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>probability</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>ev</th>
                      <th style={{ textAlign: "left", borderBottom: "1px solid #d1d5db", padding: "0.5rem" }}>reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refreshResult.selectedBets.map((bet) => (
                      <tr key={`${bet.gamePk}-${bet.betType}-${bet.line}`}>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{bet.gamePk}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{bet.betType}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(bet.line)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatNullableValue(bet.odds)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatProbabilityValue(bet.probability)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{formatEvValue(bet.ev)}</td>
                        <td style={{ borderBottom: "1px solid #e5e7eb", padding: "0.5rem" }}>{bet.reason ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </section>

      <section className="scan-inputs" style={{ marginTop: "1rem" }}>
        <h2>Scan inputs</h2>
        <p style={{ marginBottom: "1rem" }}>
          <strong>Field help:</strong> R/G = runs per game. ERA = pitcher earned run average. Total Line = market
          total (e.g. 8.5). Over Odds / Under Odds = decimal odds.
        </p>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="scan-date">Date</label>
          <br />
          <input id="scan-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </div>

        {rowIndexes.map((index) => {
          const row = rows[index];

          return (
            <fieldset
              key={index}
              style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: "1rem", marginBottom: "1rem" }}
            >
              <legend>
                <strong>Game {index + 1}</strong>
              </legend>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                <label htmlFor={`gameId-${index}`}>
                  Game ID
                  <input
                    id={`gameId-${index}`}
                    value={row.gameId}
                    onChange={(event) => updateRow(index, { gameId: event.target.value })}
                  />
                </label>

                <label htmlFor={`homeRG-${index}`}>
                  Home R/G
                  <input
                    id={`homeRG-${index}`}
                    value={row.homeRG}
                    onChange={(event) => updateRow(index, { homeRG: event.target.value })}
                  />
                </label>

                <label htmlFor={`awayRG-${index}`}>
                  Away R/G
                  <input
                    id={`awayRG-${index}`}
                    value={row.awayRG}
                    onChange={(event) => updateRow(index, { awayRG: event.target.value })}
                  />
                </label>

                <label htmlFor={`homePitcher-${index}`}>
                  Home Pitcher
                  <input
                    id={`homePitcher-${index}`}
                    value={row.homePitcher}
                    onChange={(event) => updateRow(index, { homePitcher: event.target.value })}
                  />
                </label>

                <label htmlFor={`awayPitcher-${index}`}>
                  Away Pitcher
                  <input
                    id={`awayPitcher-${index}`}
                    value={row.awayPitcher}
                    onChange={(event) => updateRow(index, { awayPitcher: event.target.value })}
                  />
                </label>

                <label htmlFor={`homeERA-${index}`}>
                  Home ERA
                  <input
                    id={`homeERA-${index}`}
                    value={row.homeERA}
                    onChange={(event) => updateRow(index, { homeERA: event.target.value })}
                  />
                </label>

                <label htmlFor={`awayERA-${index}`}>
                  Away ERA
                  <input
                    id={`awayERA-${index}`}
                    value={row.awayERA}
                    onChange={(event) => updateRow(index, { awayERA: event.target.value })}
                  />
                </label>

                <label htmlFor={`lineTotal-${index}`}>
                  Total Line
                  <input
                    id={`lineTotal-${index}`}
                    value={row.lineTotal}
                    onChange={(event) => updateRow(index, { lineTotal: event.target.value })}
                  />
                </label>

                <label htmlFor={`overOdds-${index}`}>
                  Over Odds
                  <input
                    id={`overOdds-${index}`}
                    value={row.overOdds}
                    onChange={(event) => updateRow(index, { overOdds: event.target.value })}
                  />
                </label>

                <label htmlFor={`underOdds-${index}`}>
                  Under Odds
                  <input
                    id={`underOdds-${index}`}
                    value={row.underOdds}
                    onChange={(event) => updateRow(index, { underOdds: event.target.value })}
                  />
                </label>

                <label htmlFor={`dataConfidence-${index}`}>
                  Data Confidence
                  <select
                    id={`dataConfidence-${index}`}
                    value={row.dataConfidence}
                    onChange={(event) => updateRow(index, { dataConfidence: event.target.value as Confidence })}
                  >
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </label>
              </div>
            </fieldset>
          );
        })}

        <button type="button" onClick={handleAnalyze} style={{ padding: "0.6rem 1rem", fontWeight: 600 }}>
          Analyze
        </button>
      </section>

      {result ? (
        <>
          <section style={{ marginTop: "1.5rem" }}>
            <h2>Summary</h2>
            <ul>
              <li>
                <strong>Date:</strong> {result.date}
              </li>
              <li>
                <strong>Analyzed:</strong> {result.analyzed}
              </li>
              <li>
                <strong>Discarded:</strong> {result.discarded}
              </li>
              <li>
                <strong>Top opportunities:</strong> {result.topOpportunities.length}
              </li>
            </ul>
          </section>

          <PickCard primaryPick={result.primaryPick} />
          <OpportunityTable opportunities={result.topOpportunities} />
          <RiskPanel risks={result.risks} />
        </>
      ) : null}
    </main>
  );
}
