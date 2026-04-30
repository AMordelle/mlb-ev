type RiskPanelProps = {
  risks: string[];
};

export function RiskPanel({ risks }: RiskPanelProps) {
  return (
    <section>
      <h2>Risks</h2>
      {risks.length === 0 ? (
        <p>No risks reported.</p>
      ) : (
        <ul>
          {risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
