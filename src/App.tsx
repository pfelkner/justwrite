import { useState, useEffect } from 'react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { Dashboard } from './components/dashboard'
import { WritePage } from './components/write-page'
import { AuthPage } from './components/auth-page'

type View =
  | { type: 'dashboard' }
  | { type: 'write'; documentId: Id<"documents"> }

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const [view, setView] = useState<View>({ type: 'dashboard' })

  const profile = useQuery(api.users.getCurrentProfile)
  const createProfile = useMutation(api.users.createProfile)

  // Create profile if user is authenticated but has no profile
  useEffect(() => {
    if (isAuthenticated && profile === null) {
      createProfile({
        name: "Writer",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
    }
  }, [isAuthenticated, profile, createProfile])

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Wird geladen...</div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  // Show loading while profile is being fetched/created
  if (profile === undefined || profile === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Profil wird geladen...</div>
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
      <WritePage
        documentId={view.documentId}
        onBack={goToDashboard}
      />
    )
  }

  return (
    <Dashboard
      profile={profile}
      onOpenDocument={openDocument}
    />
  )
}

export default App
