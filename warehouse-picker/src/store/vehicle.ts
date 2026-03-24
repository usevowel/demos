import { proxy } from 'valtio'
import { persist, LocalStorageStrategy } from 'valtio-persist'
import { defaultVehicles } from './defaultData'

/**
 * Vehicle type options
 */
export type VehicleType = 'Car/Truck' | 'Motorcycle' | 'ATV/UTV' | 'RV' | 'Boat'

/**
 * Service event for vehicle maintenance history
 */
export interface ServiceEvent {
  /** Date of service event */
  date: string
  /** Type of service */
  type: string
  /** Description of service */
  description: string
  /** Optional notes */
  notes?: string
}

/**
 * Vehicle information structure
 */
export interface Vehicle {
  /** Vehicle type */
  type: VehicleType
  /** Year of the vehicle */
  year: string
  /** Vehicle manufacturer (make) */
  make: string
  /** Vehicle model */
  model: string
  /** Engine specification */
  engine: string
  /** Optional VIN number */
  vin?: string
  /** Optional license plate */
  licensePlate?: string
  /** Optional miles/odometer reading */
  miles?: number
  /** Optional notes about the vehicle */
  notes?: string
  /** Array of service events */
  serviceEvents?: ServiceEvent[]
}

/**
 * Vehicle store state managed by valtio
 */
export interface VehicleState {
  /** Array of all loaded vehicles */
  vehicles: Vehicle[]
  /** ID of the currently selected vehicle (index in vehicles array) */
  selectedVehicleId: number | null
  /** Whether the vehicle selector modal is open */
  modalOpen: boolean
  /** Current step in the vehicle selection process */
  selectionStep: 'list' | 'method' | 'year-make-model' | 'license-plate' | 'vin'
  /** Timestamp of last programmatic vehicle selection (to prevent Vowel from announcing) */
  lastProgrammaticSelect?: number
}

/**
 * Initial vehicle state - empty by default, will be populated from localStorage or default data
 */
const initialState: VehicleState = {
  vehicles: [],
  selectedVehicleId: null,
  modalOpen: false,
  selectionStep: 'method', // Start with method selection when no vehicles exist
}

/**
 * Initialize vehicle store with persistence
 * Transient fields (modalOpen, selectionStep, lastProgrammaticSelect) will be reset on load
 */
let vehicleStoreInit: Promise<VehicleState> | null = null

async function initVehicleStore(): Promise<VehicleState> {
  if (!vehicleStoreInit) {
    vehicleStoreInit = persist(initialState, 'auto-parts:vehicle', {
      storageStrategy: new LocalStorageStrategy(),
    }).then((result) => {
      // If no vehicles exist in localStorage, load default data
      if (result.store.vehicles.length === 0) {
        result.store.vehicles = [...defaultVehicles]
        result.store.selectedVehicleId = 0 // Select first vehicle by default
      }
      
      // Reset transient fields after hydration
      result.store.modalOpen = false
      result.store.selectionStep = result.store.vehicles.length > 0 ? 'list' : 'method'
      delete result.store.lastProgrammaticSelect
      return result.store
    })
  }
  return vehicleStoreInit
}

/**
 * Vehicle store proxy - reactive state managed by valtio with persistence
 * Initialize as proxy immediately so useSnapshot works correctly
 */
export let vehicleStore: VehicleState = proxy(initialState)

// Initialize store (non-blocking) and update the proxy
initVehicleStore().then((store) => {
  // Update the proxy store properties instead of replacing it
  Object.assign(vehicleStore, store)
})

/**
 * Ensure vehicle store is initialized
 * This will initialize the store if it hasn't been initialized yet
 * The initVehicleStore function handles deduplication internally
 */
export async function ensureVehicleStoreInitialized(): Promise<void> {
  const store = await initVehicleStore()
  // Update the proxy store properties if needed
  // Only update if the store reference changed (first initialization)
  if (store !== vehicleStore) {
    Object.assign(vehicleStore, store)
  }
}

/**
 * Open the vehicle selector modal
 */
export function openVehicleModal(): void {
  vehicleStore.modalOpen = true
  // Show list view if vehicles exist, otherwise show method selection
  vehicleStore.selectionStep = vehicleStore.vehicles.length > 0 ? 'list' : 'method'
}

/**
 * Close the vehicle selector modal
 */
export function closeVehicleModal(): void {
  vehicleStore.modalOpen = false
  // Reset to list view if vehicles exist, otherwise method selection
  vehicleStore.selectionStep = vehicleStore.vehicles.length > 0 ? 'list' : 'method'
}

/**
 * Set the selection step in the vehicle modal
 * @param step - The step to navigate to
 */
export function setSelectionStep(step: VehicleState['selectionStep']): void {
  vehicleStore.selectionStep = step
}

/**
 * Get the currently selected vehicle
 * @returns Selected vehicle or null
 */
export function getSelectedVehicle(): Vehicle | null {
  if (vehicleStore.selectedVehicleId === null) return null
  return vehicleStore.vehicles[vehicleStore.selectedVehicleId] || null
}

/**
 * Set the selected vehicle by index
 * @param vehicleId - Index of vehicle to select
 * @param isProgrammatic - Whether this is a programmatic selection (from button click) vs voice command
 */
export function setSelectedVehicleById(vehicleId: number, isProgrammatic: boolean = false): void {
  if (vehicleId >= 0 && vehicleId < vehicleStore.vehicles.length) {
    vehicleStore.selectedVehicleId = vehicleId
    // Mark as programmatic selection if called from button click
    if (isProgrammatic) {
      vehicleStore.lastProgrammaticSelect = Date.now()
    }
  }
}

/**
 * Add a new vehicle to the list
 * @param vehicle - Vehicle to add
 * @param isProgrammatic - Whether this is a programmatic addition (from form submission) vs voice command
 * @returns Index of the newly added vehicle
 */
export function addVehicle(vehicle: Vehicle, isProgrammatic: boolean = false): number {
  vehicleStore.vehicles.push(vehicle)
  const newIndex = vehicleStore.vehicles.length - 1
  vehicleStore.selectedVehicleId = newIndex
  // Mark as programmatic selection if called from form submission
  if (isProgrammatic) {
    vehicleStore.lastProgrammaticSelect = Date.now()
  }
  closeVehicleModal()
  return newIndex
}

/**
 * Remove a vehicle from the list
 * @param vehicleId - Index of vehicle to remove
 */
export function removeVehicle(vehicleId: number): void {
  if (vehicleId >= 0 && vehicleId < vehicleStore.vehicles.length) {
    vehicleStore.vehicles.splice(vehicleId, 1)
    
    // Adjust selected vehicle ID if needed
    if (vehicleStore.selectedVehicleId === vehicleId) {
      // If we removed the selected vehicle, select the first one or null
      vehicleStore.selectedVehicleId = vehicleStore.vehicles.length > 0 ? 0 : null
    } else if (vehicleStore.selectedVehicleId !== null && vehicleStore.selectedVehicleId > vehicleId) {
      // If we removed a vehicle before the selected one, decrement the index
      vehicleStore.selectedVehicleId--
    }
  }
}

/**
 * Clear the selected vehicle
 */
export function clearSelectedVehicle(): void {
  vehicleStore.selectedVehicleId = null
}

/**
 * Get display name for the selected vehicle
 * @returns Formatted vehicle name or default text
 */
export function getVehicleDisplayName(): string {
  const vehicle = getSelectedVehicle()
  if (!vehicle) return 'Add a vehicle'
  
  return `${vehicle.year} ${vehicle.make} ${vehicle.model}`
}
