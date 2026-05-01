import { describe, expect, it } from "vitest";

import { computeTotalProbabilities } from "./totalProbabilityModel";

describe("computeTotalProbabilities", () => {
  it("returns null for invalid totalExpectedRuns", () => {
    expect(
      computeTotalProbabilities({
        totalExpectedRuns: 0,
        line: 8.5,
      }),
    ).toBeNull();

    expect(
      computeTotalProbabilities({
        totalExpectedRuns: -1,
        line: 8.5,
      }),
    ).toBeNull();

    expect(
      computeTotalProbabilities({
        totalExpectedRuns: Number.NaN,
        line: 8.5,
      }),
    ).toBeNull();
  });

  it("returns null for invalid line", () => {
    expect(
      computeTotalProbabilities({
        totalExpectedRuns: 8.5,
        line: 0,
      }),
    ).toBeNull();

    expect(
      computeTotalProbabilities({
        totalExpectedRuns: 8.5,
        line: -1,
      }),
    ).toBeNull();

    expect(
      computeTotalProbabilities({
        totalExpectedRuns: 8.5,
        line: Number.NaN,
      }),
    ).toBeNull();
  });

  it("supports half-run lines where over and under approximately sum to 1", () => {
    const result = computeTotalProbabilities({
      totalExpectedRuns: 8.5,
      line: 8.5,
    });

    expect(result).not.toBeNull();
    expect(result!.overProbability).toBeGreaterThan(0);
    expect(result!.underProbability).toBeGreaterThan(0);
    expect(result!.overProbability + result!.underProbability).toBeCloseTo(1, 2);
  });

  it("favors over when expected total is above the line", () => {
    const result = computeTotalProbabilities({
      totalExpectedRuns: 10,
      line: 8.5,
    });

    expect(result).not.toBeNull();
    expect(result!.overProbability).toBeGreaterThan(result!.underProbability);
  });

  it("favors under when expected total is below the line", () => {
    const result = computeTotalProbabilities({
      totalExpectedRuns: 7,
      line: 8.5,
    });

    expect(result).not.toBeNull();
    expect(result!.underProbability).toBeGreaterThan(result!.overProbability);
  });

  it("excludes push probability for whole-number lines", () => {
    const result = computeTotalProbabilities({
      totalExpectedRuns: 8,
      line: 8,
    });

    expect(result).not.toBeNull();
    expect(result!.overProbability + result!.underProbability).toBeLessThan(1);
  });

  it("rounds probabilities to 3 decimals", () => {
    const result = computeTotalProbabilities({
      totalExpectedRuns: 8.73,
      line: 8.5,
    });

    expect(result).not.toBeNull();
    expect(result!.overProbability).toBe(Number(result!.overProbability.toFixed(3)));
    expect(result!.underProbability).toBe(Number(result!.underProbability.toFixed(3)));
  });
});
