import { proxy, subscribe } from 'valtio'
import { Platform } from 'react-native'
import mockData from '../assets/mock-data.json'

/**
 * Item interface for inventory data
 */
export interface Item {
  id: string
  name: string
  description: string
  category: string
  locations: {
    location: string
    quantity: number
    maxQuantity: number
  }[]
}

/**
 * QR Code Data interface
 */
export interface QRCodeData {
  location: string        // Shelf location (e.g., "A3-R1-B1")
  itemId: string          // Product ID
  orderId?: string       // Associated order (if active)
  timestamp: number      // When generated
}

/**
 * User interface from mock data
 */
export interface User {
  id: string
  name: string
  email: string
  role: 'picker' | 'admin'
  defaultPage: string
}

/**
 * Shared state store for warehouse and pick pages
 * Used for real-time synchronization between pages via Durable Object WebSocket sync
 */
export interface SharedState {
  /**
   * Active QR codes displayed on warehouse page
   * Key: location string (e.g., "A3-R1-B1")
   * Value: QR code data and image URI
   */
  activeQRCodes: Map<string, { data: QRCodeData; imageUri: string; shelfId: string }>
  
  /**
   * Currently selected order item (for generating QR codes)
   */
  selectedOrderItem: { orderId: string; itemId: string; location: string } | null
  
  /**
   * Currently logged in user (null if not logged in)
   */
  currentUser: User | null
  
  /**
   * WebSocket connection state
   */
  wsConnected: boolean
  sessionId: string | null
}

/**
 * Create shared state store using Valtio
 * Maps are tracked by Valtio when mutated directly
 */
export const sharedState = proxy<SharedState>({
  activeQRCodes: new Map(),
  selectedOrderItem: null,
  currentUser: null,
  wsConnected: false,
  sessionId: null,
})

/**
 * LocalStorage helper functions (works for web, needs AsyncStorage for native)
 */
const storage = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
    // For native, would need AsyncStorage - for now return null
    return null
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value)
    }
    // For native, would need AsyncStorage
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key)
    }
    // For native, would need AsyncStorage
  },
}

/**
 * Storage key for user session
 */
const USER_STORAGE_KEY = 'pickr_user_session'

/**
 * Initialize user state from localStorage on app start
 */
export const initializeUserState = () => {
  try {
    const storedUser = storage.getItem(USER_STORAGE_KEY)
    if (storedUser) {
      const user = JSON.parse(storedUser) as User
      // Verify user still exists in mock data
      const users = (mockData as any).users as User[]
      const validUser = users.find(u => u.id === user.id)
      if (validUser) {
        sharedState.currentUser = validUser
      } else {
        // User no longer exists, clear storage
        storage.removeItem(USER_STORAGE_KEY)
      }
    }
  } catch (error) {
    console.error('Failed to initialize user state:', error)
    storage.removeItem(USER_STORAGE_KEY)
  }
}

/**
 * Login a user by ID
 */
export const loginUser = (userId: string) => {
  const users = (mockData as any).users as User[]
  const user = users.find(u => u.id === userId)
  if (user) {
    sharedState.currentUser = user
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    return user
  }
  return null
}

/**
 * Logout current user
 */
export const logoutUser = () => {
  sharedState.currentUser = null
  storage.removeItem(USER_STORAGE_KEY)
}

/**
 * Get all available users from mock data
 */
export const getAvailableUsers = (): User[] => {
  return (mockData as any).users as User[] || []
}

/**
 * Reset demo state - clears all QR codes and resets to initial state
 * Note: This doesn't reset orders/items as those come from mock data
 */
export const resetDemo = () => {
  clearAllQRCodes()
  // Additional reset logic can be added here if needed
}

/**
 * Helper to update QR codes in shared state
 * Valtio requires us to mutate the Map directly or replace it entirely
 */
export const setActiveQRCodes = (qrCodes: Map<string, { data: QRCodeData; imageUri: string; shelfId: string }>) => {
  sharedState.activeQRCodes = qrCodes
}

/**
 * Helper to add a single QR code to shared state
 * Mutates the Map directly to ensure Valtio reactivity
 */
export const addQRCode = (location: string, qrData: { data: QRCodeData; imageUri: string; shelfId: string }) => {
  // Mutate the Map directly instead of replacing it to ensure Valtio tracks changes
  sharedState.activeQRCodes.set(location, qrData)
  console.log('[Store] Added QR code:', location, 'Total QR codes:', sharedState.activeQRCodes.size)
}

/**
 * Helper to remove a QR code from shared state
 * Mutates the Map directly to ensure Valtio reactivity
 */
export const removeQRCode = (location: string) => {
  // Mutate the Map directly instead of replacing it to ensure Valtio tracks changes
  sharedState.activeQRCodes.delete(location)
  if (sharedState.selectedOrderItem?.location === location) {
    sharedState.selectedOrderItem = null
  }
}

/**
 * Helper to clear all QR codes
 */
export const clearAllQRCodes = () => {
  sharedState.activeQRCodes = new Map()
  sharedState.selectedOrderItem = null
}

/**
 * Warehouse-specific state store
 * Separated from sharedState to prevent unnecessary re-renders during typing
 */
export interface WarehouseState {
  /** Debounced search query (updates after 300ms delay) */
  searchQuery: string
  /** Current filtered items based on search query */
  filteredItems: Item[]
  /** All inventory items */
  allItems: Item[]
}

export const warehouseStore = proxy<WarehouseState>({
  searchQuery: '',
  filteredItems: [],
  allItems: [],
})

/**
 * Load items into warehouse store
 */
export const loadWarehouseItems = (items: Item[]) => {
  warehouseStore.allItems = items
  warehouseStore.filteredItems = items
}

/**
 * Update search query and trigger filtering
 */
export const setWarehouseSearchQuery = (query: string) => {
  warehouseStore.searchQuery = query
  
  if (!query.trim()) {
    warehouseStore.filteredItems = warehouseStore.allItems
  } else {
    const lowerQuery = query.toLowerCase()
    warehouseStore.filteredItems = warehouseStore.allItems.filter(item => 
      item.name.toLowerCase().includes(lowerQuery) ||
      item.id.toLowerCase().includes(lowerQuery) ||
      item.category.toLowerCase().includes(lowerQuery)
    )
  }
}

/**
 * Clear search query and reset filtered items
 */
export const clearWarehouseSearch = () => {
  warehouseStore.searchQuery = ''
  warehouseStore.filteredItems = warehouseStore.allItems
}

/**
 * Debounce timer reference (managed externally)
 */
let warehouseSearchDebounceTimer: NodeJS.Timeout | null = null

/**
 * Update search with debounce
 * Call this on every keystroke - it handles debouncing internally
 */
export const setWarehouseSearchQueryDebounced = (query: string, delay: number = 300) => {
  // Clear existing timer
  if (warehouseSearchDebounceTimer) {
    clearTimeout(warehouseSearchDebounceTimer)
    warehouseSearchDebounceTimer = null
  }
  
  // Set new timer to update searchQuery after delay
  warehouseSearchDebounceTimer = setTimeout(() => {
    setWarehouseSearchQuery(query)
    warehouseSearchDebounceTimer = null
  }, delay)
}

/**
 * Clear any pending debounce timer
 * Call this when component unmounts or search is cleared
 */
export const clearWarehouseSearchDebounce = () => {
  if (warehouseSearchDebounceTimer) {
    clearTimeout(warehouseSearchDebounceTimer)
    warehouseSearchDebounceTimer = null
  }
}
