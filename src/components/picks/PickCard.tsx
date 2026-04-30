import type { GameAnalysisResult } from "@/features/mlb/application/dto/types";

type PickCardProps = {
  primaryPick: GameAnalysisResult | null;
};

export function PickCard({ primaryPick }: PickCardProps) {
  if (!primaryPick) {
    return (
      <section>
        <h2>Primary pick</h2>
        <p>No bet recommended</p>
      </section>
    );
  }

  return (
    <section>
      <h2>Primary pick</h2>
      <ul>
        <li>
          <strong>Recommendation:</strong> {primaryPick.recommendation}
        </li>
        <li>
          <strong>Line:</strong> {primaryPick.recommendedLine ?? "N/A"}
        </li>
        <li>
          <strong>Odds:</strong> {primaryPick.recommendedOdds ?? "N/A"}
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
