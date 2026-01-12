import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { offlineDb } from '../lib/offline/offline-db'
import { syncPendingMutations } from '../lib/offline/sync-manager'

export type SyncStatus = 'idle' | 'syncing' | 'error'

interface OfflineContextValue {
    /** Whether the browser is currently online */
    isOnline: boolean
    /** Whether there are pending mutations to sync */
    hasPendingMutations: boolean
    /** Number of pending mutations in the queue */
    pendingMutationCount: number
    /** Current sync status */
    syncStatus: SyncStatus
    /** Last sync error message, if any */
    lastSyncError: string | null
    /** Manually trigger a sync attempt */
    triggerSync: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextValue | null>(null)

interface OfflineProviderProps {
    children: ReactNode
}

export function OfflineProvider({ children }: OfflineProviderProps) {
    const isOnline = useOnlineStatus()
    const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
    const [lastSyncError, setLastSyncError] = useState<string | null>(null)

    // Live query for pending mutation count
    const pendingMutations = useLiveQuery(
        () => offlineDb.mutationQueue.where('status').equals('pending').count(),
        [],
        0
    )

    const pendingMutationCount = pendingMutations ?? 0
    const hasPendingMutations = pendingMutationCount > 0

    // Sync function
    const triggerSync = useCallback(async () => {
        if (!isOnline || syncStatus === 'syncing') return

        setSyncStatus('syncing')
        setLastSyncError(null)

        try {
            await syncPendingMutations()
            setSyncStatus('idle')
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Sync failed'
            setLastSyncError(message)
            setSyncStatus('error')
        }
    }, [isOnline, syncStatus])

    // Auto-sync when coming back online
    useEffect(() => {
        if (isOnline && hasPendingMutations && syncStatus === 'idle') {
            triggerSync()
        }
    }, [isOnline, hasPendingMutations, syncStatus, triggerSync])

    const value: OfflineContextValue = {
        isOnline,
        hasPendingMutations,
        pendingMutationCount,
        syncStatus,
        lastSyncError,
        triggerSync,
    }

    return (
        <OfflineContext.Provider value={value}>
            {children}
        </OfflineContext.Provider>
    )
}

/**
 * Hook to access offline context
 * Must be used within an OfflineProvider
 */
export function useOffline(): OfflineContextValue {
    const context = useContext(OfflineContext)
    if (!context) {
        throw new Error('useOffline must be used within an OfflineProvider')
    }
    return context
}
