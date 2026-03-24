/**
 * Events timeline page - real-time event stream
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { 
  type EventSeverity, 
  type EventCategory 
} from '@/data/events'
import { Activity, CheckCircle2, AlertCircle, Info, XCircle, Filter } from 'lucide-react'
import { useSnapshot } from 'valtio'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { 
  eventStore, 
  getFilteredEvents, 
  getEventStats, 
  updateFilters, 
  clearFilters, 
  selectEvent, 
  getSelectedEvent 
} from '@/store/eventStore'
import { getDeviceById } from '@/data/devices'

const severityConfig: Record<EventSeverity, { icon: React.ElementType; color: string; bg: string }> = {
  critical: { icon: XCircle, color: 'text-status-critical', bg: 'bg-status-critical/10' },
  warning: { icon: AlertCircle, color: 'text-status-warning', bg: 'bg-status-warning/10' },
  info: { icon: Info, color: 'text-cisco-blue', bg: 'bg-cisco-blue/10' },
  success: { icon: CheckCircle2, color: 'text-status-online', bg: 'bg-status-online/10' },
}

const categoryLabels: Record<EventCategory, string> = {
  device: 'Device',
  alert: 'Alert',
  config: 'Configuration',
  security: 'Security',
  system: 'System',
}

function EventsPage() {
  const snap = useSnapshot(eventStore)
  const filteredEvents = getFilteredEvents()
  const stats = getEventStats()
  const selectedEvent = getSelectedEvent()
  
  const severityFilter = snap.filters.severity || 'all'
  const categoryFilter = snap.filters.category || 'all'
  const acknowledgedFilter = snap.filters.acknowledged || 'all'

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Activity className="h-8 w-8 text-cisco-blue" />
          Events Timeline
        </h1>
        <p className="text-text-secondary mt-1">
          Real-time event stream and operational history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <button
          onClick={() => clearFilters()}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-cisco-blue/50 hover:bg-bg-tertiary cursor-pointer",
            severityFilter === 'all' && categoryFilter === 'all' && acknowledgedFilter === 'all'
              ? "border-cisco-blue"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Total Events</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
        </button>
        <button
          onClick={() => updateFilters({ severity: 'critical' })}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-status-critical/50 hover:bg-bg-tertiary cursor-pointer",
            severityFilter === 'critical'
              ? "border-status-critical"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Critical</p>
          <p className="text-2xl font-bold text-status-critical mt-1">{stats.critical}</p>
        </button>
        <button
          onClick={() => updateFilters({ severity: 'warning' })}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-status-warning/50 hover:bg-bg-tertiary cursor-pointer",
            severityFilter === 'warning'
              ? "border-status-warning"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Warnings</p>
          <p className="text-2xl font-bold text-status-warning mt-1">{stats.warning}</p>
        </button>
        <button
          onClick={() => updateFilters({ severity: 'info' })}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-cisco-blue/50 hover:bg-bg-tertiary cursor-pointer",
            severityFilter === 'info'
              ? "border-cisco-blue"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Info</p>
          <p className="text-2xl font-bold text-cisco-blue mt-1">{stats.info}</p>
        </button>
        <button
          onClick={() => updateFilters({ severity: 'success' })}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-status-online/50 hover:bg-bg-tertiary cursor-pointer",
            severityFilter === 'success'
              ? "border-status-online"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Success</p>
          <p className="text-2xl font-bold text-status-online mt-1">{stats.success}</p>
        </button>
        <button
          onClick={() => updateFilters({ acknowledged: 'unacknowledged', severity: 'all' })}
          className={cn(
            "bg-bg-secondary border rounded-lg p-4 text-left transition-all hover:border-status-warning/50 hover:bg-bg-tertiary cursor-pointer",
            acknowledgedFilter === 'unacknowledged'
              ? "border-status-warning"
              : "border-border"
          )}
        >
          <p className="text-text-secondary text-sm">Unacknowledged</p>
          <p className="text-2xl font-bold text-status-warning mt-1">{stats.unacknowledged}</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-5 w-5 text-text-secondary" />
          <span className="text-sm font-medium text-text-primary">Filters</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => updateFilters({ severity: e.target.value as EventSeverity | 'all' })}
              className="bg-bg-tertiary border border-border rounded px-3 py-1 text-sm text-text-primary"
            >
              <option value="all">All</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="success">Success</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => updateFilters({ category: e.target.value as EventCategory | 'all' })}
              className="bg-bg-tertiary border border-border rounded px-3 py-1 text-sm text-text-primary"
            >
              <option value="all">All</option>
              <option value="device">Device</option>
              <option value="alert">Alert</option>
              <option value="config">Configuration</option>
              <option value="security">Security</option>
              <option value="system">System</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Status:</span>
            <select
              value={acknowledgedFilter}
              onChange={(e) => updateFilters({ acknowledged: e.target.value as 'all' | 'acknowledged' | 'unacknowledged' })}
              className="bg-bg-tertiary border border-border rounded px-3 py-1 text-sm text-text-primary"
            >
              <option value="all">All</option>
              <option value="unacknowledged">Unacknowledged</option>
              <option value="acknowledged">Acknowledged</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xl font-semibold text-text-primary">
            Events ({filteredEvents.length})
          </h2>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredEvents.map((event) => {
              const config = severityConfig[event.severity]
              const Icon = config.icon
              
              return (
                <button
                  key={event.id}
                  onClick={() => selectEvent(event.id)}
                  className={cn(
                    "w-full text-left p-4 rounded-lg border transition-all",
                    selectedEvent?.id === event.id
                      ? "bg-cisco-blue/10 border-cisco-blue"
                      : "bg-bg-secondary border-border hover:border-cisco-blue/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg", config.bg)}>
                      <Icon className={cn("h-5 w-5", config.color)} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-text-primary truncate">
                          {event.title}
                        </h3>
                        <span className="text-xs text-text-secondary whitespace-nowrap">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                        {event.description}
                      </p>
                      
                      <div className="mt-2 flex items-center gap-3 text-xs">
                        <span className={cn(
                          "px-2 py-0.5 rounded",
                          config.bg,
                          config.color
                        )}>
                          {event.severity}
                        </span>
                        <span className="text-text-secondary">
                          {categoryLabels[event.category]}
                        </span>
                        <span className="text-text-secondary">
                          {event.source}
                        </span>
                        {event.acknowledged && (
                          <span className="text-status-online">Acknowledged</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Event Details */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          {selectedEvent ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {(() => {
                  const config = severityConfig[selectedEvent.severity]
                  const Icon = config.icon
                  return (
                    <>
                      <div className={cn("p-3 rounded-lg", config.bg)}>
                        <Icon className={cn("h-6 w-6", config.color)} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                          {selectedEvent.title}
                        </h3>
                        <p className={cn("text-sm", config.color)}>
                          {selectedEvent.severity.toUpperCase()}
                        </p>
                      </div>
                    </>
                  )
                })()}
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-text-secondary">Description:</span>
                  <p className="text-text-primary mt-1">{selectedEvent.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-secondary">Category:</span>
                    <p className="text-text-primary">{categoryLabels[selectedEvent.category]}</p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Source:</span>
                    <p className="text-text-primary">{selectedEvent.source}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-text-secondary">Time:</span>
                    <p className="text-text-primary">
                      {selectedEvent.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-text-secondary">Status:</span>
                    <p className={cn(
                      selectedEvent.acknowledged ? "text-status-online" : "text-status-warning"
                    )}>
                      {selectedEvent.acknowledged ? 'Acknowledged' : 'Unacknowledged'}
                    </p>
                  </div>
                </div>

                {selectedEvent.user && (
                  <div>
                    <span className="text-text-secondary">User:</span>
                    <p className="text-text-primary">{selectedEvent.user}</p>
                  </div>
                )}

                {selectedEvent.deviceId && (
                  <div>
                    <span className="text-text-secondary">Device:</span>
                    {(() => {
                      const device = getDeviceById(selectedEvent.deviceId)
                      return device ? (
                        <>
                          <p className="text-text-primary font-mono mt-1 font-semibold">{device.deviceId}</p>
                          <p className="text-xs text-text-secondary mt-0.5">
                            <Link
                              to="/topology"
                              className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                            >
                              {device.hostname}
                            </Link>
                          </p>
                        </>
                      ) : (
                        <p className="text-text-primary font-mono mt-1">{selectedEvent.deviceId}</p>
                      )
                    })()}
                  </div>
                )}

                {selectedEvent.relatedEvents && selectedEvent.relatedEvents.length > 0 && (
                  <div>
                    <span className="text-text-secondary">Related Events:</span>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {selectedEvent.relatedEvents.map((relId) => (
                        <span key={relId} className="text-xs bg-bg-tertiary px-2 py-1 rounded text-text-secondary">
                          {relId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => selectEvent(undefined)}
                className="w-full mt-4 px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-primary transition-colors"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Select an Event</h3>
              <p className="text-text-secondary mt-2">
                Click on an event from the timeline to view detailed information
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/events/')({
  component: EventsPage,
})
