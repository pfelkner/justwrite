import { useEffect, useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { Dashboard } from './components/dashboard'
import { WritePage } from './components/write-page'

type View =
  | { type: 'dashboard' }
  | { type: 'write'; documentId: Id<"documents"> }

function App() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null)
  const [view, setView] = useState<View>({ type: 'dashboard' })
  const createUser = useMutation(api.users.getOrCreate)
  const user = useQuery(api.users.get, userId ? { userId } : "skip")

  // Initialize user on first load
  useEffect(() => {
    const storedUserId = localStorage.getItem('justwrite_user_id')
    if (storedUserId) {
      setUserId(storedUserId as Id<"users">)
    } else {
      // Create a new user
      createUser({
        name: "Writer",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }).then((id) => {
        localStorage.setItem('justwrite_user_id', id)
        setUserId(id)
      })
    }
  }, [createUser])

  if (!userId || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Wird geladen...</div>
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
        userId={userId}
        documentId={view.documentId}
        onBack={goToDashboard}
      />
    )
  }

  return (
    <Dashboard
      userId={userId}
      user={user}
      onOpenDocument={openDocument}
    />
  )
}

export default App
