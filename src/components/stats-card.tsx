import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import type { Doc } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'

interface StatsCardProps {
    profile: Doc<"profiles">
}

export function StatsCard({ profile }: StatsCardProps) {
    const totals = useQuery(api.stats.getTotals)

    return (
        <Card className="border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>📊</span>
                    Deine Stats
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Längste Streak</span>
                    <Badge variant="secondary">{profile.longestStreak} Tage 🔥</Badge>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Gesamt Wörter</span>
                    <span className="font-mono">{totals?.totalWords?.toLocaleString() ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sessions</span>
                    <span className="font-mono">{totals?.totalSessions ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Aktive Tage</span>
                    <span className="font-mono">{totals?.daysActive ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Streak Freezes</span>
                    <Badge variant="outline">❄️ {profile.streakFreezes}</Badge>
                </div>
            </CardContent>
        </Card>
    )
}
