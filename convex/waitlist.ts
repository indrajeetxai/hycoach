import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { z } from "zod";

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parsed = z.string().email().safeParse(args.email);
    if (!parsed.success) {
      throw new Error("Invalid email address");
    }

    const email = args.email.toLowerCase().trim();

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existing !== null) {
      return { joined: false, alreadyOnList: true };
    }

    await ctx.db.insert("waitlist", {
      email,
      source: args.source,
      createdAt: Date.now(),
    });

    return { joined: true, alreadyOnList: false };
  },
});
