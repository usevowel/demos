/**
 * Authentication store - manages user authentication and authorization
 */

import { proxy } from 'valtio'

/**
 * User role levels with different permission levels
 */
export type UserRole = 'admin' | 'operator' | 'viewer'

/**
 * User interface
 */
export interface User {
  id: string
  username: string
  email: string
  role: UserRole
  displayName: string
}

/**
 * Authentication store state
 */
export interface AuthStore {
  /** Current authenticated user, null if not logged in */
  currentUser: User | null
  /** Whether authentication is in progress */
  isAuthenticating: boolean
}

/**
 * Mock users for different role levels
 */
export const mockUsers: Record<UserRole, User> = {
  admin: {
    id: '1',
    username: 'admin',
    email: 'admin@vowel.to',
    role: 'admin',
    displayName: 'Administrator',
  },
  operator: {
    id: '2',
    username: 'operator',
    email: 'operator@vowel.to',
    role: 'operator',
    displayName: 'Network Operator',
  },
  viewer: {
    id: '3',
    username: 'viewer',
    email: 'viewer@vowel.to',
    role: 'viewer',
    displayName: 'Viewer',
  },
}

const initialState: AuthStore = {
  currentUser: mockUsers.admin, // Default to admin user
  isAuthenticating: false,
}

export const authStore = proxy<AuthStore>(initialState)

/**
 * Login with a specific user role
 * @param role - The role to login as
 */
export async function login(role: UserRole): Promise<void> {
  authStore.isAuthenticating = true
  
  // Simulate async login process
  await new Promise(resolve => setTimeout(resolve, 500))
  
  authStore.currentUser = mockUsers[role]
  authStore.isAuthenticating = false
}

/**
 * Logout the current user
 */
export function logout(): void {
  authStore.currentUser = null
}

/**
 * Check if user has a specific role or higher
 * Admin > Operator > Viewer
 * @param requiredRole - The minimum role required
 * @returns True if user has the required role or higher
 */
export function hasRole(requiredRole: UserRole): boolean {
  if (!authStore.currentUser) return false
  
  const roleHierarchy: Record<UserRole, number> = {
    viewer: 1,
    operator: 2,
    admin: 3,
  }
  
  return roleHierarchy[authStore.currentUser.role] >= roleHierarchy[requiredRole]
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return authStore.currentUser !== null
}
