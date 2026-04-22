import type { DailyScanResult, GameAnalysisInput, GameAnalysisResult } from "../dto/types";
import { calculateEV, getRecommendationFromEV } from "../../domain/services/calculateEV";
import { calculateExpectedRuns } from "../../domain/services/calculateExpectedRuns";
import { calculateImpliedProbability } from "../../domain/services/calculateImpliedProbability";
import { calculateProbabilities } from "../../domain/services/calculateProbabilities";
import { getConfidenceLevel } from "../../domain/rules/confidenceRules";
import { getTopOpportunities } from "./getTopOpportunities";

type AnalyzeTodayGamesParams = {
  date: string;
  gameInputs: GameAnalysisInput[];
};

function isNonEmptyString(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFinitePositiveNumber(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isValidGameAnalysisInput(input: GameAnalysisInput): boolean {
  return (
    isNonEmptyString(input.gameId) &&
    isNonEmptyString(input.homePitcher) &&
    isNonEmptyString(input.awayPitcher) &&
    Number.isFinite(input.homeRG) &&
    Number.isFinite(input.awayRG) &&
    Number.isFinite(input.homeERA) &&
    Number.isFinite(input.awayERA) &&
    isFinitePositiveNumber(input.lineTotal) &&
    Number.isFinite(input.overOdds) &&
    Number.isFinite(input.underOdds) &&
    input.overOdds > 1 &&
    input.underOdds > 1
  );
}

function buildAnalysisResult(input: GameAnalysisInput): GameAnalysisResult {
  const expectedRuns = calculateExpectedRuns({
    homeRG: input.homeRG,
    awayRG: input.awayRG,
    homeERA: input.homeERA,
    awayERA: input.awayERA,
  });

  const probabilities = calculateProbabilities({
    expectedTotal: expectedRuns.expectedTotal,
    lineTotal: input.lineTotal,
  });

  const impliedProbOver = calculateImpliedProbability(input.overOdds);
  const impliedProbUnder = calculateImpliedProbability(input.underOdds);

  const evOver = calculateEV(probabilities.probOver, input.overOdds);
  const evUnder = calculateEV(probabilities.probUnder, input.underOdds);

  const confidence = getConfidenceLevel({
    homeERA: input.homeERA,
    awayERA: input.awayERA,
    lineTotal: input.lineTotal,
    overOdds: input.overOdds,
    underOdds: input.underOdds,
  });

  const recommendation = getRecommendationFromEV({
    evOver,
    evUnder,
    overOdds: input.overOdds,
    underOdds: input.underOdds,
    expectedTotal: expectedRuns.expectedTotal,
    lineTotal: input.lineTotal,
  });

  return {
    gameId: input.gameId,
    expectedRunsHome: expectedRuns.expectedRunsHome,
    expectedRunsAway: expectedRuns.expectedRunsAway,
    expectedTotal: expectedRuns.expectedTotal,
    probOver: probabilities.probOver,
    probUnder: probabilities.probUnder,
    impliedProbOver,
    impliedProbUnder,
    evOver,
    evUnder,
    confidence,
    recommendation: recommendation.recommendation,
    recommendedLine: recommendation.recommendedLine,
    recommendedOdds: recommendation.recommendedOdds,
    reason: recommendation.reason,
  };
}

export function analyzeTodayGames({ date, gameInputs }: AnalyzeTodayGamesParams): DailyScanResult {
  const results: GameAnalysisResult[] = [];
  let discarded = 0;

  for (const input of gameInputs) {
    if (!isValidGameAnalysisInput(input)) {
      discarded += 1;
      continue;
    }

    results.push(buildAnalysisResult(input));
  }

  const topOpportunities = getTopOpportunities(results);
  const primaryPick = topOpportunities[0] ?? null;

  const risks: string[] = [];

  if (discarded > 0) {
    risks.push("Some games were discarded due to invalid or incomplete inputs.");
  }

  if (results.some((result) => result.confidence === "LOW")) {
    risks.push("Low-confidence opportunities detected due to unstable ERA inputs.");
  }

  if (topOpportunities.length === 0) {
    risks.push("No opportunities cleared EV threshold.");
  }

  return {
    date,
    analyzed: gameInputs.length,
    discarded,
    primaryPick,
    topOpportunities,
    risks,
  };
}
