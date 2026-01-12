import { offlineDb, type QueuedMutation } from './offline-db'

/**
 * Generate a UUID for mutation IDs
 */
function generateId(): string {
    return crypto.randomUUID()
}

/**
 * Add a mutation to the queue for later sync
 */
export async function queueMutation(
    type: string,
    payload: Record<string, unknown>
): Promise<string> {
    const mutation: QueuedMutation = {
        id: generateId(),
        type,
        payload,
        timestamp: Date.now(),
        status: 'pending',
    }

    await offlineDb.mutationQueue.add(mutation)
    return mutation.id
}

/**
 * Get all pending mutations, ordered by timestamp
 */
export async function getPendingMutations(): Promise<QueuedMutation[]> {
    return offlineDb.mutationQueue
        .where('status')
        .equals('pending')
        .sortBy('timestamp')
}

/**
 * Mark a mutation as currently syncing
 */
export async function markMutationSyncing(id: string): Promise<void> {
    await offlineDb.mutationQueue.update(id, { status: 'syncing' })
}

/**
 * Remove a successfully synced mutation
 */
export async function removeMutation(id: string): Promise<void> {
    await offlineDb.mutationQueue.delete(id)
}

/**
 * Mark a mutation as failed with an error message
 */
export async function markMutationFailed(id: string, error: string): Promise<void> {
    await offlineDb.mutationQueue.update(id, {
        status: 'failed',
        error,
    })
}

/**
 * Get count of pending mutations
 */
export async function getPendingCount(): Promise<number> {
    return offlineDb.mutationQueue.where('status').equals('pending').count()
}

/**
 * Clear all failed mutations (user acknowledgement)
 */
export async function clearFailedMutations(): Promise<void> {
    await offlineDb.mutationQueue.where('status').equals('failed').delete()
}

/**
 * Clear entire mutation queue (useful for logout)
 */
export async function clearMutationQueue(): Promise<void> {
    await offlineDb.mutationQueue.clear()
}
