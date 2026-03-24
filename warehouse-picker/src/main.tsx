import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import { vowel } from './vowel.client'
import { router } from './router'
import './index.css'
import { loadMockData } from './store/mockData'
import { useAppStateSync } from './hooks/useAppStateSync'

/**
 * Component that syncs app state to Vowel context
 * Must be inside VowelProvider to access the context
 */
function AppStateSync() {
  useAppStateSync()
  return null
}

function App() {
  const [isInitialized, setIsInitialized] = useState(false)

  // Load mock data on mount
  useEffect(() => {
    const initialize = async () => {
      // Load mock data (initializes all stores with persistence)
      await loadMockData()
      
      setIsInitialized(true)
    }
    
    initialize()
  }, [])

  if (!isInitialized) {
    // Show loading state while stores are being initialized
    return <div>Loading...</div>
  }

  return (
    <VowelProvider client={vowel as any}>
      {/* Sync app state to Vowel context automatically */}
      <AppStateSync />
      <RouterProvider router={router} />
      {/* Vowel mic button - rendered at app level, visible on all pages */}
      {/* Only render when client is initialized */}
      {vowel && <VowelAgent position="bottom-right" enableFloatingCursor={false} />}
    </VowelProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
