import { proxy } from 'valtio'
import { persist, LocalStorageStrategy } from 'valtio-persist'

/**
 * User information
 */
export interface User {
  /** User's full name */
  name: string
  /** User's email address */
  email: string
}

/**
 * User store state
 */
export interface UserState {
  /** Current user information */
  user: User | null
}

/**
 * Default user data
 */
const defaultUser: User = {
  name: 'Alex Smith',
  email: 'alex@vowel.to',
}

/**
 * Initial user state
 */
const initialState: UserState = {
  user: null,
}

/**
 * Initialize user store with persistence
 */
let userStoreInit: Promise<UserState> | null = null

async function initUserStore(): Promise<UserState> {
  if (!userStoreInit) {
    userStoreInit = persist(initialState, 'auto-parts:user', {
      storageStrategy: new LocalStorageStrategy(),
    }).then((result) => {
      // If no user exists in localStorage, load default user data
      if (!result.store.user) {
        result.store.user = { ...defaultUser }
      }
      return result.store
    })
  }
  return userStoreInit
}

/**
 * User store proxy - reactive state managed by valtio with persistence
 * Initialize as proxy immediately so useSnapshot works correctly
 */
export let userStore: UserState = proxy(initialState)

// Initialize store (non-blocking) and update the proxy
initUserStore().then((store) => {
  // Update the proxy store properties instead of replacing it
  Object.assign(userStore, store)
})

/**
 * Ensure user store is initialized
 * This will initialize the store if it hasn't been initialized yet
 * The initUserStore function handles deduplication internally
 */
export async function ensureUserStoreInitialized(): Promise<void> {
  const store = await initUserStore()
  // Update the proxy store properties if needed
  // Only update if the store reference changed (first initialization)
  if (store !== userStore) {
    Object.assign(userStore, store)
  }
}

/**
 * Set the current user
 * @param user - User information to set
 */
export function setUser(user: User): void {
  userStore.user = { ...user }
}

/**
 * Clear the current user
 */
export function clearUser(): void {
  userStore.user = null
}
