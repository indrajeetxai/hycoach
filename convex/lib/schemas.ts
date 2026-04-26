// Zod schemas for Claude tool-use outputs.
// Used by D5 (Reality Check action) and E1 (Plan Generation action) to validate
// model responses before persisting. Mirror PRD §7 enums exactly.

import { z } from "zod";

// ---------- Reality Check ----------

export const suggestionTypeSchema = z.enum([
  "increase_days",
  "increase_minutes",
  "adjust_goal",
  "extend_timeline",
]);

// `from` / `to` are intentionally permissive: their type depends on the
// suggestion type (number for days/minutes/timeline, string for goal labels).
// The JSON schema sent to Claude uses `{}` (any) — we mirror that here.
export const suggestionSchema = z.object({
  type: suggestionTypeSchema,
  from: z.unknown(),
  to: z.unknown(),
  rationale: z.string().min(1),
});

export const realityCheckOutputSchema = z.object({
  feasible: z.boolean(),
  // JSON schema bound (prompt-composition.md): 100-800 chars
  verdict: z.string().min(100).max(800),
  suggestions: z.array(suggestionSchema),
});

export type SuggestionType = z.infer<typeof suggestionTypeSchema>;
export type Suggestion = z.infer<typeof suggestionSchema>;
export type RealityCheckOutput = z.infer<typeof realityCheckOutputSchema>;

// ---------- Plan Generation ----------

export const phaseSchema = z.enum(["base", "build", "peak", "taper", "race"]);

export const workoutTypeSchema = z.enum([
  "run",
  "strength",
  "hyrox",
  "hybrid",
  "rest",
]);

export const hyroxStationSchema = z.enum([
  "ski_erg",
  "sled_push",
  "sled_pull",
  "burpee_broad_jump",
  "rowing",
  "farmers_carry",
  "sandbag_lunge",
  "wall_ball",
  "run",
]);

export const prescribedSchema = z.object({
  sets: z.number().int().nonnegative().optional(),
  reps: z.number().int().nonnegative().optional(),
  timeSec: z.number().nonnegative().optional(),
  distanceM: z.number().nonnegative().optional(),
  weightKg: z.number().nonnegative().optional(),
  paceSecPerKm: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export const planExerciseSchema = z.object({
  name: z.string().min(1),
  // Claude may return `null` for non-Hyrox-station exercises; normalise to undefined
  // so the inferred type matches the Convex schema (which has no `null`).
  hyroxStation: z.preprocess(
    (v) => (v === null ? undefined : v),
    hyroxStationSchema.optional(),
  ),
  isSubstitute: z.boolean(),
  prescribed: prescribedSchema,
});

export const planWorkoutSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 = Monday per PRD
  type: workoutTypeSchema,
  title: z.string().min(1),
  durationMin: z.number().nonnegative(),
  whyThisWorkout: z.string().min(1),
  exercises: z.array(planExerciseSchema),
});

export const planWeekSchema = z.object({
  weekNumber: z.number().int().positive(),
  phase: phaseSchema,
  reasoning: z.string().min(1),
  coachNote: z.string().min(1),
  workouts: z.array(planWorkoutSchema),
});

export const planOutputSchema = z.object({
  weeks: z.array(planWeekSchema).min(1),
});

export type Phase = z.infer<typeof phaseSchema>;
export type WorkoutType = z.infer<typeof workoutTypeSchema>;
export type HyroxStation = z.infer<typeof hyroxStationSchema>;
export type Prescribed = z.infer<typeof prescribedSchema>;
export type PlanExercise = z.infer<typeof planExerciseSchema>;
export type PlanWorkout = z.infer<typeof planWorkoutSchema>;
export type PlanWeek = z.infer<typeof planWeekSchema>;
export type PlanOutput = z.infer<typeof planOutputSchema>;
