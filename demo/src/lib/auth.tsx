/**
 * Authentication utilities and route guards
 */

import { useSnapshot } from 'valtio'
import { Navigate } from '@tanstack/react-router'
import { authStore } from '@/store/authStore'

/**
 * Hook to check if user is authenticated
 */
export function useAuth() {
  const auth = useSnapshot(authStore)
  return {
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    isAdmin: auth.currentUser?.role === 'admin',
  }
}

/**
 * Component to require authentication
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" />
  }

  return <>{children}</>
}

/**
 * Component to require admin role
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to="/signin" />
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="mb-6 opacity-70">
          You need administrator privileges to access this page.
        </p>
        <p className="mb-6">
          Current user: <strong>{authStore.currentUser?.name}</strong> ({authStore.currentUser?.role})
        </p>
        <a href="/" className="btn btn-primary">
          Go Home
        </a>
      </div>
    )
  }

  return <>{children}</>
}

