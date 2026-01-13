import type { Id } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { formatDate } from '../lib/date'
import { useOfflineDocuments } from '../hooks/useOfflineQuery'
import { useOfflineCreateDocument } from '../hooks/useOfflineMutation'
import { useOffline } from '../contexts/OfflineContext'

interface DocumentsCardProps {
    onOpenDocument: (documentId: Id<"documents">) => void
}

export function DocumentsCard({ onOpenDocument }: DocumentsCardProps) {
    const { data: documents, isLoading, isOffline } = useOfflineDocuments()
    const { mutate: createDocument, isPending: isCreating } = useOfflineCreateDocument()
    const { isOnline } = useOffline()

    const handleNewDocument = async () => {
        const docId = await createDocument({ title: "Neues Dokument" })
        // For offline-created documents, we use a temp ID that starts with "temp_"
        // The WritePage will handle this appropriately
        onOpenDocument(docId as Id<"documents">)
    }

    return (
        <Card className="md:col-span-3 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <span>📝</span>
                    Deine Dokumente
                    {isOffline && (
                        <span className="text-xs text-yellow-500 font-normal">(Offline)</span>
                    )}
                </CardTitle>
                <Button
                    onClick={handleNewDocument}
                    size="sm"
                    disabled={isCreating}
                >
                    {isCreating ? 'Erstelle...' : '+ Neues Dokument'}
                </Button>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground animate-pulse">
                        Dokumente werden geladen...
                    </div>
                ) : documents && documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => {
                            const isTemp = typeof doc._id === 'string' && doc._id.startsWith('temp_')
                            return (
                                <Card
                                    key={doc._id}
                                    className={`hover:border-primary/50 transition-colors cursor-pointer ${isTemp ? 'border-yellow-500/50 bg-yellow-500/5' : ''
                                        }`}
                                    onClick={() => onOpenDocument(doc._id as Id<"documents">)}
                                >
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {doc.title}
                                            {isTemp && (
                                                <span className="text-xs text-yellow-500" title="Wird synchronisiert...">
                                                    ⏳
                                                </span>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <span>{doc.wordCount} Wörter</span>
                                            <span>{formatDate(doc.updatedAt)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Noch keine Dokumente vorhanden.</p>
                        <p className="text-sm">
                            {isOnline
                                ? 'Erstelle dein erstes Dokument und starte mit dem Schreiben!'
                                : 'Du kannst auch offline neue Dokumente erstellen!'}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
