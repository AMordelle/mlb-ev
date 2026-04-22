import { describe, expect, it } from "vitest";

import { calculateExpectedRuns } from "./calculateExpectedRuns";
import { calculateImpliedProbability } from "./calculateImpliedProbability";
import { calculateProbabilities } from "./calculateProbabilities";
import { calculateEV } from "./calculateEV";

describe("quant engine core calculations", () => {
  it("calculateExpectedRuns returns expected away/home/total run math", () => {
    const result = calculateExpectedRuns({
      awayRG: 4,
      homeERA: 5,
      homeRG: 6,
      awayERA: 3,
    });

    expect(result).toEqual({
      expectedRunsAway: 4.5,
      expectedRunsHome: 4.5,
      expectedTotal: 9,
    });
  });

  it("calculateImpliedProbability returns reciprocal for valid decimal odds", () => {
    expect(calculateImpliedProbability(2)).toBe(0.5);
    expect(calculateImpliedProbability(1.25)).toBeCloseTo(0.8, 8);
  });

  it("calculateImpliedProbability throws for odds less than or equal to 1", () => {
    expect(() => calculateImpliedProbability(1)).toThrow(/greater than 1/i);
    expect(() => calculateImpliedProbability(0.99)).toThrow(/greater than 1/i);
  });

  it("calculateProbabilities returns balanced probabilities when expected total equals line", () => {
    const result = calculateProbabilities({
      expectedTotal: 8.5,
      lineTotal: 8.5,
    });

    expect(result.probOver).toBeCloseTo(0.5, 8);
    expect(result.probUnder).toBeCloseTo(0.5, 8);
  });

  it("calculateProbabilities shifts over/under with expected-line diff and clamps to range", () => {
    const positiveDiff = calculateProbabilities({
      expectedTotal: 10,
      lineTotal: 8,
    });
    const negativeDiff = calculateProbabilities({
      expectedTotal: 7,
      lineTotal: 9,
    });
    const clampedHigh = calculateProbabilities({
      expectedTotal: 30,
      lineTotal: 1,
    });
    const clampedLow = calculateProbabilities({
      expectedTotal: 1,
      lineTotal: 30,
    });

    expect(positiveDiff.probOver).toBeGreaterThan(0.5);
    expect(positiveDiff.probUnder).toBeLessThan(0.5);

    expect(negativeDiff.probOver).toBeLessThan(0.5);
    expect(negativeDiff.probUnder).toBeGreaterThan(0.5);

    expect(clampedHigh.probOver).toBe(0.95);
    expect(clampedLow.probOver).toBe(0.05);
    expect(clampedHigh.probUnder).toBe(0.05);
    expect(clampedLow.probUnder).toBe(0.95);
  });

  it("calculateEV returns expected value for valid probability and odds", () => {
    const result = calculateEV(0.6, 2);

    expect(result).toBeCloseTo(0.2, 8);
  });

  it("calculateEV throws for invalid probability and odds", () => {
    expect(() => calculateEV(-0.01, 2)).toThrow(/between 0 and 1/i);
    expect(() => calculateEV(1.01, 2)).toThrow(/between 0 and 1/i);
    expect(() => calculateEV(0.55, 1)).toThrow(/greater than 1/i);
  });
});
