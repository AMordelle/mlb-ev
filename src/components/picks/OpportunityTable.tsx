import type { GameAnalysisResult } from "@/features/mlb/application/dto/types";

type OpportunityTableProps = {
  opportunities: GameAnalysisResult[];
};

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  return (
    <section style={{ marginTop: "1.5rem" }}>
      <h2>Top opportunities</h2>
      {opportunities.length === 0 ? (
        <p>No opportunities available.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Game ID</th>
              <th align="left">Recommendation</th>
              <th align="left">Expected Total</th>
              <th align="left">Prob Over</th>
              <th align="left">Prob Under</th>
              <th align="left">EV Over</th>
              <th align="left">EV Under</th>
              <th align="left">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map((opportunity) => (
              <tr key={opportunity.gameId}>
                <td>{opportunity.gameId}</td>
                <td>{opportunity.recommendation}</td>
                <td>{opportunity.expectedTotal.toFixed(2)}</td>
                <td>{opportunity.probOver.toFixed(4)}</td>
                <td>{opportunity.probUnder.toFixed(4)}</td>
                <td>{opportunity.evOver.toFixed(4)}</td>
                <td>{opportunity.evUnder.toFixed(4)}</td>
                <td>{opportunity.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
