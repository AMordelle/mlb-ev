"use client";

import { useMemo, useState } from "react";

import { OpportunityTable } from "@/components/picks/OpportunityTable";
import { PickCard } from "@/components/picks/PickCard";
import { RiskPanel } from "@/components/picks/RiskPanel";
import { analyzeTodayGames } from "@/features/mlb/application/use-cases/analyzeTodayGames";
import type { Confidence, DailyScanResult, GameAnalysisInput } from "@/features/mlb/application/dto/types";

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
    <main>
      <h1>MLB EV+ Manual Dashboard</h1>
      <p>Enter up to 3 games, run analysis, and inspect the EV+ scan output.</p>

      <section>
        <h2>Scan inputs</h2>
        <label htmlFor="scan-date">Date</label>
        <input id="scan-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />

        {rowIndexes.map((index) => {
          const row = rows[index];

          return (
            <fieldset key={index}>
              <legend>Game {index + 1}</legend>
              <input
                placeholder="gameId"
                value={row.gameId}
                onChange={(event) => updateRow(index, { gameId: event.target.value })}
              />
              <input
                placeholder="homeRG"
                value={row.homeRG}
                onChange={(event) => updateRow(index, { homeRG: event.target.value })}
              />
              <input
                placeholder="awayRG"
                value={row.awayRG}
                onChange={(event) => updateRow(index, { awayRG: event.target.value })}
              />
              <input
                placeholder="homePitcher"
                value={row.homePitcher}
                onChange={(event) => updateRow(index, { homePitcher: event.target.value })}
              />
              <input
                placeholder="awayPitcher"
                value={row.awayPitcher}
                onChange={(event) => updateRow(index, { awayPitcher: event.target.value })}
              />
              <input
                placeholder="homeERA"
                value={row.homeERA}
                onChange={(event) => updateRow(index, { homeERA: event.target.value })}
              />
              <input
                placeholder="awayERA"
                value={row.awayERA}
                onChange={(event) => updateRow(index, { awayERA: event.target.value })}
              />
              <input
                placeholder="lineTotal"
                value={row.lineTotal}
                onChange={(event) => updateRow(index, { lineTotal: event.target.value })}
              />
              <input
                placeholder="overOdds"
                value={row.overOdds}
                onChange={(event) => updateRow(index, { overOdds: event.target.value })}
              />
              <input
                placeholder="underOdds"
                value={row.underOdds}
                onChange={(event) => updateRow(index, { underOdds: event.target.value })}
              />
              <select
                value={row.dataConfidence}
                onChange={(event) => updateRow(index, { dataConfidence: event.target.value as Confidence })}
              >
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </fieldset>
          );
        })}

        <button type="button" onClick={handleAnalyze}>
          Analyze
        </button>
      </section>

      {result ? (
        <>
          <section>
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
