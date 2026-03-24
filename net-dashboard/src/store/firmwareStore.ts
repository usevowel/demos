/**
 * Firmware store - manages firmware versions and update workflows
 */

import { proxy } from 'valtio'
import { getAllFirmwareVersions, getLatestFirmware, type FirmwareVersion, type FirmwareType } from '@/data/firmware'
import { getAllDevices } from '@/data/devices'
import type { Device } from '@/data/devices'

export type UpdateStatus = 'pending' | 'downloading' | 'backing-up' | 'installing' | 'rebooting' | 'verifying' | 'complete' | 'failed'

export interface FirmwareUpdate {
  id: string
  deviceIds: string[]
  firmwareId: string
  scheduledTime?: Date
  status: UpdateStatus
  progress: number // 0-100
  currentStep?: string
  startedAt?: Date
  completedAt?: Date
  error?: string
}

export interface FirmwareFilters {
  showOnlyNeededByDevices?: boolean
  type?: string
}

export interface FirmwareStore {
  availableVersions: FirmwareVersion[]
  selectedFirmwareType?: string
  filters: FirmwareFilters
  updates: FirmwareUpdate[]
  selectedUpdateId?: string
}

const initialState: FirmwareStore = {
  availableVersions: getAllFirmwareVersions(),
  filters: {},
  updates: [],
}

export const firmwareStore = proxy<FirmwareStore>(initialState)

// Actions
export function createUpdate(deviceIds: string[], firmwareId: string, scheduledTime?: Date): string {
  const updateId = `update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const update: FirmwareUpdate = {
    id: updateId,
    deviceIds,
    firmwareId,
    scheduledTime,
    status: 'pending',
    progress: 0,
  }
  
  firmwareStore.updates.push(update)
  return updateId
}

export function selectUpdate(updateId: string | undefined) {
  firmwareStore.selectedUpdateId = updateId
}

export function getSelectedUpdate(): FirmwareUpdate | undefined {
  return firmwareStore.selectedUpdateId
    ? firmwareStore.updates.find(u => u.id === firmwareStore.selectedUpdateId)
    : undefined
}

export async function executeUpdate(updateId: string): Promise<void> {
  const update = firmwareStore.updates.find(u => u.id === updateId)
  if (!update) return

  update.status = 'downloading'
  update.startedAt = new Date()
  update.progress = 0
  update.currentStep = 'Downloading firmware...'

  // Simulate update process
  const steps: { status: UpdateStatus; step: string; duration: number; progress: number }[] = [
    { status: 'downloading', step: 'Downloading firmware...', duration: 5000, progress: 15 },
    { status: 'backing-up', step: 'Backing up configuration...', duration: 3000, progress: 30 },
    { status: 'installing', step: 'Installing firmware...', duration: 25000, progress: 70 },
    { status: 'rebooting', step: 'Rebooting device...', duration: 15000, progress: 90 },
    { status: 'verifying', step: 'Verifying installation...', duration: 5000, progress: 100 },
  ]

  for (const { status, step, duration, progress } of steps) {
    await new Promise(resolve => setTimeout(resolve, duration))
    update.status = status
    update.currentStep = step
    update.progress = progress
  }

  update.status = 'complete'
  update.completedAt = new Date()
  update.currentStep = 'Update complete!'
}

export function cancelUpdate(updateId: string) {
  const index = firmwareStore.updates.findIndex(u => u.id === updateId)
  if (index >= 0) {
    firmwareStore.updates.splice(index, 1)
  }
}

export function getUpdateHistory(): FirmwareUpdate[] {
  return firmwareStore.updates
    .filter(u => u.status === 'complete' || u.status === 'failed')
    .sort((a, b) => {
      const timeA = a.completedAt?.getTime() || 0
      const timeB = b.completedAt?.getTime() || 0
      return timeB - timeA
    })
}

export function getScheduledUpdates(): FirmwareUpdate[] {
  return firmwareStore.updates
    .filter(u => u.scheduledTime && u.status === 'pending')
    .sort((a, b) => {
      const timeA = a.scheduledTime?.getTime() || 0
      const timeB = b.scheduledTime?.getTime() || 0
      return timeA - timeB
    })
}

export function getActiveUpdates(): FirmwareUpdate[] {
  return firmwareStore.updates.filter(u => 
    u.status !== 'pending' && 
    u.status !== 'complete' && 
    u.status !== 'failed'
  )
}

// Filter actions
export function updateFilters(newFilters: Partial<FirmwareFilters>) {
  firmwareStore.filters = { ...firmwareStore.filters, ...newFilters }
}

export function clearFilters() {
  firmwareStore.filters = {}
}

export function toggleDevicesNeedingUpdatesFilter() {
  firmwareStore.filters.showOnlyNeededByDevices = 
    !firmwareStore.filters.showOnlyNeededByDevices
}

/**
 * Get filtered firmware versions based on current filters
 */
export function getFilteredFirmwareVersions(): FirmwareVersion[] {
  let filtered = firmwareStore.availableVersions

  const { showOnlyNeededByDevices, type } = firmwareStore.filters

  if (type) {
    filtered = filtered.filter(f => f.type === type)
  }

  if (showOnlyNeededByDevices) {
    const devices = getAllDevices()
    
    // Get unique firmware types that are needed by devices
    const neededFirmwareTypes = new Set<string>()
    devices.forEach((device: Device) => {
      const latestVersion = getLatestFirmware(device.firmware.type as FirmwareType)
      if (latestVersion && latestVersion.version !== device.firmware.version) {
        neededFirmwareTypes.add(device.firmware.type)
      }
    })
    
    // Filter to only show firmware versions that are needed
    filtered = filtered.filter(f => neededFirmwareTypes.has(f.type))
  }

  return filtered
}
