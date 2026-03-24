/**
 * Mock data loading functions
 * Simulates API calls but uses localStorage (via valtio-persist)
 */

import {
  ensureVehicleStoreInitialized,
  vehicleStore,
  type Vehicle,
} from './vehicle'
import {
  ensurePurchasesStoreInitialized,
  purchasesStore,
  type PreviousPurchase,
} from './purchases'
import {
  ensureWishlistStoreInitialized,
  wishlistStore,
  type WishlistItem,
} from './wishlist'
import {
  ensureCartStoreInitialized,
  clearCart,
} from './cart'
import {
  ensureUserStoreInitialized,
} from './user'
import {
  defaultVehicles,
  defaultWishlistItems,
  defaultPreviousPurchases,
} from './defaultData'

/**
 * Mock data structure returned from API
 */
export interface MockData {
  vehicles: Vehicle[]
  previousPurchases: PreviousPurchase[]
  wishlistItems: WishlistItem[]
}

/**
 * Load mock data from localStorage (simulates API call)
 * This function ensures all stores are initialized and returns the current state
 * @returns Promise resolving to mock data structure
 */
export async function loadMockData(): Promise<MockData> {
  // Ensure all stores are initialized (this will load from localStorage if available)
  await Promise.all([
    ensureVehicleStoreInitialized(),
    ensurePurchasesStoreInitialized(),
    ensureWishlistStoreInitialized(),
    ensureCartStoreInitialized(),
    ensureUserStoreInitialized(),
  ])

  // Return the current state from stores
  // This simulates an API response but actually reads from persisted localStorage
  return {
    vehicles: vehicleStore.vehicles,
    previousPurchases: purchasesStore.previousPurchases,
    wishlistItems: wishlistStore.wishlistItems,
  }
}

/**
 * Persist mock data to localStorage (simulates API save)
 * This function updates the stores, which will automatically persist via valtio-persist
 * @param data - Mock data to persist
 */
export async function persistMockData(data: Partial<MockData>): Promise<void> {
  // Ensure stores are initialized
  await Promise.all([
    ensureVehicleStoreInitialized(),
    ensurePurchasesStoreInitialized(),
    ensureWishlistStoreInitialized(),
  ])

  // Update stores with provided data
  if (data.vehicles !== undefined) {
    vehicleStore.vehicles = data.vehicles
  }
  if (data.previousPurchases !== undefined) {
    purchasesStore.previousPurchases = data.previousPurchases
  }
  if (data.wishlistItems !== undefined) {
    wishlistStore.wishlistItems = data.wishlistItems
  }

  // Persistence happens automatically via valtio-persist subscriptions
}

/**
 * Reset all stores to default data
 * This clears localStorage and loads the default vehicles, wishlist items, and purchases
 */
export async function resetToDefaultData(): Promise<void> {
  // Clear localStorage keys for all stores
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('auto-parts:vehicle')
    localStorage.removeItem('auto-parts:wishlist')
    localStorage.removeItem('auto-parts:purchases')
    localStorage.removeItem('auto-parts:cart')
    localStorage.removeItem('auto-parts:user')
  }

  // Ensure stores are initialized (will now load from default data since localStorage is cleared)
  await Promise.all([
    ensureVehicleStoreInitialized(),
    ensurePurchasesStoreInitialized(),
    ensureWishlistStoreInitialized(),
    ensureCartStoreInitialized(),
    ensureUserStoreInitialized(),
  ])

  // Reset stores to default data
  vehicleStore.vehicles = [...defaultVehicles]
  vehicleStore.selectedVehicleId = 0 // Select first vehicle by default
  
  // Map wishlist items with vehicle references
  // First 2 items for vehicle 0 (Jeep), next 2 for vehicle 1 (Acura)
  wishlistStore.wishlistItems = defaultWishlistItems.map((item, index) => ({
    ...item,
    vehicle: vehicleStore.vehicles[Math.floor(index / 2)] || vehicleStore.vehicles[0],
  }))
  
  // Map purchases with vehicle references
  // First purchase for vehicle 0 (Jeep), second for vehicle 1 (Acura)
  purchasesStore.previousPurchases = defaultPreviousPurchases.map((purchase, index) => ({
    ...purchase,
    vehicle: vehicleStore.vehicles[index] || vehicleStore.vehicles[0],
  }))

  // Clear cart to ensure it's empty
  clearCart()

  // Persistence happens automatically via valtio-persist subscriptions
}
