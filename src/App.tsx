import { useState, useEffect } from 'react'
import { useConvexAuth, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { Dashboard } from './components/dashboard'
import { WritePage } from './components/write-page'
import { AuthPage } from './components/auth-page'
import { OfflineIndicator } from './components/offline-indicator'
import { useOfflineProfile } from './hooks/useOfflineQuery'
import { useOffline } from './contexts/OfflineContext'

type View =
  | { type: 'dashboard' }
  | { type: 'write'; documentId: Id<"documents"> }

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const { isOnline } = useOffline()
  const isOffline = !isOnline
  const [view, setView] = useState<View>({ type: 'dashboard' })

  // Use offline-aware profile query
  const { data: profile, isLoading: isProfileLoading, isCached } = useOfflineProfile()
  const createProfile = useMutation(api.users.createProfile)

  // Create profile if user is authenticated but has no profile (only when online)
  useEffect(() => {
    if (isAuthenticated && isOnline && profile === null) {
      createProfile({
        name: "Writer",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }
  }, [isAuthenticated, isOnline, profile, createProfile])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Wird geladen...</div>
      </div>
    )
  }

  // Show auth page if not authenticated (but allow offline access if cached)
  if (!isAuthenticated && !isCached) {
    return <AuthPage />
  }

  // Show loading while profile is being fetched/created
  if (isProfileLoading || (!isOffline && (profile === undefined || profile === null))) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isCached ? 'Offline-Daten werden geladen...' : 'Profil wird geladen...'}
        </div>
      </div>
    )
  }

  // If we have no profile data (neither from server nor cache), show loading
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">
          {isOffline ? 'Keine Offline-Daten verfügbar. Bitte verbinden Sie sich mit dem Internet.' : 'Profil wird erstellt...'}
        </div>
      </div>
    )
  }

  // Navigation functions
  const openDocument = (documentId: Id<"documents">) => {
    setView({ type: 'write', documentId })
  }

  const goToDashboard = () => {
    setView({ type: 'dashboard' })
  }

  // Render based on current view
  if (view.type === 'write') {
    return (
      <>
        <WritePage
          documentId={view.documentId}
          onBack={goToDashboard}
        />
        <OfflineIndicator />
      </>
    )
  }

  return (
    <>
      <Dashboard
        profile={profile}
        onOpenDocument={openDocument}
      />
      <OfflineIndicator />
    </>
  )
}

export default App
