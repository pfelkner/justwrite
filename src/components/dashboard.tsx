import { useAuthActions } from '@convex-dev/auth/react'
import type { Id, Doc } from '../../convex/_generated/dataModel'
import { Button } from './ui/button'
import { StreakDisplay } from './streak-display'
import { XPBar } from './xp-bar'
import { StatsCard } from './stats-card'
import { CheckInCard } from './checkin-card'
import { DocumentsCard } from './documents-card'

interface DashboardProps {
    profile: Doc<"profiles">
    onOpenDocument: (documentId: Id<"documents">) => void
}

export function Dashboard({ profile, onOpenDocument }: DashboardProps) {
    const { signOut } = useAuthActions()

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl hidden md:inline">✍️</span>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            JustWrite
                        </h1>
                    </div>
                    <div className="flex items-center gap-2 md:gap-4">
                        {profile.currentStreak >= 1 && <StreakDisplay streak={profile.currentStreak} />}
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
                    <CheckInCard />
                    <StatsCard profile={profile} />
                    <DocumentsCard onOpenDocument={onOpenDocument} />
                </div>
            </main>
        </div>
    )
}
