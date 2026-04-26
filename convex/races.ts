import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

// Returns the user's most recent upcoming race, or null.
// In v0.5 a user has at most one upcoming race; v1.1 adds the multi-race flow.
export const getCurrentRace = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const races = await ctx.db
      .query("races")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
    return races.find((r) => r.status === "upcoming") ?? null;
  },
});
