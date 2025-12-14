import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Record daily stats or update existing
export const recordStats = mutation({
    args: {
        userId: v.id("users"),
        date: v.string(), // ISO date string (YYYY-MM-DD)
        wordsWritten: v.number(),
        minutesWritten: v.number(),
        xpEarned: v.number(),
    },
    handler: async (ctx, args) => {
        // Check if stats for this day already exist
        const existing = await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", args.userId).eq("date", args.date)
            )
            .first();

        if (existing) {
            // Update existing stats
            await ctx.db.patch(existing._id, {
                wordsWritten: existing.wordsWritten + args.wordsWritten,
                sessionsCount: existing.sessionsCount + 1,
                minutesWritten: existing.minutesWritten + args.minutesWritten,
                xpEarned: existing.xpEarned + args.xpEarned,
                checkedIn: true,
            });
            return existing._id;
        } else {
            // Create new stats for this day
            const statsId = await ctx.db.insert("dailyStats", {
                userId: args.userId,
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
        userId: v.id("users"),
        startDate: v.string(),
        endDate: v.string(),
    },
    handler: async (ctx, args) => {
        const stats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();

        // Filter by date range
        return stats.filter(
            (s) => s.date >= args.startDate && s.date <= args.endDate
        );
    },
});

// Get today's stats
export const getToday = query({
    args: {
        userId: v.id("users"),
        date: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", args.userId).eq("date", args.date)
            )
            .first();
    },
});

// Get total stats for user
export const getTotals = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const allStats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
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
