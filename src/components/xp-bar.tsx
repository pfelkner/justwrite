import { Progress } from './ui/progress'

interface XPBarProps {
    xp: number
    level: number
}

export function XPBar({ xp, level }: XPBarProps) {
    // XP needed for next level: current level * 100
    const xpForNextLevel = level * 100
    const progressPercent = (xp / xpForNextLevel) * 100

    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
                <span className="text-lg">⭐</span>
                <span className="font-bold text-primary">Lvl {level}</span>
            </div>
            <div className="w-24 flex flex-col gap-0.5">
                <Progress value={progressPercent} className="h-2" />
                <span className="text-xs text-muted-foreground text-right">
                    {xp}/{xpForNextLevel} XP
                </span>
            </div>
        </div>
    )
}
