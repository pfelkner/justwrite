import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Record daily stats
export const recordStats = mutation({
    args: {
        date: v.string(),
        wordsWritten: v.number(),
        minutesWritten: v.number(),
        xpEarned: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const existing = await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", userId).eq("date", args.date)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                wordsWritten: existing.wordsWritten + args.wordsWritten,
                sessionsCount: existing.sessionsCount + 1,
                minutesWritten: existing.minutesWritten + args.minutesWritten,
                xpEarned: existing.xpEarned + args.xpEarned,
                checkedIn: true,
            });
            return existing._id;
        } else {
            const statsId = await ctx.db.insert("dailyStats", {
                userId,
                date: args.date,
                wordsWritten: args.wordsWritten,
                sessionsCount: 1,
                minutesWritten: args.minutesWritten,
                xpEarned: args.xpEarned,
                checkedIn: true,
            });
            return statsId;
        }
    },
});

// Get stats for a date range (for heatmap)
export const getStatsRange = query({
    args: {
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const stats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        return stats.filter(
            (s) => s.date >= args.startDate && s.date <= args.endDate
        );
    },
});

// Get today's stats
export const getToday = query({
    args: {
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        return await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", userId).eq("date", args.date)
            )
            .first();
    },
});

// Get total stats for user
export const getTotals = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const allStats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        return {
            totalWords: allStats.reduce((sum, s) => sum + s.wordsWritten, 0),
            totalSessions: allStats.reduce((sum, s) => sum + s.sessionsCount, 0),
            totalMinutes: allStats.reduce((sum, s) => sum + s.minutesWritten, 0),
            totalXP: allStats.reduce((sum, s) => sum + s.xpEarned, 0),
            daysActive: allStats.length,
        };
    },
});
