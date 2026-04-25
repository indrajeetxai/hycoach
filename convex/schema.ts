import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  profiles: defineTable({
    userId: v.id("users"),
    onboardingStep: v.optional(v.number()),
    dob: v.optional(v.string()),
    fitnessRating: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
      ),
    ),
    detailedAssessment: v.optional(
      v.object({
        run5kPaceSec: v.optional(v.number()),
        pushUpsMax: v.optional(v.number()),
        deadliftKg: v.optional(v.number()),
        pullUpsMax: v.optional(v.number()),
        pastHyroxTimeSec: v.optional(v.number()),
        weeklyRunKm: v.optional(v.number()),
        weeklyStrengthDays: v.optional(v.number()),
        yearsTraining: v.optional(v.number()),
      }),
    ),
    equipmentAccess: v.optional(
      v.object({
        sled: v.boolean(),
        wallBall: v.boolean(),
        skiErg: v.boolean(),
        rower: v.boolean(),
      }),
    ),
    weeklyCommitmentDays: v.optional(v.number()),
    minutesPerSession: v.optional(v.number()),
    coachPersona: v.optional(
      v.union(
        v.literal("honest"),
        v.literal("encourager"),
        v.literal("operator"),
      ),
    ),
    themePref: v.union(
      v.literal("light"),
      v.literal("dark"),
      v.literal("system"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  races: defineTable({
    userId: v.id("users"),
    raceDate: v.string(),
    division: v.literal("singles"),
    goalType: v.union(v.literal("finish"), v.literal("target")),
    targetTimeSec: v.optional(v.number()),
    registrationStatus: v.optional(
      v.union(v.literal("registered"), v.literal("considering")),
    ),
    status: v.union(
      v.literal("upcoming"),
      v.literal("completed"),
      v.literal("abandoned"),
    ),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),

  plans: defineTable({
    userId: v.id("users"),
    raceId: v.id("races"),
    generatedAt: v.number(),
    lastRegenAt: v.optional(v.number()),
    pausedAt: v.optional(v.number()),
    totalWeeks: v.number(),
    startDate: v.string(),
    status: v.union(v.literal("active"), v.literal("archived")),
    version: v.number(),
    modelUsed: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_race", ["raceId"]),

  weeks: defineTable({
    planId: v.id("plans"),
    weekNumber: v.number(),
    phase: v.union(
      v.literal("base"),
      v.literal("build"),
      v.literal("peak"),
      v.literal("taper"),
      v.literal("race"),
    ),
    startDate: v.string(),
    reasoning: v.string(),
    coachNote: v.string(),
    recalibrated: v.boolean(),
    recalibratedAt: v.optional(v.number()),
  }).index("by_plan", ["planId"]),

  workouts: defineTable({
    weekId: v.id("weeks"),
    dayOfWeek: v.number(),
    scheduledDate: v.string(),
    type: v.union(
      v.literal("run"),
      v.literal("strength"),
      v.literal("hyrox"),
      v.literal("hybrid"),
      v.literal("rest"),
    ),
    title: v.string(),
    durationMin: v.number(),
    whyThisWorkout: v.string(),
    status: v.union(
      v.literal("scheduled"),
      v.literal("done"),
      v.literal("skipped"),
    ),
  }).index("by_week", ["weekId"]),

  exercises: defineTable({
    workoutId: v.id("workouts"),
    order: v.number(),
    name: v.string(),
    hyroxStation: v.optional(
      v.union(
        v.literal("ski_erg"),
        v.literal("sled_push"),
        v.literal("sled_pull"),
        v.literal("burpee_broad_jump"),
        v.literal("rowing"),
        v.literal("farmers_carry"),
        v.literal("sandbag_lunge"),
        v.literal("wall_ball"),
        v.literal("run"),
      ),
    ),
    isSubstitute: v.boolean(),
    prescribed: v.object({
      sets: v.optional(v.number()),
      reps: v.optional(v.number()),
      timeSec: v.optional(v.number()),
      distanceM: v.optional(v.number()),
      weightKg: v.optional(v.number()),
      paceSecPerKm: v.optional(v.number()),
      rpe: v.optional(v.number()),
      notes: v.optional(v.string()),
    }),
  }).index("by_workout", ["workoutId"]),

  workoutLogs: defineTable({
    workoutId: v.id("workouts"),
    userId: v.id("users"),
    completedAt: v.number(),
    quickDone: v.boolean(),
    rpe: v.optional(v.number()),
    notes: v.optional(v.string()),
    exerciseLogs: v.array(
      v.object({
        exerciseId: v.id("exercises"),
        actualSets: v.optional(v.number()),
        actualReps: v.optional(v.number()),
        actualTimeSec: v.optional(v.number()),
        actualDistanceM: v.optional(v.number()),
        actualWeightKg: v.optional(v.number()),
        actualPaceSecPerKm: v.optional(v.number()),
      }),
    ),
  })
    .index("by_workout", ["workoutId"])
    .index("by_user", ["userId"]),

  adjustments: defineTable({
    planId: v.id("plans"),
    weekId: v.id("weeks"),
    runAt: v.number(),
    trigger: v.union(
      v.literal("weekly_auto"),
      v.literal("user_regen"),
      v.literal("missed_week"),
    ),
    reason: v.string(),
    changes: v.array(
      v.object({
        workoutId: v.id("workouts"),
        field: v.string(),
        before: v.any(),
        after: v.any(),
      }),
    ),
  }).index("by_plan", ["planId"]),

  raceResults: defineTable({
    raceId: v.id("races"),
    finishTimeSec: v.number(),
    splits: v.optional(
      v.array(v.object({ stationName: v.string(), timeSec: v.number() })),
    ),
    reflection: v.string(),
    loggedAt: v.number(),
  }).index("by_race", ["raceId"]),

  waitlist: defineTable({
    email: v.string(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});

export default schema;
