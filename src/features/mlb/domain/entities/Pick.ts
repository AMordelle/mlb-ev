import type { PickRecord, PickRecommendation } from "../../application/dto/types";

export type Pick = PickRecord;
export type PickDecision = Exclude<PickRecommendation, "NO_BET">;
