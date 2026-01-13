import { useCallback, useState } from 'react'
import { useMutation } from 'convex/react'
import { useOffline } from '../contexts/OfflineContext'
import { queueMutation } from '../lib/offline/mutation-queue'
import { applyOptimisticUpdate } from '../lib/offline/cache-sync'
import { api } from '../../convex/_generated/api'

interface UseOfflineMutationResult<TArgs> {
    mutate: (args: TArgs) => Promise<void>
    isPending: boolean
    wasQueued: boolean
}

/**
 * Offline-aware mutation for updating document content
 */
export function useOfflineUpdateContent(): UseOfflineMutationResult<{
    documentId: string
    content: string
    wordCount: number
}> {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.documents.updateContent)

    const mutate = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (args: { documentId: any; content: string; wordCount: number }) => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    await convexMutate(args)
                } else {
                    await queueMutation('documents.updateContent', args)
                    setWasQueued(true)

                    // Apply optimistic update to the document cache
                    await applyOptimisticUpdate(`document:${args.documentId}`, (current: unknown) => {
                        if (!current) return current
                        return { ...(current as object), content: args.content, wordCount: args.wordCount }
                    })
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

/**
 * Offline-aware mutation for updating document title
 */
export function useOfflineUpdateTitle(): UseOfflineMutationResult<{
    documentId: string
    title: string
}> {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.documents.updateTitle)

    const mutate = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (args: { documentId: any; title: string }) => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    await convexMutate(args)
                } else {
                    await queueMutation('documents.updateTitle', args)
                    setWasQueued(true)

                    await applyOptimisticUpdate(`document:${args.documentId}`, (current: unknown) => {
                        if (!current) return current
                        return { ...(current as object), title: args.title }
                    })
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

/**
 * Offline-aware mutation for recording stats
 */
export function useOfflineRecordStats(): UseOfflineMutationResult<{
    date: string
    wordsWritten: number
    minutesWritten: number
    xpEarned: number
}> {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.stats.recordStats)

    const mutate = useCallback(
        async (args: { date: string; wordsWritten: number; minutesWritten: number; xpEarned: number }) => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    await convexMutate(args)
                } else {
                    await queueMutation('stats.recordStats', args)
                    setWasQueued(true)
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

/**
 * Offline-aware mutation for adding XP
 */
export function useOfflineAddXP(): UseOfflineMutationResult<{ amount: number }> {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.users.addXP)

    const mutate = useCallback(
        async (args: { amount: number }) => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    await convexMutate(args)
                } else {
                    await queueMutation('users.addXP', args)
                    setWasQueued(true)

                    // Optimistically update profile XP
                    await applyOptimisticUpdate('profile', (current: unknown) => {
                        if (!current) return current
                        const profile = current as { xp: number }
                        return { ...profile, xp: profile.xp + args.amount }
                    })
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

/**
 * Offline-aware mutation for creating a new document
 * Returns a temporary local ID when offline, which gets replaced on sync
 */
export function useOfflineCreateDocument(): {
    mutate: (args: { title: string }) => Promise<string>
    isPending: boolean
    wasQueued: boolean
} {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.documents.create)

    const mutate = useCallback(
        async (args: { title: string }): Promise<string> => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    const docId = await convexMutate(args)
                    return docId
                } else {
                    // Generate a temporary local ID for offline documents
                    const tempId = `temp_${crypto.randomUUID()}`
                    const now = Date.now()

                    // Create a local document object
                    const localDoc = {
                        _id: tempId,
                        _creationTime: now,
                        userId: 'local', // Will be set correctly on sync
                        title: args.title,
                        content: '',
                        wordCount: 0,
                        isArchived: false,
                        createdAt: now,
                        updatedAt: now,
                    }

                    // Queue the mutation with the title
                    await queueMutation('documents.create', {
                        title: args.title,
                        _tempId: tempId, // Store temp ID for later mapping
                    })
                    setWasQueued(true)

                    // Add to documents cache optimistically
                    await applyOptimisticUpdate('documents', (current: unknown) => {
                        const docs = (current as unknown[]) || []
                        return [localDoc, ...docs]
                    })

                    // Also cache the individual document
                    await applyOptimisticUpdate(`document:${tempId}`, () => localDoc)

                    return tempId
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

/**
 * Offline-aware mutation for daily check-in
 */
export function useOfflineCheckIn(): UseOfflineMutationResult<{ date: string }> {
    const { isOnline } = useOffline()
    const [isPending, setIsPending] = useState(false)
    const [wasQueued, setWasQueued] = useState(false)

    const convexMutate = useMutation(api.users.checkIn)

    const mutate = useCallback(
        async (args: { date: string }) => {
            setIsPending(true)
            setWasQueued(false)

            try {
                if (isOnline) {
                    await convexMutate(args)
                } else {
                    await queueMutation('users.checkIn', args)
                    setWasQueued(true)

                    // Optimistically update today's stats to show checked in
                    await applyOptimisticUpdate(`stats:today:${args.date}`, (current: unknown) => {
                        if (current) {
                            return { ...(current as object), checkedIn: true }
                        }
                        // Create initial stats if none exist
                        return {
                            date: args.date,
                            wordsWritten: 0,
                            sessionsCount: 0,
                            minutesWritten: 0,
                            xpEarned: 0,
                            checkedIn: true,
                        }
                    })

                    // Optimistically update profile streak
                    await applyOptimisticUpdate('profile', (current: unknown) => {
                        if (!current) return current
                        const profile = current as {
                            currentStreak: number
                            longestStreak: number
                            lastCheckInDate?: string
                        }
                        const newStreak = profile.currentStreak + 1
                        return {
                            ...profile,
                            currentStreak: newStreak,
                            longestStreak: Math.max(newStreak, profile.longestStreak),
                            lastCheckInDate: args.date,
                        }
                    })
                }
            } finally {
                setIsPending(false)
            }
        },
        [isOnline, convexMutate]
    )

    return { mutate, isPending, wasQueued }
}

