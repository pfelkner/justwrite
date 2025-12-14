import { useCallback, useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Editor } from './editor'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'

interface WritePageProps {
    userId: Id<"users">
    documentId: Id<"documents">
    onBack: () => void
}

export function WritePage({ userId, documentId, onBack }: WritePageProps) {
    const document = useQuery(api.documents.get, { documentId })
    const updateContent = useMutation(api.documents.updateContent)
    const updateTitle = useMutation(api.documents.updateTitle)
    const recordStats = useMutation(api.stats.recordStats)
    const addXP = useMutation(api.users.addXP)

    const [title, setTitle] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [sessionWords, setSessionWords] = useState(0)
    const sessionStartRef = useRef<number>(Date.now())
    const initialWordCountRef = useRef<number | null>(null)

    // Set initial title when document loads
    useEffect(() => {
        if (document) {
            setTitle(document.title)
            if (initialWordCountRef.current === null) {
                initialWordCountRef.current = document.wordCount
            }
        }
    }, [document])

    // Debounced content update
    const handleContentUpdate = useCallback(async (content: string, wordCount: number) => {
        // Track words written in this session
        if (initialWordCountRef.current !== null) {
            const wordsWrittenThisSession = Math.max(0, wordCount - initialWordCountRef.current)
            setSessionWords(wordsWrittenThisSession)
        }

        // Save to database
        setIsSaving(true)
        try {
            await updateContent({ documentId, content, wordCount })
            setLastSaved(new Date())
        } finally {
            setIsSaving(false)
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
        if (sessionWords > 0) {
            const sessionMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000)
            const today = new Date().toISOString().split('T')[0]

            // XP: 1 XP per 10 words, max 50 XP per session
            const xpEarned = Math.min(50, Math.floor(sessionWords / 10))

            await recordStats({
                userId,
                date: today,
                wordsWritten: sessionWords,
                minutesWritten: sessionMinutes,
                xpEarned,
            })

            if (xpEarned > 0) {
                await addXP({ userId, amount: xpEarned })
            }
        }
    }, [sessionWords, userId, recordStats, addXP])

    // Handle back button with stats saving
    const handleBack = async () => {
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
                                    <span className="font-medium">{document.wordCount} Wörter</span>
                                </div>
                            </div>
                            <div className="text-muted-foreground">
                                ⭐ +{Math.min(50, Math.floor(sessionWords / 10))} XP bei Speichern
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Editor */}
                <Editor
                    content={document.content}
                    onUpdate={handleContentUpdate}
                    placeholder="Fang an zu schreiben..."
                />
            </main>
        </div>
    )
}
