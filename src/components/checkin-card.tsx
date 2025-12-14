import { useMutation, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Separator } from './ui/separator'

export function CheckInCard() {
    const checkIn = useMutation(api.users.checkIn)
    const todayStats = useQuery(api.stats.getToday, {
        date: new Date().toISOString().split('T')[0],
    })

    const handleCheckIn = async () => {
        const today = new Date().toISOString().split('T')[0]
        await checkIn({ date: today })
    }

    return (
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>🎯</span>
                    Täglicher Check-in
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {todayStats?.checkedIn ? (
                    <div className="flex items-center gap-3 text-green-500">
                        <span className="text-2xl">✅</span>
                        <span className="font-medium">Heute bereits eingecheckt!</span>
                    </div>
                ) : (
                    <Button
                        onClick={handleCheckIn}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                        size="lg"
                    >
                        Jetzt einchecken & Streak erhalten! 🔥
                    </Button>
                )}

                <Separator />

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold">{todayStats?.wordsWritten ?? 0}</div>
                        <div className="text-sm text-muted-foreground">Wörter heute</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{todayStats?.sessionsCount ?? 0}</div>
                        <div className="text-sm text-muted-foreground">Sessions</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold">{todayStats?.xpEarned ?? 0}</div>
                        <div className="text-sm text-muted-foreground">XP verdient</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
