// Commitment math per PRD §2 Moment A.
// Pure function — no I/O, no Convex context. Reality Check (D5) and
// Plan Generation (E1) call this before any Claude request.

export type GoalTier = "just_finish" | "sub_1:30" | "sub_1:15" | "sub_1:00";

export type CommitmentMathInput = {
  weeksUntilRace: number;
  daysPerWeek: number;
  minPerSession: number;
  goalType: "finish" | "target";
  targetTimeSec?: number;
};

export type CommitmentMathResult = {
  available_minutes: number;
  required_minutes_min: number;
  required_minutes_max: number;
  goal_tier: GoalTier;
  deficit: number;
};

const TIER_REQUIREMENTS: Record<GoalTier, { min: number; max: number }> = {
  just_finish: { min: 1500, max: 2000 },
  "sub_1:30": { min: 3000, max: 4000 },
  "sub_1:15": { min: 4500, max: 6000 },
  // PRD says "6500+"; 9000 is a sane upper bound for required_minutes_max.
  "sub_1:00": { min: 6500, max: 9000 },
};

const FEASIBILITY_FACTOR = 0.85;

function classifyGoalTier(
  goalType: "finish" | "target",
  targetTimeSec?: number,
): GoalTier {
  if (goalType === "finish" || targetTimeSec === undefined) return "just_finish";
  if (targetTimeSec <= 3600) return "sub_1:00";
  if (targetTimeSec <= 4500) return "sub_1:15";
  if (targetTimeSec <= 5400) return "sub_1:30";
  // Target slower than 1:30 — same effort tier as "just finish".
  return "just_finish";
}

export function computeCommitmentMath(
  input: CommitmentMathInput,
): CommitmentMathResult {
  const weeks = Math.max(0, input.weeksUntilRace);
  const available = weeks * input.daysPerWeek * input.minPerSession;
  const tier = classifyGoalTier(input.goalType, input.targetTimeSec);
  const { min, max } = TIER_REQUIREMENTS[tier];
  const threshold = min * FEASIBILITY_FACTOR;
  const deficit = Math.max(0, Math.round(threshold - available));
  return {
    available_minutes: Math.round(available),
    required_minutes_min: min,
    required_minutes_max: max,
    goal_tier: tier,
    deficit,
  };
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export function weeksUntilRace(raceDateIso: string, now: Date = new Date()): number {
  const ms = new Date(raceDateIso).getTime() - now.getTime();
  return Math.max(0, ms / MS_PER_WEEK);
}
