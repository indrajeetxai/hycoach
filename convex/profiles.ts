import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const setOnboardingStep = mutation({
  args: { step: v.number() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        onboardingStep: args.step,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profiles", {
        userId,
        onboardingStep: args.step,
        themePref: "system",
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

export const ONBOARDING_COMPLETE_STEP = 9;

export const completeOnboarding = mutation({
  args: {
    raceDate: v.string(),
    registrationStatus: v.optional(
      v.union(v.literal("registered"), v.literal("considering")),
    ),
    goalType: v.union(v.literal("finish"), v.literal("target")),
    targetTimeSec: v.optional(v.number()),
    weeklyCommitmentDays: v.number(),
    minutesPerSession: v.number(),
    fitnessRating: v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
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
    equipmentAccess: v.object({
      sled: v.boolean(),
      wallBall: v.boolean(),
      skiErg: v.boolean(),
      rower: v.boolean(),
    }),
    coachPersona: v.union(
      v.literal("honest"),
      v.literal("encourager"),
      v.literal("operator"),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.goalType === "target" && !args.targetTimeSec) {
      throw new Error("Target time is required when goal type is 'target'.");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) {
      throw new Error("Profile not found — start onboarding from step 1.");
    }

    const now = Date.now();

    await ctx.db.patch(profile._id, {
      fitnessRating: args.fitnessRating,
      detailedAssessment: args.detailedAssessment,
      equipmentAccess: args.equipmentAccess,
      weeklyCommitmentDays: args.weeklyCommitmentDays,
      minutesPerSession: args.minutesPerSession,
      coachPersona: args.coachPersona,
      onboardingStep: ONBOARDING_COMPLETE_STEP,
      updatedAt: now,
    });

    const raceId = await ctx.db.insert("races", {
      userId,
      raceDate: args.raceDate,
      division: "singles",
      goalType: args.goalType,
      targetTimeSec: args.targetTimeSec,
      registrationStatus: args.registrationStatus ?? "registered",
      status: "upcoming",
      createdAt: now,
    });

    return { raceId };
  },
});
