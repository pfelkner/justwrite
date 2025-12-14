import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new document
export const create = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const docId = await ctx.db.insert("documents", {
            userId: args.userId,
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

// Get all documents for a user
export const listByUser = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("documents")
            .withIndex("by_user_updated", (q) => q.eq("userId", args.userId))
            .order("desc")
            .filter((q) => q.eq(q.field("isArchived"), false))
            .collect();
    },
});

// Get a single document
export const get = query({
    args: { documentId: v.id("documents") },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.documentId);
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
        await ctx.db.patch(args.documentId, {
            isArchived: true,
            updatedAt: Date.now(),
        });
    },
});
