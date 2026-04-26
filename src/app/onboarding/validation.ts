import type { OnboardingData } from "./types";

export const TOTAL_STEPS = 9;

export function isStepComplete(
  step: number,
  data: Partial<OnboardingData>,
): boolean {
  switch (step) {
    case 0: {
      if (!data.raceDate) return false;
      const ms = new Date(data.raceDate).getTime();
      return Number.isFinite(ms) && ms > Date.now();
    }
    case 1:
      return !!data.division;
    case 2:
      if (data.goalType === "finish") return true;
      if (data.goalType === "target") return (data.targetTimeSec ?? 0) > 0;
      return false;
    case 3:
      return (
        data.weeklyCommitmentDays !== undefined &&
        data.minutesPerSession !== undefined
      );
    case 4:
      return !!data.fitnessRating;
    case 5:
      return !!data.adaptiveDepth;
    case 6:
      return true;
    case 7:
      return !!data.equipmentAccess;
    case 8:
      return !!data.coachPersona;
    default:
      return false;
  }
}

export function firstIncompleteStep(
  data: Partial<OnboardingData>,
): number | null {
  for (let s = 0; s < TOTAL_STEPS; s++) {
    if (s === 6 && data.adaptiveDepth === "skip") continue;
    if (!isStepComplete(s, data)) return s;
  }
  return null;
}
