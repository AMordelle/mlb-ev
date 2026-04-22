export type CalculateExpectedRunsInput = {
  homeRG: number;
  awayRG: number;
  homeERA: number;
  awayERA: number;
};

export type ExpectedRunsResult = {
  expectedRunsHome: number;
  expectedRunsAway: number;
  expectedTotal: number;
};

export function calculateExpectedRuns({
  homeRG,
  awayRG,
  homeERA,
  awayERA,
}: CalculateExpectedRunsInput): ExpectedRunsResult {
  const expectedRunsAway = (awayRG + homeERA) / 2;
  const expectedRunsHome = (homeRG + awayERA) / 2;
  const expectedTotal = expectedRunsAway + expectedRunsHome;

  return {
    expectedRunsHome,
    expectedRunsAway,
    expectedTotal,
  };
}
