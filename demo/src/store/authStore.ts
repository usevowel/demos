/**
 * Valtio store for authentication state
 * Manages user authentication and session
 * Persists logged-in user to localStorage for session persistence
 */

import { proxy } from 'valtio'
import type { User, AuthState } from './types'
import { getUserByEmail, createUser, getUserById } from './usersStore'

const STORAGE_KEY = 'vowel_demo_auth'

/**
 * Serialize user for localStorage (convert Date objects to ISO strings)
 */
function serializeUser(user: User): string {
  return JSON.stringify({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString(),
  })
}

/**
 * Deserialize user from localStorage (convert ISO strings back to Date objects)
 */
function deserializeUser(userJson: string): User | null {
  try {
    const parsed = JSON.parse(userJson)
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      lastLogin: parsed.lastLogin ? new Date(parsed.lastLogin) : undefined,
    }
  } catch (error) {
    console.error('Failed to deserialize user from localStorage:', error)
    return null
  }
}

/**
 * Load user from localStorage
 */
function loadUserFromStorage(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const user = deserializeUser(stored)
    if (!user) return null
    
    // Verify user still exists in the users store (in case user was deleted)
    const existingUser = getUserById(user.id)
    if (!existingUser) {
      // User was deleted, clear storage
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    
    return user
  } catch (error) {
    console.error('Failed to load user from localStorage:', error)
    return null
  }
}

/**
 * Save user to localStorage
 */
function saveUserToStorage(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, serializeUser(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch (error) {
    console.error('Failed to save user to localStorage:', error)
  }
}

// Initialize authStore with user from localStorage if available
const storedUser = loadUserFromStorage()

export const authStore = proxy<AuthState>({
  currentUser: storedUser,
  isAuthenticated: !!storedUser,
})

/**
 * Sign in with email and password (mock implementation)
 * Saves user to localStorage for session persistence
 */
export const signIn = (email: string, password: string): boolean => {
  // Mock authentication - in real app, this would call an API
  // For demo, find user by email (password is not validated in mock)
  const user = getUserByEmail(email)
  
  if (user) {
    const signedInUser = {
      ...user,
      lastLogin: new Date(),
    }
    authStore.currentUser = signedInUser
    authStore.isAuthenticated = true
    saveUserToStorage(signedInUser)
    return true
  }
  
  // If email not found, return false
  return false
}

/**
 * Sign up new user (mock implementation)
 * Saves user to localStorage for session persistence
 */
export const signUp = (name: string, email: string, password: string): boolean => {
  // Mock signup - in real app, this would create a user via API
  
  // Check if email already exists
  const existingUser = getUserByEmail(email)
  if (existingUser) {
    return false // Email already taken
  }
  
  // Create new user in the store
  const newUser = createUser({
    name,
    email,
    role: 'user',
    lastLogin: new Date(),
  })
  
  // Set as current user
  authStore.currentUser = newUser
  authStore.isAuthenticated = true
  saveUserToStorage(newUser)
  return true
}

/**
 * Sign out current user
 * Clears user from localStorage
 */
export const signOut = () => {
  authStore.currentUser = null
  authStore.isAuthenticated = false
  saveUserToStorage(null) // This will remove the item from localStorage
}

/**
 * Get current authenticated user
 */
export const getCurrentUser = () => {
  return authStore.currentUser
}

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return authStore.isAuthenticated
}

