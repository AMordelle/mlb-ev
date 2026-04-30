import type { GameAnalysisResult } from "@/features/mlb/application/dto/types";

type OpportunityTableProps = {
  opportunities: GameAnalysisResult[];
};

export function OpportunityTable({ opportunities }: OpportunityTableProps) {
  return (
    <section>
      <h2>Top opportunities</h2>
      {opportunities.length === 0 ? (
        <p>No opportunities available.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>gameId</th>
              <th>recommendation</th>
              <th>expectedTotal</th>
              <th>probOver</th>
              <th>probUnder</th>
              <th>evOver</th>
              <th>evUnder</th>
              <th>confidence</th>
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
