import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get the current user or create one if it doesn't exist
export const getOrCreate = mutation({
    args: {
        name: v.string(),
        email: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),
        timezone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Try to find existing user by email
        if (args.email) {
            const existingUser = await ctx.db
                .query("users")
                .withIndex("by_email", (q) => q.eq("email", args.email))
                .first();

            if (existingUser) {
                return existingUser._id;
            }
        }

        // Create new user
        const now = Date.now();
        const userId = await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            avatarUrl: args.avatarUrl,
            xp: 0,
            level: 1,
            currentStreak: 0,
            longestStreak: 0,
            streakFreezes: 1, // Start with one free freeze
            timezone: args.timezone ?? "Europe/Berlin",
            badges: [],
            createdAt: now,
            updatedAt: now,
        });

        return userId;
    },
});

// Get user by ID
export const get = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.userId);
    },
});

// Add XP and handle level ups
export const addXP = mutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        const newXP = user.xp + args.amount;

        // XP needed for next level: level * 100
        // e.g., Level 1 needs 100 XP, Level 2 needs 200 XP, etc.
        const xpNeededForNextLevel = user.level * 100;

        let newLevel = user.level;
        let remainingXP = newXP;

        // Check for level ups
        while (remainingXP >= newLevel * 100) {
            remainingXP -= newLevel * 100;
            newLevel++;
        }

        await ctx.db.patch(args.userId, {
            xp: remainingXP,
            level: newLevel,
            updatedAt: Date.now(),
        });

        return { newLevel, newXP: remainingXP, leveledUp: newLevel > user.level };
    },
});

// Update streak (call this on daily check-in)
export const checkIn = mutation({
    args: {
        userId: v.id("users"),
        date: v.string(), // ISO date string (YYYY-MM-DD)
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Check if already checked in today
        const existingStats = await ctx.db
            .query("dailyStats")
            .withIndex("by_user_date", (q) =>
                q.eq("userId", args.userId).eq("date", args.date)
            )
            .first();

        if (existingStats?.checkedIn) {
            return { streak: user.currentStreak, isNewCheckIn: false };
        }

        const lastDate = user.lastCheckInDate;
        let newStreak = user.currentStreak;

        if (!lastDate) {
            // First check-in ever
            newStreak = 1;
        } else {
            // Calculate days difference
            const lastDateObj = new Date(lastDate);
            const currentDateObj = new Date(args.date);
            const diffTime = currentDateObj.getTime() - lastDateObj.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Same day, streak continues
                newStreak = user.currentStreak;
            } else if (diffDays === 1) {
                // Consecutive day
                newStreak = user.currentStreak + 1;
            } else {
                // Streak broken
                newStreak = 1;
            }
        }

        const newLongest = Math.max(newStreak, user.longestStreak);

        // Update user streak
        await ctx.db.patch(args.userId, {
            currentStreak: newStreak,
            longestStreak: newLongest,
            lastCheckInDate: args.date,
            updatedAt: Date.now(),
        });

        // Create or update dailyStats with checkedIn = true
        if (existingStats) {
            await ctx.db.patch(existingStats._id, {
                checkedIn: true,
            });
        } else {
            await ctx.db.insert("dailyStats", {
                userId: args.userId,
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

