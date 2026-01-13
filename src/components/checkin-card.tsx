import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Separator } from './ui/separator'
import { getTodayISO } from '../lib/date'
import { useOfflineTodayStats } from '../hooks/useOfflineQuery'
import { useOfflineCheckIn } from '../hooks/useOfflineMutation'
import { useOffline } from '../contexts/OfflineContext'

export function CheckInCard() {
    const today = getTodayISO()
    const { data: todayStats, isLoading, isOffline } = useOfflineTodayStats(today)
    const { mutate: checkIn, isPending: isCheckingIn } = useOfflineCheckIn()
    const { isOnline } = useOffline()

    const handleCheckIn = async () => {
        await checkIn({ date: today })
    }

    return (
        <Card className="md:col-span-2 bg-gradient-to-br from-card to-card/80 border-border/50">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <span>🎯</span>
                    Täglicher Check-in
                    {isOffline && (
                        <span className="text-xs text-yellow-500 font-normal">(Offline)</span>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="animate-pulse text-muted-foreground">Laden...</div>
                ) : todayStats?.checkedIn ? (
                    <div className="flex items-center gap-3 text-green-500">
                        <span className="text-2xl">✅</span>
                        <span className="font-medium">Heute bereits eingecheckt!</span>
                    </div>
                ) : (
                    <Button
                        onClick={handleCheckIn}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all"
                        size="lg"
                        disabled={isCheckingIn}
                    >
                        {isCheckingIn
                            ? 'Wird eingecheckt...'
                            : isOnline
                                ? 'Jetzt einchecken & Streak erhalten! 🔥'
                                : 'Offline einchecken 🔥'
                        }
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
