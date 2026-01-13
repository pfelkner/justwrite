import type { Doc } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { useOfflineTotals } from '../hooks/useOfflineQuery'
import { useOffline } from '../contexts/OfflineContext'

interface StatsCardProps {
    profile: Doc<"profiles">
}

export function StatsCard({ profile }: StatsCardProps) {
    const { data: totals, isLoading, isOffline } = useOfflineTotals()
    const { } = useOffline()

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>📊</span>
                    Deine Stats
                    {isOffline && (
                        <span className="text-xs text-yellow-500 font-normal">(Offline)</span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Längste Streak</span>
                    <Badge variant="secondary">{profile.longestStreak} Tage 🔥</Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gesamt Wörter</span>
                    <span className="font-mono">
                        {isLoading ? '...' : totals?.totalWords?.toLocaleString() ?? 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-mono">
                        {isLoading ? '...' : totals?.totalSessions ?? 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Aktive Tage</span>
                    <span className="font-mono">
                        {isLoading ? '...' : totals?.daysActive ?? 0}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Streak Freezes</span>
                    <Badge variant="outline">❄️ {profile.streakFreezes}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}
