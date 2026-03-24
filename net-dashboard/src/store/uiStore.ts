/**
 * UI store - manages general UI state
 */

import { proxy } from 'valtio'

export interface UIStore {
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
}

// Load theme from localStorage or default to 'light'
const getInitialTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('dashboard-theme')
    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  }
  return 'light'
}

const initialState: UIStore = {
  sidebarCollapsed: false,
  theme: getInitialTheme(),
}

export const uiStore = proxy<UIStore>(initialState)

// Actions
export function toggleSidebar() {
  uiStore.sidebarCollapsed = !uiStore.sidebarCollapsed
}

export function setSidebarCollapsed(collapsed: boolean) {
  uiStore.sidebarCollapsed = collapsed
}

export function setTheme(theme: 'dark' | 'light') {
  uiStore.theme = theme
  // Persist theme preference to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('dashboard-theme', theme)
  }
}
