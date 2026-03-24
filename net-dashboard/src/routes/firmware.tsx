/**
 * Firmware catalog page
 * UI mirrors Vowel actions: createFirmwareUpdate, startFirmwareUpdate, cancelFirmwareUpdate
 */

import { useState } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { getAllFirmwareVersions, getLatestFirmware } from '@/data/firmware'
import { getOutdatedDevices, getAllDevices } from '@/data/devices'
import type { FirmwareVersion } from '@/data/firmware'
import { Package, Download, Shield, AlertCircle, Play, CheckCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { firmwareStore, toggleDevicesNeedingUpdatesFilter, getFilteredFirmwareVersions } from '@/store/firmwareStore'
import {
  updateStore,
  createUpdateWorkflow,
  startUpdateWorkflow,
  cancelUpdateWorkflow,
} from '@/store/updateStore'
import { DeployFirmwareModal } from '@/components/DeployFirmwareModal'

/** Get devices compatible with a firmware version (based on compatibleModels) */
function getCompatibleDevices(firmware: FirmwareVersion) {
  return getAllDevices().filter((d) =>
    firmware.compatibleModels.some((m) => m.includes(d.model) || d.model.includes(m))
  )
}

function FirmwarePage() {
  const [deployModalFirmware, setDeployModalFirmware] = useState<FirmwareVersion | null>(null)

  const firmwareSnapshot = useSnapshot(firmwareStore)
  const updateSnapshot = useSnapshot(updateStore)
  const outdatedDevices = getOutdatedDevices()
  
  // Use filtered firmware if filter is active, otherwise use all firmware
  const firmware = firmwareSnapshot.filters.showOnlyNeededByDevices 
    ? getFilteredFirmwareVersions()
    : getAllFirmwareVersions()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Firmware Management</h1>
        <p className="text-text-secondary mt-1">
          Available firmware versions and update status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className={cn(
            "bg-bg-secondary border border-border rounded-lg p-6 cursor-pointer transition-all hover:border-status-warning hover:shadow-lg",
            firmwareSnapshot.filters.showOnlyNeededByDevices && "border-status-warning shadow-md"
          )}
          onClick={() => toggleDevicesNeedingUpdatesFilter()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              toggleDevicesNeedingUpdatesFilter()
            }
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Devices Needing Updates</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{outdatedDevices.length}</p>
              {firmwareSnapshot.filters.showOnlyNeededByDevices && (
                <p className="text-xs text-status-warning mt-1">Filter active</p>
              )}
            </div>
            <AlertCircle className="h-12 w-12 text-status-warning" />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Available Versions</p>
              <p className="text-4xl font-bold text-text-primary mt-2">
                {firmware.filter(f => f.supportStatus === 'current').length}
              </p>
            </div>
            <Package className="h-12 w-12 text-cisco-blue" />
          </div>
        </div>

        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">CVEs Fixed</p>
              <p className="text-4xl font-bold text-text-primary mt-2">
                {firmware.reduce((total, f) => total + f.cvesFixed.length, 0)}
              </p>
            </div>
            <Shield className="h-12 w-12 text-status-online" />
          </div>
        </div>
      </div>

      {/* Firmware Versions */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-text-primary">Available Firmware Versions</h2>
        
        {/* Group by type */}
        {['IOS-XE', 'ASA', 'FTD'].map((type) => {
          const versions = firmware.filter(f => f.type === type)
          if (versions.length === 0) return null

          return (
            <div key={type} className="bg-bg-secondary border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">{type}</h3>
              <div className="space-y-3">
                {versions.map((fw) => (
                  <div
                    key={fw.id}
                    className="p-4 bg-bg-tertiary rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold text-text-primary">
                            Version {fw.version}
                          </span>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-semibold",
                            fw.supportStatus === 'current' && "bg-status-online",
                            fw.supportStatus === 'deprecated' && "bg-status-warning",
                            fw.supportStatus === 'eol' && "bg-status-critical text-white"
                          )}>
                            {fw.supportStatus.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">
                          Released: {fw.releaseDate.toLocaleDateString()}
                        </p>
                        
                        {fw.cvesFixed.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <Shield className="h-4 w-4 text-status-online" />
                            <span className="text-sm text-text-secondary">
                              Fixes: {fw.cvesFixed.join(', ')}
                            </span>
                          </div>
                        )}

                        {fw.knownIssues.length > 0 && (
                          <div className="mt-2 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-status-warning mt-0.5" />
                            <div className="text-sm text-status-warning">
                              <span className="font-semibold">Known Issues:</span>
                              <ul className="list-disc list-inside mt-1">
                                {fw.knownIssues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-text-secondary">Download Size:</span>
                            <span className="text-text-primary ml-2">{fw.downloadSize}</span>
                          </div>
                          <div>
                            <span className="text-text-secondary">Update Time:</span>
                            <span className="text-text-primary ml-2">~{fw.estimatedUpdateTime} min</span>
                          </div>
                        </div>
                      </div>

                      <button
                        className="btn-cisco flex items-center gap-2"
                        onClick={() => setDeployModalFirmware(fw)}
                      >
                        <Download className="h-4 w-4" />
                        Deploy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Firmware Update Workflows (mirrors createFirmwareUpdate, startFirmwareUpdate, cancelFirmwareUpdate) */}
      {(updateSnapshot.workflows?.length ?? 0) > 0 && (
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Update Workflows
          </h2>
          <p className="text-sm text-text-secondary mb-4">
            Pending workflows can be started; in-progress can be cancelled.
          </p>
          <div className="space-y-3">
            {updateSnapshot.workflows?.map((workflow) => (
              <div
                key={workflow.id}
                className="p-4 bg-bg-tertiary rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-text-secondary">{workflow.id}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-semibold',
                        workflow.status === 'pending' && 'bg-status-warning/20 text-status-warning',
                        workflow.status === 'in_progress' && 'bg-cisco-blue/20 text-cisco-blue',
                        workflow.status === 'complete' && 'bg-status-online/20 text-status-online',
                        workflow.status === 'failed' && 'bg-status-critical/20 text-status-critical'
                      )}
                    >
                      {workflow.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-text-primary mt-1">
                    {workflow.deviceIds.length} device(s) → {workflow.targetFirmware.type} {workflow.targetFirmware.version}
                  </p>
                  {workflow.status === 'in_progress' && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cisco-blue" />
                      <span className="text-xs text-text-secondary">{workflow.progress}%</span>
                      {workflow.steps?.find((s) => s.status === 'in_progress') && (
                        <span className="text-xs text-text-secondary">
                          — {workflow.steps.find((s) => s.status === 'in_progress')?.name}
                        </span>
                      )}
                    </div>
                  )}
                  {workflow.status === 'complete' && (
                    <div className="mt-1 flex items-center gap-1 text-status-online text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Complete</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {workflow.status === 'pending' && (
                    <button
                      className="btn-cisco flex items-center gap-1.5 text-sm px-3 py-1.5"
                      onClick={() => startUpdateWorkflow(workflow.id)}
                    >
                      <Play className="h-4 w-4" />
                      Start
                    </button>
                  )}
                  {(workflow.status === 'pending' || workflow.status === 'in_progress') && (
                    <button
                      className="px-3 py-1.5 text-sm text-text-secondary hover:text-status-critical hover:bg-status-critical/10 rounded-lg transition-colors"
                      onClick={() => cancelUpdateWorkflow(workflow.id)}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices Needing Updates */}
      {outdatedDevices.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Devices Requiring Updates ({outdatedDevices.length})
          </h2>
          <div className="space-y-2">
            {outdatedDevices.slice(0, 10).map((device) => (
              <div
                key={device.id}
                className="p-3 bg-bg-tertiary rounded-lg flex items-center justify-between"
              >
                <div>
                  <span className="text-text-primary font-medium">
                    <span className="font-mono text-cisco-blue">{device.deviceId}</span>
                  </span>
                  <span className="text-text-secondary text-sm ml-3">
                    <Link
                      to="/topology"
                      className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                    >
                      {device.hostname}
                    </Link>
                    {' · '}{device.model}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary text-sm">
                    Current: <span className="font-mono text-status-warning">{device.firmware.version}</span>
                  </span>
                  <button
                    className="btn-cisco text-sm px-3 py-1"
                    onClick={() => {
                      const latest = getLatestFirmware(device.firmware.type as 'IOS-XE' | 'ASA' | 'FTD')
                      if (latest) {
                        createUpdateWorkflow([device.id], latest)
                      }
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deploy modal (mirrors createFirmwareUpdate) */}
      {deployModalFirmware && (
        <DeployFirmwareModal
          open={!!deployModalFirmware}
          onClose={() => setDeployModalFirmware(null)}
          firmware={deployModalFirmware}
          compatibleDevices={getCompatibleDevices(deployModalFirmware)}
        />
      )}
    </div>
  )
}

export const Route = createFileRoute('/firmware')({
  component: FirmwarePage,
})
