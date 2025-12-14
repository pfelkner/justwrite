import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user's profile (or create one if doesn't exist)
export const getCurrentProfile = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        return profile;
    },
});

// Create profile for newly registered user
export const createProfile = mutation({
    args: {
        name: v.string(),
        timezone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        // Check if profile already exists
        const existing = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (existing) return existing._id;

        // Create new profile
        const now = Date.now();
        const profileId = await ctx.db.insert("profiles", {
            userId,
            name: args.name,
            xp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            streakFreezes: 1,
            timezone: args.timezone ?? "Europe/Berlin",
            badges: [],
            createdAt: now,
            updatedAt: now,
        });

        return profileId;
    },
});

// Add XP and handle level ups
export const addXP = mutation({
    args: {
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("Profile not found");

        const newXP = profile.xp + args.amount;

        let newLevel = profile.level;
        let remainingXP = newXP;

        // Check for level ups (XP per level = level * 100)
        while (remainingXP >= newLevel * 100) {
            remainingXP -= newLevel * 100;
            newLevel++;
        }

        await ctx.db.patch(profile._id, {
            xp: remainingXP,
            level: newLevel,
            updatedAt: Date.now(),
        });

        return { newLevel, newXP: remainingXP, leveledUp: newLevel > profile.level };
    },
});

// Daily check-in
export const checkIn = mutation({
    args: {
        date: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const profile = await ctx.db
            .query("profiles")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .first();

        if (!profile) throw new Error("Profile not found");

        // Check if already checked in today
        const existingStats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", userId).eq("date", args.date)
            )
            .first();

        if (existingStats?.checkedIn) {
            return { streak: profile.currentStreak, isNewCheckIn: false };
        }

        const lastDate = profile.lastCheckInDate;
        let newStreak = profile.currentStreak;

        if (!lastDate) {
            newStreak = 1;
        } else {
            const lastDateObj = new Date(lastDate);
            const currentDateObj = new Date(args.date);
            const diffTime = currentDateObj.getTime() - lastDateObj.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                newStreak = profile.currentStreak;
            } else if (diffDays === 1) {
                newStreak = profile.currentStreak + 1;
            } else {
                newStreak = 1;
            }
        }

        const newLongest = Math.max(newStreak, profile.longestStreak);

        await ctx.db.patch(profile._id, {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastCheckInDate: args.date,
            updatedAt: Date.now(),
        });

        // Create or update dailyStats
        if (existingStats) {
            await ctx.db.patch(existingStats._id, { checkedIn: true });
        } else {
            await ctx.db.insert("dailyStats", {
                userId,
                date: args.date,
                wordsWritten: 0,
                sessionsCount: 0,
                minutesWritten: 0,
                xpEarned: 0,
                checkedIn: true,
            });
        }

        return { streak: newStreak, isNewCheckIn: true };
    },
});
