"use client";

import { useMemo, useState } from "react";

import { OpportunityTable } from "@/components/picks/OpportunityTable";
import { PickCard } from "@/components/picks/PickCard";
import { RiskPanel } from "@/components/picks/RiskPanel";
import type { Confidence, DailyScanResult, GameAnalysisInput } from "@/features/mlb/application/dto/types";
import { analyzeTodayGames } from "@/features/mlb/application/use-cases/analyzeTodayGames";

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

export default function DashboardPage() {
  const [date, setDate] = useState("2026-04-30");
  const [rows, setRows] = useState<GameInputFormRow[]>(defaultRows);
  const [result, setResult] = useState<DailyScanResult | null>(null);

  const rowIndexes = useMemo(() => [0, 1, 2], []);

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

  function handleAnalyze() {
    const gameInputs = buildInputRows();
    const analysis = analyzeTodayGames({ date: date.trim(), gameInputs });
    setResult(analysis);
  }

  return (
    <main className="dashboard-page" style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <h1>MLB EV+ Manual Dashboard</h1>
      <p>Enter up to 3 games, run analysis, and inspect the EV+ scan output.</p>

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
