import { offlineDb, type CachedData } from './offline-db'

/**
 * Persist a Convex query result to IndexedDB cache
 */
export async function persistQueryResult(queryKey: string, data: unknown): Promise<void> {
    const cachedData: CachedData = {
        queryKey,
        data,
        timestamp: Date.now(),
    }

    await offlineDb.cachedData.put(cachedData)
}

/**
 * Get cached data for a query key
 * Returns undefined if not found
 */
export async function getCachedData<T>(queryKey: string): Promise<T | undefined> {
    const cached = await offlineDb.cachedData.get(queryKey)
    return cached?.data as T | undefined
}

/**
 * Clear specific cached data
 */
export async function clearCachedData(queryKey: string): Promise<void> {
    await offlineDb.cachedData.delete(queryKey)
}

/**
 * Clear all cached data (useful for logout)
 */
export async function clearAllCache(): Promise<void> {
    await offlineDb.cachedData.clear()
}

/**
 * Apply an optimistic update to cached data
 * Used when queueing offline mutations
 */
export async function applyOptimisticUpdate<T>(
    queryKey: string,
    updateFn: (currentData: T | undefined) => T
): Promise<void> {
    const current = await getCachedData<T>(queryKey)
    const updated = updateFn(current)
    await persistQueryResult(queryKey, updated)
}

/**
 * Rollback cached data to a previous state
 * Used when a mutation fails during sync
 */
export async function rollbackCache<T>(queryKey: string, originalData: T): Promise<void> {
    await persistQueryResult(queryKey, originalData)
}
