import { useMutation, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import type { Id, Doc } from '../../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { StreakDisplay } from './streak-display'
import { XPBar } from './xp-bar'

interface DashboardProps {
    profile: Doc<"profiles">
    onOpenDocument: (documentId: Id<"documents">) => void
}

export function Dashboard({ profile, onOpenDocument }: DashboardProps) {
    const { signOut } = useAuthActions()
    const checkIn = useMutation(api.users.checkIn)
    const todayStats = useQuery(api.stats.getToday, {
        date: new Date().toISOString().split('T')[0],
    })
    const totals = useQuery(api.stats.getTotals)
    const documents = useQuery(api.documents.listByUser)
    const createDocument = useMutation(api.documents.create)

    const handleCheckIn = async () => {
        const today = new Date().toISOString().split('T')[0]
        await checkIn({ date: today })
    }

    const handleNewDocument = async () => {
        const docId = await createDocument({ title: "Neues Dokument" })
        onOpenDocument(docId)
    }

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">✍️</span>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            JustWrite
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <StreakDisplay streak={profile.currentStreak} />
                        <XPBar xp={profile.xp} level={profile.level} />
                        <Button variant="ghost" size="sm" onClick={handleSignOut}>
                            Abmelden
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Daily Check-in Card */}
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

                    {/* Stats Summary Card */}
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <span>📊</span>
                                Deine Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Längster Streak</span>
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

                    {/* Documents Card */}
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
                                                    <span>{new Date(doc.updatedAt).toLocaleDateString('de-DE')}</span>
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
                </div>
            </main>
        </div>
    )
}
