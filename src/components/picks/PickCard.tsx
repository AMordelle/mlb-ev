import type { GameAnalysisResult } from "@/features/mlb/application/dto/types";

type PickCardProps = {
  primaryPick: GameAnalysisResult | null;
};

function getBetMeaning(recommendation: string, line: number | null | undefined): string | null {
  if (line == null) {
    return null;
  }

  const hasWholeNumberLine = Number.isInteger(line);

  if (recommendation === "OVER") {
    const winTarget = hasWholeNumberLine ? `${line + 1}+` : `${Math.floor(line) + 1}+`;
    const pushNote = hasWholeNumberLine
      ? ` If total runs equal ${line}, this may be a push depending on sportsbook rules.`
      : "";

    return `Bet wins if total runs are greater than the line. For line ${line}, this means ${winTarget} total runs.${pushNote}`;
  }

  if (recommendation === "UNDER") {
    const winTarget = hasWholeNumberLine ? `${line - 1} or fewer` : `${Math.floor(line)} or fewer`;
    const pushNote = hasWholeNumberLine
      ? ` If total runs equal ${line}, this may be a push depending on sportsbook rules.`
      : "";

    return `Bet wins if total runs are lower than the line. For line ${line}, this means ${winTarget} total runs.${pushNote}`;
  }

  return null;
}

export function PickCard({ primaryPick }: PickCardProps) {
  if (!primaryPick) {
    return (
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Primary pick</h2>
        <p>No bet recommended</p>
      </section>
    );
  }

  const line = primaryPick.recommendedLine ?? null;
  const odds = primaryPick.recommendedOdds ?? null;
  const explanation = getBetMeaning(primaryPick.recommendation, line);

  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>Primary pick</h2>
      {line != null && odds != null ? (
        <p>
          <strong>Recommended bet:</strong> {primaryPick.recommendation} {line} at odds {odds}
        </p>
      ) : null}
      {explanation ? (
        <p>
          <strong>Meaning:</strong> {explanation}
        </p>
      ) : null}
      <ul>
        <li>
          <strong>Recommendation:</strong> {primaryPick.recommendation}
        </li>
        <li>
          <strong>Line:</strong> {line ?? "N/A"}
        </li>
        <li>
          <strong>Odds:</strong> {odds ?? "N/A"}
        </li>
        <li>
          <strong>EV:</strong> {Math.max(primaryPick.evOver, primaryPick.evUnder).toFixed(4)}
        </li>
        <li>
          <strong>Confidence:</strong> {primaryPick.confidence}
        </li>
        <li>
          <strong>Reason:</strong> {primaryPick.reason ?? "N/A"}
        </li>
      </ul>
    </section>
  );
}
