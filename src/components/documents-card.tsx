import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { DocumentCard } from './document-card'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import { useIsMobile } from '../hooks/useIsMobile'
import { AnimatePresence, motion } from 'framer-motion'

interface DocumentsCardProps {
    onOpenDocument: (documentId: Id<"documents">) => void
}

export function DocumentsCard({ onOpenDocument }: DocumentsCardProps) {
    const documents = useQuery(api.documents.listByUser)
    const createDocument = useMutation(api.documents.create)
    const removeDocument = useMutation(api.documents.remove)
    const isMobile = useIsMobile()

    const [deleteTarget, setDeleteTarget] = useState<Id<"documents"> | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleNewDocument = async () => {
        const docId = await createDocument({ title: "Neues Dokument" })
        onOpenDocument(docId)
    }

    const handleDeleteRequest = (documentId: Id<"documents">) => {
        setDeleteTarget(documentId)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return

        setIsDeleting(true)
        try {
            await removeDocument({ documentId: deleteTarget })
        } finally {
            setIsDeleting(false)
            setDeleteTarget(null)
        }
    }

    return (
        <>
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
                            <AnimatePresence mode="popLayout">
                                {documents.map((doc) => (
                                    <motion.div
                                        key={doc._id}
                                        layout
                                        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                                    >
                                        <DocumentCard
                                            title={doc.title}
                                            wordCount={doc.wordCount}
                                            updatedAt={doc.updatedAt}
                                            onClick={() => onOpenDocument(doc._id)}
                                            onDeleteRequest={() => handleDeleteRequest(doc._id)}
                                            isMobile={isMobile}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>Noch keine Dokumente vorhanden.</p>
                            <p className="text-sm">Erstelle dein erstes Dokument und starte mit dem Schreiben!</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <DeleteConfirmDialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={handleDeleteConfirm}
                isDeleting={isDeleting}
            />
        </>
    )
}
