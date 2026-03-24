/**
 * Modal for deploying firmware to selected devices.
 * Mirrors the createFirmwareUpdate Vowel action: deviceIds + optional firmwareVersion.
 */

import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { X, Server } from 'lucide-react'
import type { FirmwareVersion } from '@/data/firmware'
import type { Device } from '@/data/devices'
import { createUpdateWorkflow, startUpdateWorkflow } from '@/store/updateStore'

export interface DeployFirmwareModalProps {
  open: boolean
  onClose: () => void
  /** Target firmware to deploy */
  firmware: FirmwareVersion
  /** Devices compatible with this firmware (based on compatibleModels) */
  compatibleDevices: Device[]
  /** When true, show "Create workflow" - when false, show "Create and start" */
  onWorkflowCreated?: (workflowId: string) => void
}

/**
 * Modal for selecting devices and creating a firmware update workflow.
 * Mirrors createFirmwareUpdate: deviceIds (comma-separated) + firmwareVersion.
 */
export function DeployFirmwareModal({
  open,
  onClose,
  firmware,
  compatibleDevices,
  onWorkflowCreated,
}: DeployFirmwareModalProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [startImmediately, setStartImmediately] = useState(false)

  const toggleDevice = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(compatibleDevices.map((d) => d.id)))
  }

  const selectNone = () => setSelectedIds(new Set())

  const handleDeploy = () => {
    const deviceIds = Array.from(selectedIds)
    if (deviceIds.length === 0) return

    const workflow = createUpdateWorkflow(deviceIds, firmware)
    onWorkflowCreated?.(workflow.id)

    if (startImmediately) {
      startUpdateWorkflow(workflow.id)
    }

    setSelectedIds(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedIds(new Set())
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className="relative w-full max-w-lg mx-4 bg-bg-secondary border border-border rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              Deploy {firmware.type} {firmware.version}
            </h2>
            <p className="text-sm text-text-secondary mt-0.5">
              Select devices to update (mirrors createFirmwareUpdate)
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Device list */}
        <div className="flex flex-col gap-2 p-4 max-h-64 overflow-y-auto">
          {compatibleDevices.length === 0 ? (
            <p className="text-text-secondary text-sm">No compatible devices found.</p>
          ) : (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-xs text-cisco-blue hover:underline"
                >
                  Select all
                </button>
                <button
                  type="button"
                  onClick={selectNone}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {compatibleDevices.map((device) => (
                  <label
                    key={device.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-bg-tertiary cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(device.id)}
                      onChange={() => toggleDevice(device.id)}
                      className="rounded border-border"
                    />
                    <Server className="h-4 w-4 text-text-secondary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-text-primary font-medium">
                        <span className="font-mono text-cisco-blue">{device.deviceId}</span>
                      </span>
                      <span className="text-text-secondary text-sm ml-2">
                        <Link
                          to="/topology"
                          className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                        >
                          {device.hostname}
                        </Link>
                        {' · '}{device.model}
                      </span>
                    </div>
                    <span className="text-xs text-text-secondary font-mono">
                      {device.firmware.version}
                    </span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Options */}
        <div className="px-4 py-2 border-t border-border">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={startImmediately}
              onChange={(e) => setStartImmediately(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-text-secondary">
              Start immediately (mirrors startFirmwareUpdate)
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-border bg-bg-tertiary/50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeploy}
            disabled={selectedIds.size === 0}
            className="btn-cisco px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create workflow{startImmediately ? ' & start' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
