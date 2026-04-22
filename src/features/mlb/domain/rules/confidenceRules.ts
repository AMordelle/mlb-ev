export const CONFIDENCE_LEVELS = ["HIGH", "MEDIUM", "LOW"] as const;

export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export type ConfidenceInput = {
  homeERA: number;
  awayERA: number;
  lineTotal: number;
  overOdds: number;
  underOdds: number;
};

const LOW_ERA_SAMPLE_RISK_THRESHOLD = 1;

function areOddsValid(overOdds: number, underOdds: number): boolean {
  return Number.isFinite(overOdds) && Number.isFinite(underOdds) && overOdds > 1 && underOdds > 1;
}

function isLineValid(lineTotal: number): boolean {
  return Number.isFinite(lineTotal) && lineTotal > 0;
}

function hasTinySampleEra(era: number): boolean {
  return era > 0 && era < LOW_ERA_SAMPLE_RISK_THRESHOLD;
}

export function getConfidenceLevel({
  homeERA,
  awayERA,
  lineTotal,
  overOdds,
  underOdds,
}: ConfidenceInput): ConfidenceLevel {
  if (!areOddsValid(overOdds, underOdds) || !isLineValid(lineTotal)) {
    return "LOW";
  }

  if (homeERA <= 0 || awayERA <= 0 || hasTinySampleEra(homeERA) || hasTinySampleEra(awayERA)) {
    return "LOW";
  }

  const veryStableEraRange = homeERA >= 2 && homeERA <= 6 && awayERA >= 2 && awayERA <= 6;

  if (veryStableEraRange) {
    return "HIGH";
  }

  return "MEDIUM";
}
