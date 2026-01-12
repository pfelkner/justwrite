import { useEffect, useRef } from 'react'
import { useQuery } from 'convex/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useOffline } from '../contexts/OfflineContext'
import { persistQueryResult, getCachedData } from '../lib/offline/cache-sync'
import { offlineDb } from '../lib/offline/offline-db'
import { api } from '../../convex/_generated/api'

interface UseOfflineQueryResult<T> {
    data: T | undefined
    isLoading: boolean
    isOffline: boolean
    isCached: boolean
}

/**
 * Offline-aware hook for fetching current user profile
 */
export function useOfflineProfile(): UseOfflineQueryResult<typeof api.users.getCurrentProfile._returnType> {
    const { isOnline } = useOffline()
    const hasHydratedRef = useRef(false)
    const queryKey = 'profile'

    // Online mode: Use Convex query
    const convexData = useQuery(api.users.getCurrentProfile, isOnline ? {} : 'skip')

    // Offline mode: Use Dexie live query for cached data
    const cachedData = useLiveQuery(
        async () => {
            if (isOnline && convexData !== undefined) {
                return undefined
            }
            const cached = await offlineDb.cachedData.get(queryKey)
            return cached?.data
        },
        [isOnline, queryKey, convexData],
        undefined
    )

    // Persist Convex data to IndexedDB when online
    useEffect(() => {
        if (isOnline && convexData !== undefined) {
            persistQueryResult(queryKey, convexData)
            hasHydratedRef.current = true
        }
    }, [isOnline, convexData])

    // Hydrate from cache on initial load if offline
    useEffect(() => {
        if (!isOnline && !hasHydratedRef.current) {
            getCachedData(queryKey).then(() => {
                hasHydratedRef.current = true
            })
        }
    }, [isOnline])

    const data = isOnline ? convexData : cachedData
    const isLoading = isOnline
        ? convexData === undefined
        : cachedData === undefined && !hasHydratedRef.current
    const isCached = !isOnline && cachedData !== undefined

    return {
        data: data as typeof api.users.getCurrentProfile._returnType | undefined,
        isLoading,
        isOffline: !isOnline,
        isCached,
    }
}

/**
 * Offline-aware hook for fetching user documents
 */
export function useOfflineDocuments(): UseOfflineQueryResult<typeof api.documents.listByUser._returnType> {
    const { isOnline } = useOffline()
    const hasHydratedRef = useRef(false)
    const queryKey = 'documents'

    const convexData = useQuery(api.documents.listByUser, isOnline ? {} : 'skip')

    const cachedData = useLiveQuery(
        async () => {
            if (isOnline && convexData !== undefined) {
                return undefined
            }
            const cached = await offlineDb.cachedData.get(queryKey)
            return cached?.data
        },
        [isOnline, queryKey, convexData],
        undefined
    )

    useEffect(() => {
        if (isOnline && convexData !== undefined) {
            persistQueryResult(queryKey, convexData)
            hasHydratedRef.current = true
        }
    }, [isOnline, convexData])

    useEffect(() => {
        if (!isOnline && !hasHydratedRef.current) {
            getCachedData(queryKey).then(() => {
                hasHydratedRef.current = true
            })
        }
    }, [isOnline])

    const data = isOnline ? convexData : cachedData

    return {
        data: data as typeof api.documents.listByUser._returnType | undefined,
        isLoading: isOnline ? convexData === undefined : cachedData === undefined && !hasHydratedRef.current,
        isOffline: !isOnline,
        isCached: !isOnline && cachedData !== undefined,
    }
}

/**
 * Offline-aware hook for fetching a single document
 */
export function useOfflineDocument(
    documentId: string | undefined
): UseOfflineQueryResult<typeof api.documents.get._returnType> {
    const { isOnline } = useOffline()
    const hasHydratedRef = useRef(false)
    const queryKey = `document:${documentId}`

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const convexData = useQuery(api.documents.get, isOnline && documentId ? { documentId: documentId as any } : 'skip')

    const cachedData = useLiveQuery(
        async () => {
            if (!documentId || (isOnline && convexData !== undefined)) {
                return undefined
            }
            const cached = await offlineDb.cachedData.get(queryKey)
            return cached?.data
        },
        [isOnline, queryKey, convexData, documentId],
        undefined
    )

    useEffect(() => {
        if (isOnline && convexData !== undefined && documentId) {
            persistQueryResult(queryKey, convexData)
            hasHydratedRef.current = true
        }
    }, [isOnline, convexData, queryKey, documentId])

    useEffect(() => {
        if (!isOnline && !hasHydratedRef.current && documentId) {
            getCachedData(queryKey).then(() => {
                hasHydratedRef.current = true
            })
        }
    }, [isOnline, queryKey, documentId])

    const data = isOnline ? convexData : cachedData

    return {
        data: data as typeof api.documents.get._returnType | undefined,
        isLoading: isOnline ? convexData === undefined : cachedData === undefined && !hasHydratedRef.current,
        isOffline: !isOnline,
        isCached: !isOnline && cachedData !== undefined,
    }
}
