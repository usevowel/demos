/**
 * Root route with main layout
 */

import { createRootRoute, Outlet, redirect } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { Sidebar } from '@/components/Sidebar'
import { FirmwareUpdateToast } from '@/components/FirmwareUpdateToast'
import { useEffect } from 'react'
import { useVowel } from '@vowel.to/client/react'
import { useAppStateSync } from '@/hooks/useAppStateSync'
import { startDeviceUpdates, stopDeviceUpdates } from '@/store/deviceStore'
import { isAuthenticated } from '@/store/authStore'
import { useSnapshot } from 'valtio'
import { uiStore } from '@/store/uiStore'

function AppStateSync() {
  useAppStateSync()
  return null
}

function RootComponent() {
  const { client } = useVowel() || {}
  const uiSnap = useSnapshot(uiStore)

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', uiSnap.theme)
    if (uiSnap.theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
  }, [uiSnap.theme])

  // Start device metric updates on mount
  useEffect(() => {
    startDeviceUpdates()
    return () => stopDeviceUpdates()
  }, [])

  return (
    <div className="flex flex-col h-screen bg-bg-primary text-text-primary">
      {client && <AppStateSync />}
      <Header />
      <FirmwareUpdateToast />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: ({ location }) => {
    // Allow access to login page without authentication
    if (location.pathname === '/login') {
      return
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated()) {
      throw redirect({
        to: '/login',
      })
    }
  },
})
