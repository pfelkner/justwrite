import { Badge } from './ui/badge'

interface StreakDisplayProps {
    streak: number
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
    // Determine flame intensity based on streak
    const getFlameEmoji = () => {
        if (streak >= 30) return '🔥🔥🔥'
        if (streak >= 7) return '🔥🔥'
        if (streak >= 1) return '🔥'
        return '💨'
    }

    return (
        <Badge
            variant={streak > 0 ? "default" : "secondary"}
            className={`
        text-base px-3 py-1.5 font-bold
        ${streak >= 30 ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : ''}
        ${streak >= 7 && streak < 30 ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' : ''}
      `}
        >
            {getFlameEmoji()} {streak}
        </Badge>
    )
}
