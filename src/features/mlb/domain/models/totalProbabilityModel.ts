export type TotalProbability = {
  overProbability: number;
  underProbability: number;
};

function roundToThreeDecimals(value: number): number {
  return Number(value.toFixed(3));
}

function computePoissonCdf(lambda: number, maxK: number): number {
  if (maxK < 0) {
    return 0;
  }

  let probabilityMass = Math.exp(-lambda);
  let cdf = probabilityMass;

  for (let k = 1; k <= maxK; k += 1) {
    probabilityMass = (probabilityMass * lambda) / k;
    cdf += probabilityMass;
  }

  return cdf;
}

export function computeTotalProbabilities(params: {
  totalExpectedRuns: number;
  line: number;
}): TotalProbability | null {
  const { totalExpectedRuns, line } = params;

  if (!Number.isFinite(totalExpectedRuns) || totalExpectedRuns <= 0) {
    return null;
  }

  if (!Number.isFinite(line) || line <= 0) {
    return null;
  }

  const overThreshold = Math.floor(line) + 1;
  const underThreshold = Math.ceil(line) - 1;

  const overProbability = 1 - computePoissonCdf(totalExpectedRuns, overThreshold - 1);
  const underProbability = computePoissonCdf(totalExpectedRuns, underThreshold);

  return {
    overProbability: roundToThreeDecimals(overProbability),
    underProbability: roundToThreeDecimals(underProbability),
  };
}
