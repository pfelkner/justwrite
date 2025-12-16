import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { formatDate } from '../lib/date'

interface DocumentsCardProps {
    onOpenDocument: (documentId: Id<"documents">) => void
}

export function DocumentsCard({ onOpenDocument }: DocumentsCardProps) {
    const documents = useQuery(api.documents.listByUser)
    const createDocument = useMutation(api.documents.create)

    const handleNewDocument = async () => {
        const docId = await createDocument({ title: "Neues Dokument" })
        onOpenDocument(docId)
    }

    return (
        <Card className="md:col-span-3 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <span>📝</span>
                    Deine Dokumente
                </CardTitle>
                <Button onClick={handleNewDocument} size="sm">
                    + Neues Dokument
                </Button>
            </CardHeader>
            <CardContent>
                {documents && documents.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                            <Card
                                key={doc._id}
                                className="hover:border-primary/50 transition-colors cursor-pointer"
                                onClick={() => onOpenDocument(doc._id)}
                            >
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{doc.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{doc.wordCount} Wörter</span>
                                        <span>{formatDate(doc.updatedAt)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Noch keine Dokumente vorhanden.</p>
                        <p className="text-sm">Erstelle dein erstes Dokument und starte mit dem Schreiben!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
