import { describe, expect, it } from "vitest";

import { computeEV } from "./evCalculator";

describe("computeEV", () => {
  it("calculates EV for positive odds", () => {
    const result = computeEV({
      overProbability: 0.55,
      underProbability: 0.45,
      overOdds: 120,
      underOdds: 130,
    });

    expect(result).toEqual({
      overEV: 0.21,
      underEV: 0.035,
    });
  });

  it("calculates EV for negative odds", () => {
    const result = computeEV({
      overProbability: 0.52,
      underProbability: 0.48,
      overOdds: -110,
      underOdds: -105,
    });

    expect(result).toEqual({
      overEV: -0.0073,
      underEV: -0.0629,
    });
  });

  it("supports positive EV when probability is above implied probability", () => {
    const result = computeEV({
      overProbability: 0.6,
      underProbability: 0.4,
      overOdds: 110,
      underOdds: -130,
    });

    expect(result).not.toBeNull();
    expect(result!.overEV).toBeGreaterThan(0);
  });

  it("supports negative EV scenario", () => {
    const result = computeEV({
      overProbability: 0.4,
      underProbability: 0.6,
      overOdds: 110,
      underOdds: -130,
    });

    expect(result).not.toBeNull();
    expect(result!.overEV).toBeLessThan(0);
  });

  it("returns null for invalid probabilities", () => {
    expect(
      computeEV({
        overProbability: -0.1,
        underProbability: 0.5,
        overOdds: -110,
        underOdds: -110,
      }),
    ).toBeNull();

    expect(
      computeEV({
        overProbability: 1.1,
        underProbability: 0.5,
        overOdds: -110,
        underOdds: -110,
      }),
    ).toBeNull();

    expect(
      computeEV({
        overProbability: Number.NaN,
        underProbability: 0.5,
        overOdds: -110,
        underOdds: -110,
      }),
    ).toBeNull();
  });

  it("returns null for invalid odds", () => {
    expect(
      computeEV({
        overProbability: 0.5,
        underProbability: 0.5,
        overOdds: Number.NaN,
        underOdds: -110,
      }),
    ).toBeNull();

    expect(
      computeEV({
        overProbability: 0.5,
        underProbability: 0.5,
        overOdds: -110,
        underOdds: Number.POSITIVE_INFINITY,
      }),
    ).toBeNull();

    expect(
      computeEV({
        overProbability: 0.5,
        underProbability: 0.5,
        overOdds: 0,
        underOdds: -110,
      }),
    ).toBeNull();
  });

  it("rounds EV values to 4 decimals", () => {
    const result = computeEV({
      overProbability: 0.5234,
      underProbability: 0.4766,
      overOdds: -113,
      underOdds: 101,
    });

    expect(result).toEqual({
      overEV: -0.0134,
      underEV: -0.042,
    });
  });
});
