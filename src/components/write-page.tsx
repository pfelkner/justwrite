import { useCallback, useEffect, useState, useRef } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Editor } from './editor'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { useDebounce } from '../hooks/useDebounce'

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

    // Local state for immediate UI updates
    const [title, setTitle] = useState('')
    const [localContent, setLocalContent] = useState<string | null>(null)
    const [localWordCount, setLocalWordCount] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [sessionWords, setSessionWords] = useState(0)

    // Refs for session tracking (don't trigger re-renders)
    const sessionStartRef = useRef<number>(Date.now())
    const initialWordCountRef = useRef<number | null>(null)

    // Debounce content for auto-save (waits 500ms after last change)
    const debouncedContent = useDebounce(localContent, 500)
    const debouncedWordCount = useDebounce(localWordCount, 500)

    // Initialize state when document loads
    useEffect(() => {
        if (document) {
            setTitle(document.title)
            if (localContent === null) {
                setLocalContent(document.content)
                setLocalWordCount(document.wordCount)
            }
            if (initialWordCountRef.current === null) {
                initialWordCountRef.current = document.wordCount
            }
        }
    }, [document, localContent])

    // Auto-save when debounced content changes
    useEffect(() => {
        // Skip if no local content yet or same as server
        if (debouncedContent === null || debouncedContent === document?.content) {
            return
        }

        const saveContent = async () => {
            setIsSaving(true)
            try {
                await updateContent({
                    documentId,
                    content: debouncedContent,
                    wordCount: debouncedWordCount,
                })
                setLastSaved(new Date())
            } finally {
                setIsSaving(false)
            }
        }

        saveContent()
    }, [debouncedContent, debouncedWordCount, documentId, updateContent, document?.content])

    // Handle content updates from editor
    const handleContentUpdate = useCallback((content: string, wordCount: number) => {
        setLocalContent(content)
        setLocalWordCount(wordCount)

        // Track session words
        if (initialWordCountRef.current !== null) {
            setSessionWords(Math.max(0, wordCount - initialWordCountRef.current))
        }
    }, [])

    // Handle title change
    const handleTitleChange = useCallback(async (newTitle: string) => {
        setTitle(newTitle)
        if (newTitle.trim() && newTitle !== document?.title) {
            await updateTitle({ documentId, title: newTitle })
        }
    }, [documentId, document?.title, updateTitle])

    // Save session stats when leaving
    const saveSessionStats = useCallback(async () => {
        // Save any unsaved content first
        if (localContent && localContent !== document?.content) {
            await updateContent({
                documentId,
                content: localContent,
                wordCount: localWordCount,
            })
        }

        if (sessionWords > 0) {
            const sessionMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000)
            const today = new Date().toISOString().split('T')[0]
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
    }, [sessionWords, localContent, localWordCount, document?.content, documentId, updateContent, recordStats, addXP])

    // Handle back button
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

                {/* Editor */}
                <Editor
                    content={editorContent}
                    onUpdate={handleContentUpdate}
                    placeholder="Fang an zu schreiben..."
                />
            </main>
        </div>
    )
}
