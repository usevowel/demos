/**
 * User menu component with avatar and dropdown menu
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { authStore, logout } from '@/store/authStore'
import { uiStore, setTheme } from '@/store/uiStore'
import { LogOut, Settings, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * User menu dropdown with avatar, dark mode toggle, and settings
 */
export function UserMenu() {
  const navigate = useNavigate()
  const authSnap = useSnapshot(authStore)
  const uiSnap = useSnapshot(uiStore)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  if (!authSnap.currentUser) return null

  const handleLogout = () => {
    logout()
    setIsOpen(false)
    navigate({ to: '/login' })
  }

  const handleThemeToggle = () => {
    setTheme(uiSnap.theme === 'dark' ? 'light' : 'dark')
    setIsOpen(false)
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-status-critical',
    operator: 'bg-status-warning',
    viewer: 'bg-status-info',
  }

  // Get user initials for avatar
  const initials = authSnap.currentUser.displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'border-2 border-border hover:border-cisco-blue transition-colors',
          'bg-bg-tertiary hover:bg-bg-primary',
          roleColors[authSnap.currentUser.role]
        )}
        title={`${authSnap.currentUser.displayName} (${authSnap.currentUser.role})`}
      >
        <span className="text-sm font-semibold text-white">{initials}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-bg-secondary border border-border rounded-lg shadow-xl z-50">
          {/* User info header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={cn(
                'flex items-center justify-center w-12 h-12 rounded-full',
                roleColors[authSnap.currentUser.role]
              )}>
                <span className="text-base font-semibold text-white">{initials}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">
                  {authSnap.currentUser.displayName}
                </p>
                <p className="text-xs text-text-secondary capitalize">
                  {authSnap.currentUser.role}
                </p>
                <p className="text-xs text-text-secondary truncate mt-1">
                  {authSnap.currentUser.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            {/* Dark mode toggle */}
            <button
              onClick={handleThemeToggle}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              {uiSnap.theme === 'dark' ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* User settings link */}
            <Link
              to={"/settings" as any}
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-secondary hover:bg-bg-tertiary hover:text-text-primary transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </Link>

            {/* Divider */}
            <div className="my-2 border-t border-border" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-status-critical hover:bg-status-critical/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
