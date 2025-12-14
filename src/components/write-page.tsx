import { useCallback, useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Editor } from './editor'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'

interface WritePageProps {
    documentId: Id<"documents">
    onBack: () => void
}

export function WritePage({ documentId, onBack }: WritePageProps) {
    const document = useQuery(api.documents.get, { documentId })
    const updateContent = useMutation(api.documents.updateContent)
    const updateTitle = useMutation(api.documents.updateTitle)
    const recordStats = useMutation(api.stats.recordStats)
    const addXP = useMutation(api.users.addXP)

    const [title, setTitle] = useState('')
    const [localContent, setLocalContent] = useState<string | null>(null) // Local content state
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [sessionWords, setSessionWords] = useState(0)
    const sessionStartRef = useRef<number>(Date.now())
    const initialWordCountRef = useRef<number | null>(null)
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const pendingContentRef = useRef<{ content: string; wordCount: number } | null>(null)

    // Set initial title and content when document loads
    useEffect(() => {
        if (document) {
            setTitle(document.title)
            // Only set local content on first load
            if (localContent === null) {
                setLocalContent(document.content)
            }
            if (initialWordCountRef.current === null) {
                initialWordCountRef.current = document.wordCount
            }
        }
    }, [document, localContent])

    // Debounced save function
    const debouncedSave = useCallback(async (content: string, wordCount: number) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }

        // Store pending content
        pendingContentRef.current = { content, wordCount }

        // Schedule save after 500ms of no typing
        saveTimeoutRef.current = setTimeout(async () => {
            if (pendingContentRef.current) {
                setIsSaving(true)
                try {
                    await updateContent({
                        documentId,
                        content: pendingContentRef.current.content,
                        wordCount: pendingContentRef.current.wordCount,
                    })
                    setLastSaved(new Date())
                } finally {
                    setIsSaving(false)
                    pendingContentRef.current = null
                }
            }
        }, 500)
    }, [documentId, updateContent])

    // Handle content updates from editor - update local state immediately, debounce save
    const handleContentUpdate = useCallback((content: string, wordCount: number) => {
        // Update local content immediately (no waiting)
        setLocalContent(content)

        // Track words written in this session
        if (initialWordCountRef.current !== null) {
            const wordsWrittenThisSession = Math.max(0, wordCount - initialWordCountRef.current)
            setSessionWords(wordsWrittenThisSession)
        }

        // Debounced save to database
        debouncedSave(content, wordCount)
    }, [debouncedSave])

    // Cleanup timeout on unmount and save any pending content
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
            }
            // Save pending content immediately on unmount
            if (pendingContentRef.current) {
                updateContent({
                    documentId,
                    content: pendingContentRef.current.content,
                    wordCount: pendingContentRef.current.wordCount,
                })
            }
        }
    }, [documentId, updateContent])

    // Debounced title update
    const handleTitleChange = useCallback(async (newTitle: string) => {
        setTitle(newTitle)
        if (newTitle.trim() && newTitle !== document?.title) {
            await updateTitle({ documentId, title: newTitle })
        }
    }, [documentId, document?.title, updateTitle])

    // Save session stats when leaving
    const saveSessionStats = useCallback(async () => {
        // Save any pending content first
        if (pendingContentRef.current) {
            await updateContent({
                documentId,
                content: pendingContentRef.current.content,
                wordCount: pendingContentRef.current.wordCount,
            })
            pendingContentRef.current = null
        }

        if (sessionWords > 0) {
            const sessionMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000)
            const today = new Date().toISOString().split('T')[0]

            // XP: 1 XP per 10 words, max 50 XP per session
            const xpEarned = Math.min(50, Math.floor(sessionWords / 10))

            await recordStats({
                date: today,
                wordsWritten: sessionWords,
                minutesWritten: sessionMinutes,
                xpEarned,
            })

            if (xpEarned > 0) {
                await addXP({ amount: xpEarned })
            }
        }
    }, [sessionWords, recordStats, addXP, documentId, updateContent])

    // Handle back button with stats saving
    const handleBack = async () => {
        // Clear pending timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
        }
        await saveSessionStats()
        onBack()
    }

    if (!document) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground">Dokument wird geladen...</div>
            </div>
        )
    }

    // Use local content if available, otherwise use document content
    const editorContent = localContent ?? document.content

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={handleBack}>
                            ← Zurück
                        </Button>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 w-64"
                            placeholder="Dokumenttitel..."
                        />
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {isSaving ? (
                            <span className="animate-pulse">Speichert...</span>
                        ) : lastSaved ? (
                            <span>Gespeichert um {lastSaved.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                        ) : null}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Session Stats */}
                <Card className="mb-6 border-border/50">
                    <CardContent className="py-3">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-muted-foreground">Diese Session: </span>
                                    <span className="font-medium text-primary">+{sessionWords} Wörter</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Gesamt: </span>
                                    <span className="font-medium">{document.wordCount + sessionWords} Wörter</span>
                                </div>
                            </div>
                            <div className="text-muted-foreground">
                                ⭐ +{Math.min(50, Math.floor(sessionWords / 10))} XP bei Speichern
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Editor - uses local content to avoid sync loop */}
                <Editor
                    content={editorContent}
                    onUpdate={handleContentUpdate}
                    placeholder="Fang an zu schreiben..."
                />
            </main>
        </div>
    )
}
