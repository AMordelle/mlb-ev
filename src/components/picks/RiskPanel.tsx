type RiskPanelProps = {
  risks: string[];
};

export function RiskPanel({ risks }: RiskPanelProps) {
  return (
    <section style={{ marginTop: "1.5rem", marginBottom: "2rem" }}>
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
