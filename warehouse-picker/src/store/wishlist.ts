import { proxy } from 'valtio'
import { persist, LocalStorageStrategy } from 'valtio-persist'
import type { Vehicle } from './vehicle'
import { defaultWishlistItems } from './defaultData'

/**
 * Wishlist item
 */
export interface WishlistItem {
  /** Vehicle reference (can be Vehicle object or vehicle identifier string) */
  vehicle: Vehicle | string
  /** Item name */
  itemName: string
  /** Product SKU */
  sku: string
  /** Date added (ISO string) */
  dateAdded: string
  /** Optional notes */
  notes?: string
}

/**
 * Wishlist store state
 */
export interface WishlistState {
  /** Array of wishlist items */
  wishlistItems: WishlistItem[]
}

/**
 * Initial wishlist state
 */
const initialState: WishlistState = {
  wishlistItems: [],
}

/**
 * Initialize wishlist store with persistence
 */
let wishlistStoreInit: Promise<WishlistState> | null = null

async function initWishlistStore(): Promise<WishlistState> {
  if (!wishlistStoreInit) {
    wishlistStoreInit = persist(initialState, 'auto-parts:wishlist', {
      storageStrategy: new LocalStorageStrategy(),
    }).then(async (result) => {
      // If no wishlist items exist in localStorage, load default data
      if (result.store.wishlistItems.length === 0) {
        // Ensure vehicle store is initialized to get vehicle references
        const { ensureVehicleStoreInitialized, vehicleStore: vs } = await import('./vehicle')
        await ensureVehicleStoreInitialized()
        
        // Map default wishlist items with vehicle references
        // First 2 items for vehicle 0 (Jeep), next 2 for vehicle 1 (Acura)
        result.store.wishlistItems = defaultWishlistItems.map((item, index) => ({
          ...item,
          vehicle: vs.vehicles[Math.floor(index / 2)] || vs.vehicles[0], // First 2 for vehicle 0, next 2 for vehicle 1
        }))
      }
      return result.store
    })
  }
  return wishlistStoreInit
}

/**
 * Wishlist store proxy - reactive state managed by valtio with persistence
 * Initialize as proxy immediately so useSnapshot works correctly
 */
export let wishlistStore: WishlistState = proxy(initialState)

// Initialize store (non-blocking) and update the proxy
initWishlistStore().then((store) => {
  // Update the proxy store properties instead of replacing it
  Object.assign(wishlistStore, store)
})

/**
 * Ensure wishlist store is initialized
 * This will initialize the store if it hasn't been initialized yet
 * The initWishlistStore function handles deduplication internally
 */
export async function ensureWishlistStoreInitialized(): Promise<void> {
  const store = await initWishlistStore()
  // Update the proxy store properties if needed
  // Only update if the store reference changed (first initialization)
  if (store !== wishlistStore) {
    Object.assign(wishlistStore, store)
  }
}

/**
 * Add an item to the wishlist
 * @param item - Wishlist item to add
 */
export function addToWishlist(item: WishlistItem): void {
  wishlistStore.wishlistItems.push(item)
}

/**
 * Remove a wishlist item by index
 * @param index - Index of item to remove
 */
export function removeFromWishlist(index: number): void {
  if (index >= 0 && index < wishlistStore.wishlistItems.length) {
    wishlistStore.wishlistItems.splice(index, 1)
  }
}

/**
 * Remove a wishlist item by SKU
 * @param sku - SKU of item to remove
 */
export function removeFromWishlistBySku(sku: string): void {
  const index = wishlistStore.wishlistItems.findIndex((item) => item.sku === sku)
  if (index >= 0) {
    wishlistStore.wishlistItems.splice(index, 1)
  }
}

/**
 * Clear all wishlist items
 */
export function clearWishlist(): void {
  wishlistStore.wishlistItems = []
}
