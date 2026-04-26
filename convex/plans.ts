import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ---------- Validators (mirror Zod planOutputSchema in convex/lib/schemas.ts) ----------

const phaseValidator = v.union(
  v.literal("base"),
  v.literal("build"),
  v.literal("peak"),
  v.literal("taper"),
  v.literal("race"),
);

const workoutTypeValidator = v.union(
  v.literal("run"),
  v.literal("strength"),
  v.literal("hyrox"),
  v.literal("hybrid"),
  v.literal("rest"),
);

const hyroxStationValidator = v.union(
  v.literal("ski_erg"),
  v.literal("sled_push"),
  v.literal("sled_pull"),
  v.literal("burpee_broad_jump"),
  v.literal("rowing"),
  v.literal("farmers_carry"),
  v.literal("sandbag_lunge"),
  v.literal("wall_ball"),
  v.literal("run"),
);

const prescribedValidator = v.object({
  sets: v.optional(v.number()),
  reps: v.optional(v.number()),
  timeSec: v.optional(v.number()),
  distanceM: v.optional(v.number()),
  weightKg: v.optional(v.number()),
  paceSecPerKm: v.optional(v.number()),
  rpe: v.optional(v.number()),
  notes: v.optional(v.string()),
});

const exerciseValidator = v.object({
  name: v.string(),
  hyroxStation: v.optional(hyroxStationValidator),
  isSubstitute: v.boolean(),
  prescribed: prescribedValidator,
});

const workoutValidator = v.object({
  dayOfWeek: v.number(),
  type: workoutTypeValidator,
  title: v.string(),
  durationMin: v.number(),
  whyThisWorkout: v.string(),
  exercises: v.array(exerciseValidator),
});

const weekValidator = v.object({
  weekNumber: v.number(),
  phase: phaseValidator,
  reasoning: v.string(),
  coachNote: v.string(),
  workouts: v.array(workoutValidator),
});

// ---------- Helpers ----------

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ---------- persistPlan ----------

export const persistPlan = mutation({
  args: {
    raceId: v.id("races"),
    startDate: v.string(),
    modelUsed: v.string(),
    plan: v.object({ weeks: v.array(weekValidator) }),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const race = await ctx.db.get(args.raceId);
    if (!race || race.userId !== userId) {
      throw new Error("Race not found or not yours.");
    }

    // Archive any existing active plans for this user
    const existingPlans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    for (const p of existingPlans) {
      if (p.status === "active") {
        await ctx.db.patch(p._id, { status: "archived" });
      }
    }

    const now = Date.now();
    const totalWeeks = args.plan.weeks.length;

    const planId = await ctx.db.insert("plans", {
      userId,
      raceId: args.raceId,
      generatedAt: now,
      totalWeeks,
      startDate: args.startDate,
      status: "active",
      version: 1,
      modelUsed: args.modelUsed,
    });

    for (const week of args.plan.weeks) {
      const weekStartDate = addDays(args.startDate, (week.weekNumber - 1) * 7);
      const weekId = await ctx.db.insert("weeks", {
        planId,
        weekNumber: week.weekNumber,
        phase: week.phase,
        startDate: weekStartDate,
        reasoning: week.reasoning,
        coachNote: week.coachNote,
        recalibrated: false,
      });

      for (const w of week.workouts) {
        const scheduledDate = addDays(weekStartDate, w.dayOfWeek);
        const workoutId = await ctx.db.insert("workouts", {
          weekId,
          dayOfWeek: w.dayOfWeek,
          scheduledDate,
          type: w.type,
          title: w.title,
          durationMin: w.durationMin,
          whyThisWorkout: w.whyThisWorkout,
          status: "scheduled",
        });

        let order = 0;
        for (const ex of w.exercises) {
          await ctx.db.insert("exercises", {
            workoutId,
            order: order++,
            name: ex.name,
            hyroxStation: ex.hyroxStation,
            isSubstitute: ex.isSubstitute,
            prescribed: ex.prescribed,
          });
        }
      }
    }

    return { planId };
  },
});

// ---------- Queries ----------

export const getActivePlan = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    return plans.find((p) => p.status === "active") ?? null;
  },
});

// Derives a week's status from its startDate vs today (UTC).
// PRD §7: status is computed at query time, never stored.
function deriveWeekStatus(
  weekStartIso: string,
  todayIso: string,
): "upcoming" | "current" | "done" {
  const start = new Date(`${weekStartIso}T00:00:00Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);
  const today = new Date(`${todayIso}T00:00:00Z`);
  if (today < start) return "upcoming";
  if (today < end) return "current";
  return "done";
}

// Returns the active plan with all weeks, workouts, and exercises nested + sorted.
// One read per row but all parallelised — for a 24-week plan this is still fast.
export const getActivePlanWithEverything = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const plans = await ctx.db
      .query("plans")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    const plan = plans.find((p) => p.status === "active");
    if (!plan) return null;

    const weeks = await ctx.db
      .query("weeks")
      .withIndex("by_plan", (q) => q.eq("planId", plan._id))
      .collect();
    weeks.sort((a, b) => a.weekNumber - b.weekNumber);

    const todayIso = new Date().toISOString().split("T")[0];

    const weeksFull = await Promise.all(
      weeks.map(async (week) => {
        const workouts = await ctx.db
          .query("workouts")
          .withIndex("by_week", (q) => q.eq("weekId", week._id))
          .collect();
        workouts.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

        const workoutsFull = await Promise.all(
          workouts.map(async (workout) => {
            const exercises = await ctx.db
              .query("exercises")
              .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
              .collect();
            exercises.sort((a, b) => a.order - b.order);
            return { ...workout, exercises };
          }),
        );
        return {
          ...week,
          status: deriveWeekStatus(week.startDate, todayIso),
          workouts: workoutsFull,
        };
      }),
    );

    return { ...plan, weeks: weeksFull };
  },
});
