export type ExpectedValueResult = {
  overEV: number | null;
  underEV: number | null;
};

function americanToDecimalOdds(odds: number): number {
  if (odds > 0) {
    return 1 + odds / 100;
  }

  return 1 + 100 / Math.abs(odds);
}

function roundToFourDecimals(value: number): number {
  return Number(value.toFixed(4));
}

function isValidProbability(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

export function computeEV(params: {
  overProbability: number;
  underProbability: number;
  overOdds: number;
  underOdds: number;
}): ExpectedValueResult | null {
  const { overProbability, underProbability, overOdds, underOdds } = params;

  if (!isValidProbability(overProbability) || !isValidProbability(underProbability)) {
    return null;
  }

  if (!Number.isFinite(overOdds) || !Number.isFinite(underOdds) || overOdds === 0 || underOdds === 0) {
    return null;
  }

  const overDecimal = americanToDecimalOdds(overOdds);
  const underDecimal = americanToDecimalOdds(underOdds);

  const overEV = (overProbability * (overDecimal - 1)) - (1 - overProbability);
  const underEV = (underProbability * (underDecimal - 1)) - (1 - underProbability);

  return {
    overEV: roundToFourDecimals(overEV),
    underEV: roundToFourDecimals(underEV),
  };
}
