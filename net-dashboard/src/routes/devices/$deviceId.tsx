/**
 * Device detail page
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getDeviceById } from '@/data/devices'
import { getEventsForDevice } from '@/data/events'
import { StatusBadge } from '@/components/StatusBadge'
import { ArrowLeft, Server, Cpu, HardDrive, Thermometer, MapPin, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

function DeviceDetailPage() {
  const { deviceId } = Route.useParams()
  const navigate = useNavigate()
  const device = getDeviceById(deviceId)
  const deviceEvents = getEventsForDevice(deviceId)

  if (!device) {
    return (
      <div className="p-6">
        <p className="text-text-secondary">Device not found</p>
      </div>
    )
  }

  // Generate port status (mock)
  const ports = Array.from({ length: device.ports.total }, (_, i) => {
    const portNumber = i + 1
    let status: 'up' | 'down' | 'disabled'
    
    if (portNumber <= device.ports.up) {
      status = 'up'
    } else if (portNumber <= device.ports.up + device.ports.down) {
      status = 'down'
    } else {
      status = 'disabled'
    }
    
    return { number: portNumber, status }
  })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate({ to: '/devices' })}
          className="flex items-center gap-2 text-cisco-blue hover:text-cisco-blue-light mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to devices
        </button>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Server className="h-12 w-12 text-cisco-blue" />
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                <span className="font-mono text-text-primary">{device.deviceId}</span>
              </h1>
              <p className="text-text-secondary mt-1">
                <Link
                  to="/topology"
                  className="font-semibold text-text-primary hover:text-cisco-blue hover:underline"
                >
                  {device.hostname}
                </Link>
                {' · '}{device.model}
              </p>
            </div>
          </div>
          <StatusBadge status={device.status} />
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connection Info */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Connection</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-text-secondary">Device ID:</span>
              <p className="text-text-primary font-mono mt-1">{device.deviceId}</p>
            </div>
            <div>
              <span className="text-text-secondary">Hostname:</span>
              <p className="mt-1">
                <Link
                  to="/topology"
                  className="font-semibold font-mono text-text-primary hover:text-cisco-blue hover:underline"
                >
                  {device.hostname}
                </Link>
              </p>
            </div>
            <div>
              <span className="text-text-secondary">IP Address:</span>
              <p className="text-text-primary font-mono mt-1">{device.ipAddress}</p>
            </div>
            <div>
              <span className="text-text-secondary">MAC Address:</span>
              <p className="text-text-primary font-mono mt-1">{device.macAddress}</p>
            </div>
            <div>
              <span className="text-text-secondary">Last Seen:</span>
              <p className="text-text-primary mt-1">
                {new Date(device.lastSeen).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-text-secondary">Uptime:</span>
              <p className="text-text-primary mt-1">{(device.uptime / 24).toFixed(1)} days</p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-text-secondary">Building:</span>
              <p className="text-text-primary mt-1">{device.location.building}</p>
            </div>
            <div>
              <span className="text-text-secondary">Floor:</span>
              <p className="text-text-primary mt-1">Floor {device.location.floor}</p>
            </div>
            {device.location.rack && (
              <div>
                <span className="text-text-secondary">Rack:</span>
                <p className="text-text-primary mt-1">{device.location.rack}</p>
              </div>
            )}
          </div>
        </div>

        {/* Firmware Info */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Firmware</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-text-secondary">Type:</span>
              <p className="text-text-primary mt-1">{device.firmware.type}</p>
            </div>
            <div>
              <span className="text-text-secondary">Version:</span>
              <p className={cn(
                "mt-1",
                device.firmware.outdated ? "text-status-warning font-semibold" : "text-text-primary"
              )}>
                {device.firmware.version}
              </p>
            </div>
            {device.firmware.outdated && (
              <div className="mt-4">
                <Link
                  to="/firmware"
                  className="btn-cisco text-sm inline-block"
                >
                  Update Available
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold text-text-primary mb-4">Current Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">CPU Usage</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{device.metrics.cpu.toFixed(1)}%</span>
            </div>
            <div className="mt-2 bg-bg-tertiary rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  device.metrics.cpu > 80 ? "bg-status-critical" :
                  device.metrics.cpu > 60 ? "bg-status-warning" : "bg-cisco-blue"
                )}
                style={{ width: `${device.metrics.cpu}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <HardDrive className="h-4 w-4" />
              <span className="text-sm">Memory Usage</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{device.metrics.memory.toFixed(1)}%</span>
            </div>
            <div className="mt-2 bg-bg-tertiary rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  device.metrics.memory > 80 ? "bg-status-critical" :
                  device.metrics.memory > 60 ? "bg-status-warning" : "bg-cisco-blue"
                )}
                style={{ width: `${device.metrics.memory}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-text-secondary mb-2">
              <Thermometer className="h-4 w-4" />
              <span className="text-sm">Temperature</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">{device.metrics.temperature.toFixed(0)}°C</span>
            </div>
            <div className="mt-2 bg-bg-tertiary rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all",
                  device.metrics.temperature > 65 ? "bg-status-critical" :
                  device.metrics.temperature > 55 ? "bg-status-warning" : "bg-cisco-blue"
                )}
                style={{ width: `${(device.metrics.temperature / 80) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Port Map */}
      {device.ports.total > 0 && (
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Network className="h-5 w-5" />
            Port Status ({device.ports.up} up / {device.ports.down} down / {device.ports.disabled} disabled)
          </h2>
          <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2">
            {ports.map((port) => (
              <div
                key={port.number}
                className={cn(
                  "aspect-square rounded flex items-center justify-center text-xs font-semibold",
                  port.status === 'up' && "bg-status-online",
                  port.status === 'down' && "bg-status-critical text-white",
                  port.status === 'disabled' && "bg-gray-600 text-gray-400"
                )}
                title={`Port ${port.number}: ${port.status}`}
              >
                {port.number}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Events */}
      {deviceEvents.length > 0 && (
        <div className="bg-bg-secondary border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Related Events</h2>
          <div className="space-y-2">
            {deviceEvents.slice(0, 5).map((event) => (
              <Link
                key={event.id}
                to="/events"
                className="block p-3 bg-bg-tertiary rounded-lg hover:border-cisco-blue border border-transparent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-text-primary">{event.title}</span>
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-semibold",
                    event.severity === 'critical' && "bg-status-critical text-white",
                    event.severity === 'warning' && "bg-status-warning",
                    event.severity === 'info' && "bg-status-info text-white",
                    event.severity === 'success' && "bg-status-online text-white"
                  )}>
                    {event.severity.toUpperCase()}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/devices/$deviceId')({
  component: DeviceDetailPage,
})
