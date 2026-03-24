/**
 * Status badge component
 */

import { cn } from '@/lib/utils'
import type { DeviceStatus } from '@/data/devices'

interface StatusBadgeProps {
  status: DeviceStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "px-2 py-1 rounded-md text-xs font-semibold",
        status === 'online' && "status-online",
        status === 'warning' && "status-warning",
        status === 'critical' && "status-critical",
        status === 'offline' && "status-offline",
        className
      )}
    >
      {status.toUpperCase()}
    </span>
  )
}
