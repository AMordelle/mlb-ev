export function calculateImpliedProbability(odds: number): number {
  if (!Number.isFinite(odds) || odds <= 1) {
    throw new Error("Odds must be a finite decimal value greater than 1.");
  }

  return 1 / odds;
}
