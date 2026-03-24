import { StrictMode, useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { VowelProvider, VowelAgent } from '@vowel.to/client/react'
import { router } from './router'
import { getVowel, subscribeToVowelChanges, setAppId } from './vowel.client'
import './index.css'

function App() {
  const [vowel, setVowel] = useState(getVowel())

  useEffect(() => {
    const appId = import.meta.env.VITE_VOWEL_APP_ID
    if (appId) setAppId(appId)
    const unsub = subscribeToVowelChanges(setVowel)
    return unsub
  }, [])

  return (
    <VowelProvider client={vowel as any}>
      <RouterProvider router={router} />
      {vowel && <VowelAgent position="bottom-right" enableFloatingCursor={false} />}
    </VowelProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
