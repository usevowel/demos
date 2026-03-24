/**
 * Persistent toast at the top of the screen showing firmware update progress.
 * Displays when there are firmware update workflows queued or in progress.
 * Stays until the update completes or the user clicks to dismiss.
 */

import { useState, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { Link } from '@tanstack/react-router'
import { Loader2, X, Package } from 'lucide-react'
import {
  updateStore,
  cancelUpdateWorkflow,
  startUpdateWorkflow,
} from '@/store/updateStore'

export function FirmwareUpdateToast() {
  const updateSnapshot = useSnapshot(updateStore)
  const [dismissed, setDismissed] = useState(false)

  /** Workflows that are outstanding (pending or in progress), in-progress first */
  const outstanding = (updateSnapshot.workflows ?? [])
    .filter((w) => w.status === 'pending' || w.status === 'in_progress')
    .sort((a, b) =>
      a.status === 'in_progress' && b.status !== 'in_progress'
        ? -1
        : a.status !== 'in_progress' && b.status === 'in_progress'
          ? 1
          : 0
    )

  // Reset dismissed when there are no outstanding workflows (so we show again on next batch)
  useEffect(() => {
    if (outstanding.length === 0) {
      setDismissed(false)
    }
  }, [outstanding.length])

  if (outstanding.length === 0 || dismissed) {
    return null
  }

  const activeWorkflow = outstanding.find((w) => w.status === 'in_progress')
  const pendingCount = outstanding.filter((w) => w.status === 'pending').length

  return (
    <div
      className="fixed top-16 left-0 right-0 z-[90] flex justify-center pt-2 px-4 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className="pointer-events-auto flex items-center gap-4 px-4 py-3 bg-bg-secondary border border-border rounded-lg shadow-lg max-w-2xl w-full group"
        role="status"
      >
        {/* Icon and main content */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {activeWorkflow ? (
            <Loader2 className="h-5 w-5 text-cisco-blue animate-spin shrink-0" aria-hidden />
          ) : (
            <Package className="h-5 w-5 text-status-warning shrink-0" aria-hidden />
          )}
          <div className="flex-1 min-w-0">
            {activeWorkflow ? (
              <>
                <p className="text-sm font-medium text-text-primary truncate">
                  Firmware update in progress — {activeWorkflow.deviceIds.length} device(s) →{' '}
                  {activeWorkflow.targetFirmware.type} {activeWorkflow.targetFirmware.version}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cisco-blue rounded-full transition-all duration-300"
                      style={{ width: `${activeWorkflow.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-text-secondary shrink-0 w-10">
                    {activeWorkflow.progress}%
                  </span>
                </div>
                {activeWorkflow.steps?.find((s) => s.status === 'in_progress') && (
                  <p className="text-xs text-text-secondary mt-1 truncate">
                    {activeWorkflow.steps.find((s) => s.status === 'in_progress')?.name}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm font-medium text-text-primary">
                {pendingCount === 1 ? (
                  <>1 firmware update workflow queued</>
                ) : (
                  <>{pendingCount} firmware update workflows queued</>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {activeWorkflow && (
            <button
              onClick={() => cancelUpdateWorkflow(activeWorkflow.id)}
              className="px-2 py-1 text-xs text-text-secondary hover:text-status-critical hover:bg-status-critical/10 rounded transition-colors"
            >
              Cancel
            </button>
          )}
          {pendingCount > 0 && !activeWorkflow && (
            <button
              onClick={() => startUpdateWorkflow(outstanding[0].id)}
              className="px-2 py-1 text-xs btn-cisco rounded"
            >
              Start
            </button>
          )}
          <Link
            to="/firmware"
            className="px-2 py-1 text-xs text-cisco-blue hover:underline"
          >
            View
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-tertiary rounded transition-colors"
            aria-label="Dismiss firmware update notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
