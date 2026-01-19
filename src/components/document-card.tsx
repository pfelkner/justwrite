import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Trash2 } from 'lucide-react'
import { formatDate } from '../lib/date'
import { motion, useMotionValue, useTransform } from 'framer-motion'

const SWIPE_THRESHOLD = 100

interface DocumentCardProps {
    title: string
    wordCount: number
    updatedAt: number
    onClick: () => void
    onDeleteRequest: () => void
    isMobile: boolean
}

export function DocumentCard({
    title,
    wordCount,
    updatedAt,
    onClick,
    onDeleteRequest,
    isMobile,
}: DocumentCardProps) {
    const x = useMotionValue(0)
    const backgroundColor = useTransform(
        x,
        [-SWIPE_THRESHOLD, 0],
        ['rgba(239, 68, 68, 0.2)', 'rgba(239, 68, 68, 0)']
    )

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        onDeleteRequest()
    }

    const handleDragEnd = () => {
        if (x.get() < -SWIPE_THRESHOLD) {
            onDeleteRequest()
        }
    }

    const handleClick = () => {
        if (Math.abs(x.get()) < 10) {
            onClick()
        }
    }

    if (isMobile) {
        return (
            <motion.div
                style={{ backgroundColor }}
                className="rounded-lg"
            >
                <motion.div
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    style={{ x }}
                    onDragEnd={handleDragEnd}
                    className="touch-pan-y"
                >
                    <Card
                        className="relative hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={handleClick}
                    >
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{wordCount} Wörter</span>
                                <span>{formatDate(updatedAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        )
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
