/**
 * Hook that syncs all app state to Vowel AI context
 */

import { useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { notesStore } from '@/store/notesStore'
import { useRouterState } from '@tanstack/react-router'
import { useSyncContext } from '@vowel.to/client/react'
import { deviceStore, getFilteredDevices, getSelectedDevice } from '@/store/deviceStore'
import { eventStore, getFilteredEvents, getSelectedEvent } from '@/store/eventStore'
import { firmwareStore } from '@/store/firmwareStore'
import { updateStore, getActiveWorkflow } from '@/store/updateStore'
import { getAllDevices, getUniqueBuildings, getUniqueFloors } from '@/data/devices'
import { getLatestFirmware } from '@/data/firmware'
import { getAllTenants } from '@/data/tenants'
import type { Device } from '@/data/devices'
import { getAllNotes } from '@/store/notesStore'

/**
 * Hook that syncs all app state to Vowel AI context
 * This automatically provides the AI with current dashboard state
 */
export function useAppStateSync() {
  // Get reactive snapshots of all stores
  const devices = useSnapshot(deviceStore)
  const events = useSnapshot(eventStore)
  const firmware = useSnapshot(firmwareStore)
  const updates = useSnapshot(updateStore)
  const notes = useSnapshot(notesStore)
  const routerState = useRouterState()

  // Build context object from current store state
  const context = useMemo(() => {
    const selectedDevice = getSelectedDevice()
    const selectedEvent = getSelectedEvent()
    const filteredDevices = getFilteredDevices()
    const filteredEvents = getFilteredEvents()
    const activeWorkflow = getActiveWorkflow()

    return {
      devices: {
        allDevices: devices.devices.map((d) => ({
          id: d.id,
          deviceId: d.deviceId,
          hostname: d.hostname,
          model: d.model,
          type: d.type,
          status: d.status,
          ipAddress: d.ipAddress,
          location: d.location,
          firmware: d.firmware,
        })),
        /** Unique buildings and floors for voice filtering - AI uses these for valid filter values */
        availableBuildings: getUniqueBuildings(),
        availableFloors: getUniqueFloors(),
        selectedDeviceId: devices.selectedDeviceId,
        selectedDevice: selectedDevice
          ? {
              id: selectedDevice.id,
              deviceId: selectedDevice.deviceId,
              hostname: selectedDevice.hostname,
              model: selectedDevice.model,
              type: selectedDevice.type,
              status: selectedDevice.status,
              ipAddress: selectedDevice.ipAddress,
              location: selectedDevice.location,
              firmware: selectedDevice.firmware,
            }
          : null,
        filters: devices.filters,
        filteredCount: filteredDevices.length,
        totalCount: devices.devices.length,
        stats: {
          online: devices.devices.filter((d) => d.status === 'online').length,
          offline: devices.devices.filter((d) => d.status === 'offline').length,
          warning: devices.devices.filter((d) => d.status === 'warning').length,
          critical: devices.devices.filter((d) => d.status === 'critical').length,
          outdated: devices.devices.filter((d) => d.firmware.outdated).length,
        },
      },
      events: {
        allEvents: events.events.map((e) => ({
          id: e.id,
          title: e.title,
          severity: e.severity,
          category: e.category,
          source: e.source,
          acknowledged: e.acknowledged,
          timestamp: e.timestamp,
        })),
        selectedEventId: events.selectedEventId,
        selectedEvent: selectedEvent
          ? {
              id: selectedEvent.id,
              title: selectedEvent.title,
              severity: selectedEvent.severity,
              category: selectedEvent.category,
              source: selectedEvent.source,
              acknowledged: selectedEvent.acknowledged,
              timestamp: selectedEvent.timestamp,
            }
          : null,
        filters: events.filters,
        filteredCount: filteredEvents.length,
        totalCount: events.events.length,
        stats: {
          critical: events.events.filter((e) => e.severity === 'critical').length,
          warning: events.events.filter((e) => e.severity === 'warning').length,
          info: events.events.filter((e) => e.severity === 'info').length,
          success: events.events.filter((e) => e.severity === 'success').length,
          unacknowledged: events.events.filter((e) => !e.acknowledged).length,
        },
      },
      firmware: {
        availableVersions: firmware.availableVersions?.map((f) => ({
          version: f.version,
          type: f.type,
          releaseDate: f.releaseDate,
        })) || [],
        selectedFirmwareType: firmware.selectedFirmwareType,
        filters: firmware.filters,
        devicesNeedingUpdates: (() => {
          const allDevices = getAllDevices()
          const needingUpdates: Array<{
            deviceId: string
            deviceHostname: string
            currentVersion: string
            latestVersion: string
          }> = []
          
          for (const device of allDevices) {
            const latestVersion = getLatestFirmware(device.firmware.type as import('@/data/firmware').FirmwareType)
            if (latestVersion && latestVersion.version !== device.firmware.version) {
              needingUpdates.push({
                deviceId: device.deviceId,
                deviceHostname: device.hostname,
                currentVersion: device.firmware.version,
                latestVersion: latestVersion.version,
              })
            }
          }
          
          return needingUpdates
        })(),
        devicesNeedingUpdatesCount: (() => {
          const allDevices = getAllDevices()
          return allDevices.filter((device: Device) => {
            const latestVersion = getLatestFirmware(device.firmware.type as import('@/data/firmware').FirmwareType)
            return latestVersion && latestVersion.version !== device.firmware.version
          }).length
        })(),
      },
      updates: {
        workflows: updates.workflows.map((w) => ({
          id: w.id,
          deviceIds: w.deviceIds,
          targetFirmware: {
            version: w.targetFirmware.version,
            type: w.targetFirmware.type,
          },
          status: w.status,
          progress: w.progress,
          createdAt: w.createdAt,
          startedAt: w.startedAt,
          completedAt: w.completedAt,
          error: w.error,
          stepCount: w.steps?.length || 0,
          completedSteps: w.steps?.filter((s) => s.status === 'complete').length || 0,
        })),
        activeWorkflowId: updates.activeWorkflowId,
        activeWorkflow: activeWorkflow
          ? {
              id: activeWorkflow.id,
              status: activeWorkflow.status,
              progress: activeWorkflow.progress,
              deviceCount: activeWorkflow.deviceIds.length,
              targetVersion: activeWorkflow.targetFirmware.version,
            }
          : null,
        totalWorkflows: updates.workflows.length,
        pendingCount: updates.workflows.filter((w) => w.status === 'pending').length,
        inProgressCount: updates.workflows.filter((w) => w.status === 'in_progress').length,
        completeCount: updates.workflows.filter((w) => w.status === 'complete').length,
        failedCount: updates.workflows.filter((w) => w.status === 'failed').length,
      },
      /** Current navigation state - AI uses this to know where the user is and whether to navigate first */
      ui: {
        currentRoute: routerState.location.pathname,
      },
      /** Tenants - for selectTenant when user asks for tenant details */
      tenants: {
        allTenants: getAllTenants().map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          deviceCount: t.deviceCount,
        })),
      },
      /** Notes - for createNote, updateNote, deleteNote, listNotes */
      notes: {
        allNotes: getAllNotes().map((n) => ({ id: n.id, title: n.title })),
        count: getAllNotes().length,
      },
    }
  }, [
    // Device store dependencies
    devices.devices,
    devices.selectedDeviceId,
    devices.filters,
    // Event store dependencies
    events.events,
    events.selectedEventId,
    events.filters,
    // Firmware store dependencies
    firmware.availableVersions,
    firmware.selectedFirmwareType,
    // Update store dependencies
    updates.workflows,
    updates.activeWorkflowId,
    // Notes store - for notes context
    notes.notes,
    // Router - for currentRoute
    routerState.location.pathname,
  ])

  // Sync context to Vowel AI - use type assertion to satisfy TypeScript
  useSyncContext(context as Record<string, unknown>)

  return context
}
