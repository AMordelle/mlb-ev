const BASELINE_PROBABILITY = 0.5;
const PROBABILITY_SHIFT_PER_RUN = 0.1;
const MIN_PROBABILITY = 0.05;
const MAX_PROBABILITY = 0.95;

export type CalculateProbabilitiesInput = {
  expectedTotal: number;
  lineTotal: number;
};

export type ProbabilityResult = {
  probOver: number;
  probUnder: number;
  edge: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateProbabilities({
  expectedTotal,
  lineTotal,
}: CalculateProbabilitiesInput): ProbabilityResult {
  const diff = expectedTotal - lineTotal;
  const probOver = clamp(
    BASELINE_PROBABILITY + diff * PROBABILITY_SHIFT_PER_RUN,
    MIN_PROBABILITY,
    MAX_PROBABILITY,
  );
  const probUnder = 1 - probOver;

  return {
    probOver,
    probUnder,
    edge: diff,
  };
}
