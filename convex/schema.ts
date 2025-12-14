import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    // User profile with gamification data
    users: defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        avatarUrl: v.optional(v.string()),

        // Gamification
        xp: v.number(),
        level: v.number(),

        // Streak data
        currentStreak: v.number(),
        longestStreak: v.number(),
        lastCheckInDate: v.optional(v.string()), // ISO date string (YYYY-MM-DD)
        streakFreezes: v.number(), // Available freezes
        timezone: v.optional(v.string()),

        // Badges earned (array of badge IDs)
        badges: v.array(v.string()),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_email", ["email"]),

    // Writing documents/projects
    documents: defineTable({
        userId: v.id("users"),
        title: v.string(),
        content: v.string(), // Rich text as HTML or JSON
        wordCount: v.number(),

        // Project settings
        goalType: v.optional(v.union(
            v.literal("words_per_day"),
            v.literal("words_total"),
            v.literal("days_per_week")
        )),
        goalValue: v.optional(v.number()),
        deadline: v.optional(v.number()), // Unix timestamp

        // Status
        isArchived: v.boolean(),

        // Timestamps
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_user", ["userId"])
        .index("by_user_updated", ["userId", "updatedAt"]),

    // Daily writing stats for heatmap and progress
    dailyStats: defineTable({
        userId: v.id("users"),
        date: v.string(), // ISO date string (YYYY-MM-DD)
        wordsWritten: v.number(),
        sessionsCount: v.number(),
        minutesWritten: v.number(),
        xpEarned: v.number(),
        checkedIn: v.boolean(),
    })
        .index("by_user_date", ["userId", "date"])
        .index("by_user", ["userId"]),

    // Writing sessions for tracking individual writing periods
    sessions: defineTable({
        userId: v.id("users"),
        documentId: v.optional(v.id("documents")),

        // Session data
        startTime: v.number(),
        endTime: v.optional(v.number()),
        wordsWritten: v.number(),
        mode: v.optional(v.union(
            v.literal("freewrite"),
            v.literal("pomodoro"),
            v.literal("dangerous")
        )),

        // Status
        isActive: v.boolean(),
    })
        .index("by_user", ["userId"])
        .index("by_user_active", ["userId", "isActive"]),
});
