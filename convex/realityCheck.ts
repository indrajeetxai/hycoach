import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Parses goal labels the model returns in `adjust_goal.to`.
// Accepts: "just finish", "finish", "sub-1:30", "sub 1:30", "1:30", "1:30:00".
// Returns: { goalType: "finish" } | { goalType: "target", targetTimeSec: number } | null
function parseGoalLabel(
  raw: string,
):
  | { goalType: "finish" }
  | { goalType: "target"; targetTimeSec: number }
  | null {
  const s = raw.trim().toLowerCase();
  if (/finish/.test(s)) return { goalType: "finish" };

  // Strip "sub-" / "sub" / "under" prefix
  const cleaned = s.replace(/^(sub-?|under)\s*/, "").trim();

  // h:mm:ss
  const hms = cleaned.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
  if (hms) {
    return {
      goalType: "target",
      targetTimeSec:
        Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]),
    };
  }
  // h:mm — Hyrox finish times are <2 h, so treat as h:mm:00
  const hm = cleaned.match(/^(\d+):(\d{1,2})$/);
  if (hm) {
    return {
      goalType: "target",
      targetTimeSec: Number(hm[1]) * 3600 + Number(hm[2]) * 60,
    };
  }
  return null;
}

function nextSaturdayAfterWeeks(weeks: number): string {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  const daysUntilSat = (6 - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().split("T")[0];
}

export const applyAdjustment = mutation({
  args: {
    type: v.union(
      v.literal("increase_days"),
      v.literal("increase_minutes"),
      v.literal("adjust_goal"),
      v.literal("extend_timeline"),
    ),
    to: v.union(v.string(), v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated.");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found.");

    const races = await ctx.db
      .query("races")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    const race = races.find((r) => r.status === "upcoming");
    if (!race) throw new Error("No upcoming race found.");

    const now = Date.now();

    switch (args.type) {
      case "increase_days": {
        const days = Number(args.to);
        if (!Number.isFinite(days) || days < 1 || days > 7) {
          throw new Error(`Invalid days/week value: ${args.to}`);
        }
        await ctx.db.patch(profile._id, {
          weeklyCommitmentDays: Math.round(days),
          updatedAt: now,
        });
        break;
      }
      case "increase_minutes": {
        const min = Number(args.to);
        if (!Number.isFinite(min) || min < 15 || min > 240) {
          throw new Error(`Invalid minutes/session value: ${args.to}`);
        }
        await ctx.db.patch(profile._id, {
          minutesPerSession: Math.round(min),
          updatedAt: now,
        });
        break;
      }
      case "adjust_goal": {
        const parsed = parseGoalLabel(String(args.to));
        if (!parsed) throw new Error(`Could not parse goal: ${args.to}`);
        if (parsed.goalType === "finish") {
          await ctx.db.patch(race._id, {
            goalType: "finish",
            targetTimeSec: undefined,
          });
        } else {
          await ctx.db.patch(race._id, {
            goalType: "target",
            targetTimeSec: parsed.targetTimeSec,
          });
        }
        break;
      }
      case "extend_timeline": {
        const weeks = Number(args.to);
        if (!Number.isFinite(weeks) || weeks < 1 || weeks > 60) {
          throw new Error(`Invalid weeks value: ${args.to}`);
        }
        await ctx.db.patch(race._id, {
          raceDate: nextSaturdayAfterWeeks(weeks),
        });
        break;
      }
    }

    return { ok: true };
  },
});
