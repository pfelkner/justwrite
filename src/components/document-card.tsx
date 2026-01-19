import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { formatDate } from '../lib/date'

interface DocumentCardProps {
    title: string
    wordCount: number
    updatedAt: number
    onClick: () => void
    onDeleteRequest: () => void
}

export function DocumentCard({
    title,
    wordCount,
    updatedAt,
    onClick,
    onDeleteRequest,
}: DocumentCardProps) {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onDeleteRequest()
    }

    return (
        <Card
            className="group relative hover:border-primary/50 transition-colors cursor-pointer"
            onClick={onClick}
        >
            <Button
                variant="ghost"
                size="icon-sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDeleteClick}
            >
                <Trash2 className="size-4" />
            </Button>
            <CardHeader className="pb-2">
                <CardTitle className="text-base pr-8">{title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{wordCount} Wörter</span>
                    <span>{formatDate(updatedAt)}</span>
                </div>
            </CardContent>
        </Card>
    )
}
