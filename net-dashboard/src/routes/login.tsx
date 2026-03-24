/**
 * Login page with mock user selection
 */

import { createFileRoute, useNavigate, redirect } from '@tanstack/react-router'
import { login, type UserRole, mockUsers, isAuthenticated } from '@/store/authStore'
import { useState } from 'react'
import { useSnapshot } from 'valtio'
import { authStore } from '@/store/authStore'
import { Shield, User, Eye } from 'lucide-react'

function LoginPage() {
  const navigate = useNavigate()
  const snap = useSnapshot(authStore)
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)

  const handleLogin = async (role: UserRole) => {
    setSelectedRole(role)
    await login(role)
    navigate({ to: '/' })
  }

  const roleConfig: Record<UserRole, { icon: React.ComponentType<{ className?: string }>, description: string, color: string }> = {
    admin: {
      icon: Shield,
      description: 'Full access to all features and settings',
      color: 'bg-status-critical',
    },
    operator: {
      icon: User,
      description: 'Can manage devices and events, limited settings access',
      color: 'bg-status-warning',
    },
    viewer: {
      icon: Eye,
      description: 'Read-only access to view network status',
      color: 'bg-status-info',
    },
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-6">
      <div className="bg-bg-secondary border border-border rounded-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            <span className="font-ocr-a text-4xl">vowel</span>
            <span className="text-text-secondary"> | </span>
            <span>net</span>
          </h1>
          <p className="text-text-secondary mt-2">Mock Login - Select a user role</p>
        </div>

        <div className="space-y-3">
          {(Object.keys(mockUsers) as UserRole[]).map((role) => {
            const user = mockUsers[role]
            const config = roleConfig[role]
            const Icon = config.icon
            const isSelected = selectedRole === role
            const isLoggingIn = snap.isAuthenticating && isSelected

            return (
              <button
                key={role}
                onClick={() => handleLogin(role)}
                disabled={snap.isAuthenticating}
                className={`
                  w-full p-4 rounded-lg border-2 transition-all
                  ${isSelected && isLoggingIn 
                    ? 'border-cisco-blue bg-bg-tertiary' 
                    : 'border-border bg-bg-tertiary hover:border-cisco-blue'
                  }
                  ${snap.isAuthenticating && !isSelected ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`${config.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text-primary capitalize">{role}</h3>
                      {isLoggingIn && (
                        <span className="text-xs text-cisco-blue">Logging in...</span>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary mt-1">{user.displayName}</p>
                    <p className="text-xs text-text-secondary mt-1">{config.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {snap.currentUser && (
          <div className="mt-6 p-4 bg-bg-tertiary rounded-lg border border-border">
            <p className="text-sm text-text-secondary">
              Currently logged in as: <span className="text-text-primary font-semibold">{snap.currentUser.displayName}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: () => {
    // Redirect to home if already authenticated
    if (isAuthenticated()) {
      throw redirect({
        to: '/',
      })
    }
  },
})
