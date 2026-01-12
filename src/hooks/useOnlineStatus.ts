import { useState, useEffect, useCallback } from 'react'

/**
 * Hook to detect online/offline status
 * Uses navigator.onLine and window events for real-time updates
 */
export function useOnlineStatus(): boolean {
    const [isOnline, setIsOnline] = useState(() => {
        // SSR safety check
        if (typeof navigator === 'undefined') return true
        return navigator.onLine
    })

    const handleOnline = useCallback(() => setIsOnline(true), [])
    const handleOffline = useCallback(() => setIsOnline(false), [])

    useEffect(() => {
        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [handleOnline, handleOffline])

    return isOnline
}
