import { ConvexReactClient } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import {
    getPendingMutations,
    markMutationSyncing,
    removeMutation,
    markMutationFailed
} from './mutation-queue'
import { clearCachedData } from './cache-sync'

// Reference to Convex client, set during app initialization
let convexClient: ConvexReactClient | null = null

/**
 * Initialize the sync manager with the Convex client
 * Must be called once during app startup
 */
export function initSyncManager(client: ConvexReactClient): void {
    convexClient = client
}

/**
 * Map mutation type strings to actual Convex mutation functions
 */
function getMutationFunction(type: string) {
    const mutations: Record<string, unknown> = {
        'documents.create': api.documents.create,
        'documents.updateContent': api.documents.updateContent,
        'documents.updateTitle': api.documents.updateTitle,
        'documents.archive': api.documents.archive,
        'users.checkIn': api.users.checkIn,
        'users.addXP': api.users.addXP,
        'stats.recordStats': api.stats.recordStats,
    }

    return mutations[type]
}

/**
 * Get the cache keys affected by a mutation for rollback purposes
 */
function getAffectedCacheKeys(type: string): string[] {
    const keyMap: Record<string, string[]> = {
        'documents.create': ['documents'],
        'documents.updateContent': ['documents'],
        'documents.updateTitle': ['documents'],
        'documents.archive': ['documents'],
        'users.checkIn': ['profile'],
        'users.addXP': ['profile'],
        'stats.recordStats': ['stats'],
    }

    return keyMap[type] || []
}

/**
 * Sync all pending mutations to Convex
 * Processes sequentially in timestamp order
 * Stops on first failure and rolls back
 */
export async function syncPendingMutations(): Promise<void> {
    if (!convexClient) {
        throw new Error('Sync manager not initialized. Call initSyncManager first.')
    }

    const pending = await getPendingMutations()

    for (const mutation of pending) {
        const mutationFn = getMutationFunction(mutation.type)

        if (!mutationFn) {
            await markMutationFailed(mutation.id, `Unknown mutation type: ${mutation.type}`)
            continue
        }

        try {
            // Mark as syncing
            await markMutationSyncing(mutation.id)

            // Prepare payload - remove internal fields like _tempId
            const payload = { ...mutation.payload }
            const tempId = payload._tempId as string | undefined
            delete payload._tempId

            // Execute the mutation
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (convexClient as any).mutation(mutationFn, payload)

            // Success - remove from queue
            await removeMutation(mutation.id)

            // Special handling for document creation - clear temp document cache
            if (mutation.type === 'documents.create' && tempId) {
                await clearCachedData(`document:${tempId}`)
                // Clear documents list to force fresh fetch
                await clearCachedData('documents')
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'

            // Mark as failed
            await markMutationFailed(mutation.id, errorMessage)

            // Clear affected cache keys to force fresh data from Convex
            const affectedKeys = getAffectedCacheKeys(mutation.type)
            for (const key of affectedKeys) {
                await clearCachedData(key)
            }

            // Special handling for document creation failures - remove temp document
            if (mutation.type === 'documents.create') {
                const tempId = mutation.payload._tempId as string | undefined
                if (tempId) {
                    await clearCachedData(`document:${tempId}`)
                }
            }

            // Stop processing - don't continue with subsequent mutations
            throw new Error(`Sync failed for ${mutation.type}: ${errorMessage}`)
        }
    }
}

/**
 * Check if there are any pending mutations
 */
export async function hasPendingSync(): Promise<boolean> {
    const pending = await getPendingMutations()
    return pending.length > 0
}
