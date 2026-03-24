/**
 * User settings page
 */

import { createFileRoute } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { authStore } from '@/store/authStore'
import { uiStore, setTheme } from '@/store/uiStore'
import { Settings, Moon, Sun, User, Mail } from 'lucide-react'
import { cn } from '@/lib/utils'

function SettingsPage() {
  const authSnap = useSnapshot(authStore)
  const uiSnap = useSnapshot(uiStore)

  if (!authSnap.currentUser) {
    return null
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-status-critical',
    operator: 'bg-status-warning',
    viewer: 'bg-status-info',
  }

  const initials = authSnap.currentUser.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Settings className="h-8 w-8" />
          Settings
        </h1>
        <p className="text-text-secondary mt-1">
          Manage your account preferences and settings
        </p>
      </div>

      {/* User Profile Section */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Profile</h2>
        <div className="flex items-center gap-4">
          <div className={cn(
            'flex items-center justify-center w-20 h-20 rounded-full',
            roleColors[authSnap.currentUser.role]
          )}>
            <span className="text-2xl font-semibold text-white">{initials}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-text-secondary" />
              <span className="text-lg font-semibold text-text-primary">
                {authSnap.currentUser.displayName}
              </span>
              <span className={cn(
                'px-2 py-1 rounded text-xs font-semibold capitalize',
                roleColors[authSnap.currentUser.role],
                'text-white'
              )}>
                {authSnap.currentUser.role}
              </span>
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <Mail className="h-4 w-4" />
              <span className="text-sm">{authSnap.currentUser.email}</span>
            </div>
            <div className="mt-2 text-sm text-text-secondary">
              Username: <span className="text-text-primary">{authSnap.currentUser.username}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Appearance</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-primary font-medium">Theme</p>
              <p className="text-sm text-text-secondary">
                Choose between light and dark mode
              </p>
            </div>
            <button
              onClick={() => setTheme(uiSnap.theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                uiSnap.theme === 'dark'
                  ? 'bg-bg-tertiary border-border text-text-primary'
                  : 'bg-bg-tertiary border-border text-text-primary'
              )}
            >
              {uiSnap.theme === 'dark' ? (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Account</h2>
        <div className="space-y-3">
          <p className="text-sm text-text-secondary">
            This is a mock authentication system. In a production environment, you would be able to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary ml-4">
            <li>Change your password</li>
            <li>Update your email address</li>
            <li>Manage two-factor authentication</li>
            <li>View account activity</li>
            <li>Download your data</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/settings' as any)({
  component: SettingsPage,
})
