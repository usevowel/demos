import { proxy } from 'valtio'
import { persist, LocalStorageStrategy } from 'valtio-persist'
import type { Vehicle } from './vehicle'
import { defaultPreviousPurchases } from './defaultData'

/**
 * Previous purchase record
 */
export interface PreviousPurchase {
  /** Item name */
  itemName: string
  /** Product SKU */
  sku: string
  /** Vehicle reference (can be Vehicle object or vehicle identifier string) */
  vehicle: Vehicle | string
  /** Date purchased (ISO string) */
  datePurchased: string
    /** store address */
  store?: string
  /** Optional notes */
  notes?: string
}

/**
 * Previous purchases store state
 */
export interface PurchasesState {
  /** Array of previous purchases */
  previousPurchases: PreviousPurchase[]
}

/**
 * Initial purchases state
 */
const initialState: PurchasesState = {
  previousPurchases: [],
}

/**
 * Initialize purchases store with persistence
 */
let purchasesStoreInit: Promise<PurchasesState> | null = null

async function initPurchasesStore(): Promise<PurchasesState> {
  if (!purchasesStoreInit) {
    purchasesStoreInit = persist(initialState, 'auto-parts:purchases', {
      storageStrategy: new LocalStorageStrategy(),
    }).then(async (result) => {
      // If no purchases exist in localStorage, load default data
      if (result.store.previousPurchases.length === 0) {
        // Ensure vehicle store is initialized to get vehicle references
        const { ensureVehicleStoreInitialized, vehicleStore: vs } = await import('./vehicle')
        await ensureVehicleStoreInitialized()
        
        // Map default purchases to use vehicle objects from the store
        // This ensures the vehicle references point to the actual store objects
        result.store.previousPurchases = defaultPreviousPurchases.map((purchase, index) => ({
          ...purchase,
          vehicle: vs.vehicles[index] || vs.vehicles[0],
        }))
      }
      return result.store
    })
  }
  return purchasesStoreInit
}

/**
 * Previous purchases store proxy - reactive state managed by valtio with persistence
 * Initialize as proxy immediately so useSnapshot works correctly
 */
export let purchasesStore: PurchasesState = proxy(initialState)

// Initialize store (non-blocking) and update the proxy
initPurchasesStore().then((store) => {
  // Update the proxy store properties instead of replacing it
  Object.assign(purchasesStore, store)
})

/**
 * Ensure purchases store is initialized
 * This will initialize the store if it hasn't been initialized yet
 * The initPurchasesStore function handles deduplication internally
 */
export async function ensurePurchasesStoreInitialized(): Promise<void> {
  const store = await initPurchasesStore()
  // Update the proxy store properties if needed
  // Only update if the store reference changed (first initialization)
  if (store !== purchasesStore) {
    Object.assign(purchasesStore, store)
  }
}

/**
 * Add a previous purchase
 * @param purchase - Purchase to add
 */
export function addPreviousPurchase(purchase: PreviousPurchase): void {
  purchasesStore.previousPurchases.push(purchase)
}

/**
 * Remove a previous purchase by index
 * @param index - Index of purchase to remove
 */
export function removePreviousPurchase(index: number): void {
  if (index >= 0 && index < purchasesStore.previousPurchases.length) {
    purchasesStore.previousPurchases.splice(index, 1)
  }
}

/**
 * Clear all previous purchases
 */
export function clearPreviousPurchases(): void {
  purchasesStore.previousPurchases = []
}
