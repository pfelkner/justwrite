import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new document
export const create = mutation({
    args: {
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const now = Date.now();
        const docId = await ctx.db.insert("documents", {
            userId,
            title: args.title,
            content: "",
            wordCount: 0,
            isArchived: false,
            createdAt: now,
            updatedAt: now,
        });
        return docId;
    },
});

// Get all documents for current user
export const listByUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        return await ctx.db
            .query("documents")
            .withIndex("by_user_updated", (q) => q.eq("userId", userId))
            .order("desc")
            .filter((q) => q.eq(q.field("isArchived"), false))
            .collect();
    },
});

// Get a single document
export const get = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const doc = await ctx.db.get(args.documentId);
        // Only return if user owns the document
        if (doc?.userId !== userId) return null;
        return doc;
    },
});

// Update document content
export const updateContent = mutation({
    args: {
        documentId: v.id("documents"),
        content: v.string(),
        wordCount: v.number(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const doc = await ctx.db.get(args.documentId);
        if (doc?.userId !== userId) throw new Error("Not authorized");

        await ctx.db.patch(args.documentId, {
            content: args.content,
            wordCount: args.wordCount,
            updatedAt: Date.now(),
        });
    },
});

// Update document title
export const updateTitle = mutation({
    args: {
        documentId: v.id("documents"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const doc = await ctx.db.get(args.documentId);
        if (doc?.userId !== userId) throw new Error("Not authorized");

        await ctx.db.patch(args.documentId, {
            title: args.title,
            updatedAt: Date.now(),
        });
    },
});

// Archive a document (soft delete)
export const archive = mutation({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const doc = await ctx.db.get(args.documentId);
        if (doc?.userId !== userId) throw new Error("Not authorized");

        await ctx.db.patch(args.documentId, {
            isArchived: true,
            updatedAt: Date.now(),
        });
    },
});
