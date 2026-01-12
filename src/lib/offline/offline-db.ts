import Dexie, { type EntityTable } from 'dexie'

/**
 * Cached query result from Convex
 */
export interface CachedData {
    queryKey: string
    data: unknown
    timestamp: number
}

/**
 * Pending mutation to be synced when online
 */
export interface QueuedMutation {
    id: string
    type: string
    payload: Record<string, unknown>
    timestamp: number
    status: 'pending' | 'syncing' | 'failed'
    error?: string
}

/**
 * JustWrite offline database using Dexie (IndexedDB wrapper)
 * 
 * Tables:
 * - cachedData: Stores last known Convex query results for offline reading
 * - mutationQueue: Stores pending mutations to replay when back online
 */
class OfflineDatabase extends Dexie {
    cachedData!: EntityTable<CachedData, 'queryKey'>
    mutationQueue!: EntityTable<QueuedMutation, 'id'>

    constructor() {
        super('justwrite-offline')

        this.version(1).stores({
            // queryKey is primary key for cachedData
            cachedData: 'queryKey',
            // id is primary key, index by status and timestamp for ordered replay
            mutationQueue: 'id, status, timestamp',
        })
    }
}

// Singleton database instance
export const offlineDb = new OfflineDatabase()

// Export types for use elsewhere
export type { OfflineDatabase }
