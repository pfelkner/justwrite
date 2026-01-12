import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConvexAuthProvider } from '@convex-dev/auth/react'
import { ConvexReactClient } from 'convex/react'
import { OfflineProvider } from './contexts/OfflineContext'
import { initSyncManager } from './lib/offline/sync-manager'
import './index.css'
import App from './App.tsx'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string)

// Initialize sync manager with Convex client for offline mutation replay
initSyncManager(convex)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexAuthProvider client={convex}>
      <OfflineProvider>
        <App />
      </OfflineProvider>
    </ConvexAuthProvider>
  </StrictMode>,
)
