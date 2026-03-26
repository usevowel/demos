/**
 * Valtio store for user management
 * Provides CRUD operations for users and maintains seeded mock data
 */

import { proxy } from 'valtio'
import type { User } from './types'
import seedUsersData from '@/data/users.json'

interface UsersState {
  users: User[]
  loading: boolean
  error: string | null
}

/**
 * Seeded user data loaded from JSON and converted to proper types
 */
const seedUsers: User[] = seedUsersData.map(user => ({
  ...user,
  role: user.role as 'admin' | 'user',
  createdAt: new Date(user.createdAt),
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
}))

export const usersStore = proxy<UsersState>({
  users: [...seedUsers],
  loading: false,
  error: null,
})

/**
 * Get all users
 */
export const getUsers = () => {
  return usersStore.users
}

/**
 * Get user by ID
 */
export const getUserById = (id: string) => {
  return usersStore.users.find(user => user.id === id)
}

/**
 * Get user by email
 */
export const getUserByEmail = (email: string) => {
  return usersStore.users.find(user => user.email.toLowerCase() === email.toLowerCase())
}

/**
 * Create a new user
 */
export const createUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
  const newUser: User = {
    ...userData,
    id: String(usersStore.users.length + 1),
    createdAt: new Date(),
  }
  usersStore.users.push(newUser)
  return newUser
}

/**
 * Update an existing user
 */
export const updateUser = (id: string, updates: Partial<User>) => {
  const userIndex = usersStore.users.findIndex(user => user.id === id)
  if (userIndex !== -1) {
    usersStore.users[userIndex] = {
      ...usersStore.users[userIndex],
      ...updates,
    }
    return usersStore.users[userIndex]
  }
  return null
}

/**
 * Delete a user
 */
export const deleteUser = (id: string) => {
  const userIndex = usersStore.users.findIndex(user => user.id === id)
  if (userIndex !== -1) {
    usersStore.users.splice(userIndex, 1)
    return true
  }
  return false
}

