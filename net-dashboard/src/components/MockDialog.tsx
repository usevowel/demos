/**
 * Mock dialog component with progress bar that times out after a few seconds
 */

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MockDialogProps {
  /** Whether the dialog is open */
  open: boolean
  /** Callback when dialog should close */
  onClose: () => void
  /** Dialog title */
  title?: string
  /** Dialog content */
  children?: React.ReactNode
  /** Timeout duration in milliseconds (default: 3000) */
  timeoutMs?: number
  /** Show progress bar (default: true) */
  showProgress?: boolean
}

/**
 * Mock dialog with progress bar that automatically closes after timeout
 */
export function MockDialog({
  open,
  onClose,
  title = 'Processing...',
  children,
  timeoutMs = 3000,
  showProgress = true,
}: MockDialogProps) {
  const [progress, setProgress] = useState(0)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (!open) {
      setProgress(0)
      setIsClosing(false)
      return
    }

    // Reset progress when dialog opens
    setProgress(0)
    setIsClosing(false)

    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / (timeoutMs / 50)) // Update every 50ms
        return Math.min(newProgress, 100)
      })
    }, 50)

    // Close dialog after timeout
    const timeoutId = setTimeout(() => {
      setIsClosing(true)
      setTimeout(() => {
        onClose()
      }, 200) // Small delay for closing animation
    }, timeoutMs)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(timeoutId)
    }
  }, [open, timeoutMs, onClose])

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm transition-opacity',
        isClosing ? 'opacity-0' : 'opacity-100'
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        className={cn(
          'bg-bg-secondary border border-border rounded-lg shadow-xl',
          'w-full max-w-md mx-4 p-6',
          'transform transition-all',
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        {children && (
          <div className="mb-4 text-text-secondary">{children}</div>
        )}

        {/* Progress bar */}
        {showProgress && (
          <div className="space-y-2">
            <div className="w-full bg-bg-tertiary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-cisco-blue transition-all duration-50 ease-linear rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-bg-tertiary hover:bg-bg-primary text-text-primary rounded-lg transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
