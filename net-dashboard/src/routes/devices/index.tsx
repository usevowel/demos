/**
 * Devices list page with search and filters
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { deviceStore, getFilteredDevices, updateFilters, clearFilters } from '@/store/deviceStore'
import { StatusBadge } from '@/components/StatusBadge'
import { Search, Server, MapPin, Building2, Layers } from 'lucide-react'
import { getUniqueBuildings, getUniqueFloors } from '@/data/devices'
import type { DeviceType, DeviceStatus } from '@/data/devices'
import type { EventSeverity } from '@/data/events'

function DevicesPage() {
  const snap = useSnapshot(deviceStore)
  const filteredDevices = getFilteredDevices()
  const buildings = getUniqueBuildings()
  const floors = getUniqueFloors()

  const hasActiveFilters =
    snap.filters.query ||
    snap.filters.type ||
    snap.filters.status ||
    snap.filters.building ||
    snap.filters.floor !== undefined ||
    snap.filters.outdated ||
    snap.filters.eventSeverity ||
    snap.filters.eventAcknowledged !== undefined

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Network Devices</h1>
          <p className="text-text-secondary mt-1">
            {filteredDevices.length} devices
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Search devices..."
                value={snap.filters.query || ''}
                onChange={(e) => updateFilters({ query: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-cisco-blue"
              />
            </div>
          </div>

          {/* Type filter */}
          <div>
            <select
              value={snap.filters.type || ''}
              onChange={(e) => updateFilters({ type: e.target.value ? (e.target.value as DeviceType) : undefined })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Types</option>
              <option value="router">Routers</option>
              <option value="switch">Switches</option>
              <option value="access-point">Access Points</option>
              <option value="firewall">Firewalls</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={snap.filters.status || ''}
              onChange={(e) => updateFilters({ status: e.target.value ? (e.target.value as DeviceStatus) : undefined })}
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Status</option>
              <option value="online">Online</option>
              <option value="offline">Offline</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Event severity filter - devices that have events with this severity */}
          <div>
            <select
              value={snap.filters.eventSeverity || ''}
              onChange={(e) =>
                updateFilters({
                  eventSeverity: e.target.value ? (e.target.value as EventSeverity) : undefined,
                })
              }
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Event Severity</option>
              <option value="critical">Critical Events</option>
              <option value="warning">Warning Events</option>
              <option value="info">Info Events</option>
              <option value="success">Success Events</option>
            </select>
          </div>

          {/* Event acknowledgment filter */}
          <div>
            <select
              value={
                snap.filters.eventAcknowledged === undefined
                  ? ''
                  : snap.filters.eventAcknowledged
                    ? 'acknowledged'
                    : 'unacknowledged'
              }
              onChange={(e) =>
                updateFilters({
                  eventAcknowledged:
                    e.target.value === ''
                      ? undefined
                      : e.target.value === 'acknowledged',
                })
              }
              className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Event Status</option>
              <option value="unacknowledged">Unacknowledged Events</option>
              <option value="acknowledged">Acknowledged Events</option>
            </select>
          </div>
        </div>

        {/* Location filters - Building and Floor */}
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="h-5 w-5 text-cisco-blue" />
            <span className="text-sm font-medium text-text-primary">Location</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 min-w-[140px]">
              <Building2 className="h-4 w-4 text-text-secondary shrink-0" />
              <select
                value={snap.filters.building || ''}
                onChange={(e) =>
                  updateFilters({
                    building: e.target.value || undefined,
                    floor: e.target.value ? snap.filters.floor : undefined,
                  })
                }
                className="flex-1 min-w-0 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cisco-blue"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 min-w-[120px]">
              <Layers className="h-4 w-4 text-text-secondary shrink-0" />
              <select
                value={snap.filters.floor ?? ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateFilters({
                    floor: val === '' ? undefined : parseInt(val, 10),
                  })
                }}
                className="flex-1 min-w-0 px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cisco-blue"
              >
                <option value="">All Floors</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="text-sm text-cisco-blue hover:text-cisco-blue-light"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((device) => (
          <Link
            key={device.id}
            to="/devices/$deviceId"
            params={{ deviceId: device.id }}
            className="device-card cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Server className="h-8 w-8 text-cisco-blue" />
                <div>
                  <h3 className="font-semibold text-text-primary group-hover:text-cisco-blue transition-colors">
                    <span className="font-mono text-text-primary">{device.deviceId}</span>
                  </h3>
                  <p className="text-xs text-text-secondary">
                    <Link
                      to="/topology"
                      className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {device.hostname}
                    </Link>
                    {' · '}
                    {device.model}
                  </p>
                </div>
              </div>
              <StatusBadge status={device.status} />
            </div>

            <div className="mt-4 pt-4 border-t border-border space-y-2 text-sm">
              {/* Location metadata - prominent for network ops */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cisco-blue/10 text-cisco-blue text-xs font-medium">
                  <Building2 className="h-3 w-3" />
                  {device.location.building}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary text-xs font-medium">
                  <Layers className="h-3 w-3" />
                  Floor {device.location.floor}
                </span>
                {device.location.rack && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-bg-tertiary text-text-secondary text-xs font-mono">
                    {device.location.rack}
                  </span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">IP:</span>
                <span className="text-text-primary font-mono">{device.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Firmware:</span>
                <span className={device.firmware.outdated ? "text-status-warning font-semibold" : "text-text-primary"}>
                  {device.firmware.version}
                  {device.firmware.outdated && " ⚠"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">CPU / Mem:</span>
                <span className="text-text-primary">
                  {device.metrics.cpu.toFixed(0)}% / {device.metrics.memory.toFixed(0)}%
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="text-center py-12">
          <Server className="h-16 w-16 text-text-secondary mx-auto mb-4" />
          <p className="text-text-secondary">No devices found matching your filters.</p>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/devices/')({
  component: DevicesPage,
})
