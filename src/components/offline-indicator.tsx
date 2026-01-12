import { useOffline } from '../contexts/OfflineContext'

/**
 * Offline status indicator component
 * Shows connection status and pending sync information
 */
export function OfflineIndicator() {
    const { isOnline, hasPendingMutations, pendingMutationCount, syncStatus, lastSyncError } = useOffline()

    // Don't show anything when online and no pending work
    if (isOnline && !hasPendingMutations && syncStatus === 'idle') {
        return null
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background/95 backdrop-blur px-3 py-2 shadow-lg">
                {/* Status indicator dot */}
                <span
                    className={`h-2 w-2 rounded-full ${!isOnline
                            ? 'bg-yellow-500 animate-pulse'
                            : syncStatus === 'syncing'
                                ? 'bg-blue-500 animate-pulse'
                                : syncStatus === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-green-500'
                        }`}
                />

                {/* Status text */}
                <span className="text-sm text-muted-foreground">
                    {!isOnline ? (
                        <>
                            Offline
                            {hasPendingMutations && (
                                <span className="ml-1 text-xs">
                                    ({pendingMutationCount} ausstehend)
                                </span>
                            )}
                        </>
                    ) : syncStatus === 'syncing' ? (
                        'Synchronisiere...'
                    ) : syncStatus === 'error' ? (
                        <span className="text-red-500" title={lastSyncError || undefined}>
                            Sync fehlgeschlagen
                        </span>
                    ) : hasPendingMutations ? (
                        `${pendingMutationCount} wird synchronisiert...`
                    ) : (
                        'Verbunden'
                    )}
                </span>

                {/* Offline icon */}
                {!isOnline && (
                    <svg
                        className="h-4 w-4 text-yellow-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3"
                        />
                    </svg>
                )}
            </div>
        </div>
    )
}
