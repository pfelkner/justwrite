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
