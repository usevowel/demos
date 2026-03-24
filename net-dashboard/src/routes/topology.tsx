/**
 * Network topology visualization page with ReactFlow
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { generateTopologyNodes, generateTopologyEdges, getImpactRadius, type TopologyNodeData } from '@/data/topology'
import { getDeviceById, getUniqueBuildings, getUniqueFloors } from '@/data/devices'
import { getDeviceIdsWithEvents } from '@/data/events'
import { topologyStore, updateTopologyFilters, clearTopologyFilters } from '@/store/topologyStore'
import { deviceStore } from '@/store/deviceStore'
import { Network, Layers, Activity, Package, MapPin, Building2 } from 'lucide-react'
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { cn } from '@/lib/utils'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  Panel,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'

// Custom node components
function RouterNode({ data, selected }: { data: TopologyNodeData; selected?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className={cn(
      "px-4 py-2 rounded-lg border-2 transition-all relative",
      selected ? "border-cisco-blue shadow-lg shadow-cisco-blue/30" : "border-bg-tertiary",
      data.firmwareOutdated && "ring-2 ring-amber-500/80",
      "bg-bg-secondary"
    )}>
      {data.firmwareOutdated && (
        <div className="absolute -top-1.5 -right-1.5" title="Firmware update needed">
          <Package className="h-4 w-4 text-amber-500 fill-amber-500/30" />
        </div>
      )}
      <Handle type="target" position={Position.Top} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="source" position={Position.Right} />
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", getStatusColor(data.status))} />
        <span className="text-sm font-medium text-text-primary">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-text-secondary">
        CPU: {data.metrics.cpu}% | MEM: {data.metrics.memory}%
      </div>
    </div>
  )
}

function SwitchNode({ data, selected }: { data: TopologyNodeData; selected?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className={cn(
      "px-3 py-2 rounded-lg border-2 transition-all relative",
      selected ? "border-cisco-blue shadow-lg shadow-cisco-blue/30" : "border-bg-tertiary",
      data.firmwareOutdated && "ring-2 ring-amber-500/80",
      "bg-bg-secondary"
    )}>
      {data.firmwareOutdated && (
        <div className="absolute -top-1 -right-1" title="Firmware update needed">
          <Package className="h-3 w-3 text-amber-500 fill-amber-500/30" />
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-green-500 !border-2 !border-bg-primary !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !border-2 !border-bg-primary !w-2.5 !h-2.5" />
      <Handle type="target" position={Position.Left} className="!bg-green-500 !border-2 !border-bg-primary !w-2.5 !h-2.5" />
      <Handle type="source" position={Position.Right} className="!bg-green-500 !border-2 !border-bg-primary !w-2.5 !h-2.5" />
      <div className="flex items-center gap-2">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(data.status))} />
        <span className="text-xs font-medium text-text-primary truncate max-w-[100px]">
          {data.label.split('-').slice(-1)[0]}
        </span>
      </div>
    </div>
  )
}

function FirewallNode({ data, selected }: { data: TopologyNodeData; selected?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className={cn(
      "px-4 py-2 rounded-lg border-2 transition-all relative",
      selected ? "border-purple-500 shadow-lg shadow-purple-500/30" : "border-purple-500/50",
      data.firmwareOutdated && "ring-2 ring-amber-500/80",
      "bg-bg-secondary"
    )}>
      {data.firmwareOutdated && (
        <div className="absolute -top-1.5 -right-1.5" title="Firmware update needed">
          <Package className="h-4 w-4 text-amber-500 fill-amber-500/30" />
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !border-2 !border-bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !border-2 !border-bg-primary !w-3 !h-3" />
      <Handle type="target" position={Position.Left} className="!bg-purple-500 !border-2 !border-bg-primary !w-3 !h-3" />
      <Handle type="source" position={Position.Right} className="!bg-purple-500 !border-2 !border-bg-primary !w-3 !h-3" />
      <div className="flex items-center gap-2">
        <div className={cn("w-3 h-3 rounded-full", getStatusColor(data.status))} />
        <span className="text-sm font-medium text-text-primary">{data.label}</span>
      </div>
      <div className="mt-1 text-xs text-text-secondary">
        CPU: {data.metrics.cpu}%
      </div>
    </div>
  )
}

function APNode({ data, selected }: { data: TopologyNodeData; selected?: boolean }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      case 'offline': return 'bg-gray-500'
      default: return 'bg-green-500'
    }
  }

  return (
    <div className={cn(
      "px-2 py-1 rounded border-2 transition-all relative",
      selected ? "border-cisco-blue shadow-lg shadow-cisco-blue/30" : "border-bg-tertiary",
      data.firmwareOutdated && "ring-2 ring-amber-500/80",
      "bg-bg-secondary"
    )}>
      {data.firmwareOutdated && (
        <div className="absolute -top-1 -right-1" title="Firmware update needed">
          <Package className="h-2.5 w-2.5 text-amber-500 fill-amber-500/30" />
        </div>
      )}
      <Handle type="target" position={Position.Top} className="!bg-yellow-500 !border-2 !border-bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Bottom} className="!bg-yellow-500 !border-2 !border-bg-primary !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-yellow-500 !border-2 !border-bg-primary !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-yellow-500 !border-2 !border-bg-primary !w-2 !h-2" />
      <div className="flex items-center gap-1">
        <div className={cn("w-2 h-2 rounded-full", getStatusColor(data.status))} />
        <span className="text-xs text-text-primary">AP{data.label.split('-').slice(-1)[0]}</span>
      </div>
    </div>
  )
}

const nodeTypes = {
  routerNode: RouterNode,
  switchNode: SwitchNode,
  firewallNode: FirewallNode,
  apNode: APNode,
}

function TopologyPage() {
  const topologySnap = useSnapshot(topologyStore)
  const deviceSnap = useSnapshot(deviceStore)
  
  const initialNodes = useMemo(() => generateTopologyNodes(), [])
  const initialEdges = useMemo(() => generateTopologyEdges(), [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [layerFilter, setLayerFilter] = useState<string>('all')

  const selectedDevice = selectedNode ? getDeviceById(selectedNode) : null
  const impactRadius = selectedNode ? getImpactRadius(selectedNode) : null

  useEffect(() => {
    const updatedNodes = nodes.map(node => {
      const device = deviceSnap.devices.find(d => d.id === node.id)
      if (device) {
        return {
          ...node,
          data: {
            ...node.data,
            status: device.status,
            firmwareOutdated: device.firmware.outdated,
            metrics: {
              cpu: Math.round(device.metrics.cpu),
              memory: Math.round(device.metrics.memory),
              temperature: Math.round(device.metrics.temperature),
            },
          },
        }
      }
      return node
    })
    setNodes(updatedNodes)
  }, [deviceSnap.devices, setNodes])

  const deviceIdsWithEvents = useMemo(() => {
    if (topologySnap.filters.eventSeverity === undefined && topologySnap.filters.eventAcknowledged === undefined) {
      return null
    }
    return getDeviceIdsWithEvents(
      topologySnap.filters.eventSeverity,
      topologySnap.filters.eventAcknowledged
    )
  }, [topologySnap.filters.eventSeverity, topologySnap.filters.eventAcknowledged])

  const deviceIdsNeedingFirmware = useMemo(() => {
    return new Set(deviceSnap.devices.filter(d => d.firmware.outdated).map(d => d.id))
  }, [deviceSnap.devices])

  const filteredNodes = useMemo(() => {
    let result = nodes
    if (layerFilter !== 'all') {
      result = result.filter(n => n.data.layer === layerFilter)
    }
    if (deviceIdsWithEvents !== null) {
      result = result.filter(n => deviceIdsWithEvents.has(n.id))
    }
    if (topologySnap.filters.firmwareUpdateNeeded) {
      result = result.filter(n => deviceIdsNeedingFirmware.has(n.id))
    }
    if (topologySnap.filters.building || topologySnap.filters.floor !== undefined) {
      result = result.filter(n => {
        const device = getDeviceById(n.id)
        if (!device) return false
        if (topologySnap.filters.building && device.location.building !== topologySnap.filters.building) return false
        if (topologySnap.filters.floor !== undefined && device.location.floor !== topologySnap.filters.floor) return false
        return true
      })
    }
    return result
  }, [nodes, layerFilter, deviceIdsWithEvents, topologySnap.filters.firmwareUpdateNeeded, topologySnap.filters.building, topologySnap.filters.floor, deviceIdsNeedingFirmware])

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map(n => n.id))
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [edges, filteredNodes])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.id)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  const stats = useMemo(() => {
    return {
      edge: filteredNodes.filter(n => n.data.layer === 'edge').length,
      core: filteredNodes.filter(n => n.data.layer === 'core').length,
      distribution: filteredNodes.filter(n => n.data.layer === 'distribution').length,
      access: filteredNodes.filter(n => n.data.layer === 'access').length,
      totalEdges: filteredEdges.length,
      activeEdges: filteredEdges.filter(e => e.data?.status === 'up').length,
      degradedEdges: filteredEdges.filter(e => e.data?.status === 'degraded').length,
    }
  }, [filteredNodes, filteredEdges])

  return (
    <div className="p-6 space-y-6 h-[calc(100vh-80px)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Network className="h-8 w-8 text-cisco-blue" />
          Network Topology
        </h1>
        <p className="text-text-secondary mt-1">
          Interactive fabric visualization with real-time status
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Edge</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.edge}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Core</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.core}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Distribution</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.distribution}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Access</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.access}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Links</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalEdges}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Active</p>
          <p className="text-2xl font-bold text-status-online mt-1">{stats.activeEdges}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Degraded</p>
          <p className="text-2xl font-bold text-status-warning mt-1">{stats.degradedEdges}</p>
        </div>
      </div>

      {/* Layer Filter */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Layers className="h-5 w-5 text-text-secondary" />
          <div className="flex gap-2">
            {['all', 'edge', 'core', 'distribution', 'access'].map((layer) => (
              <button
                key={layer}
                onClick={() => setLayerFilter(layer)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  layerFilter === layer
                    ? "bg-cisco-blue text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {layer.charAt(0).toUpperCase() + layer.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Status Filter - devices with specific event type */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <Activity className="h-5 w-5 text-text-secondary" />
          <span className="text-sm text-text-secondary">Show devices with:</span>
          <div className="flex gap-2">
            {(['critical', 'warning', 'info', 'success'] as const).map((severity) => (
              <button
                key={severity}
                onClick={() =>
                  updateTopologyFilters({
                    eventSeverity: topologySnap.filters.eventSeverity === severity ? undefined : severity,
                  })
                }
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  topologySnap.filters.eventSeverity === severity
                    ? severity === 'critical'
                      ? "bg-status-critical text-white"
                      : severity === 'warning'
                        ? "bg-status-warning text-white"
                        : severity === 'info'
                          ? "bg-cisco-blue text-white"
                          : "bg-status-online text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {severity.charAt(0).toUpperCase() + severity.slice(1)} events
              </button>
            ))}
            <button
              onClick={() =>
                updateTopologyFilters({
                  eventAcknowledged:
                    topologySnap.filters.eventAcknowledged === false ? undefined : false,
                })
              }
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                topologySnap.filters.eventAcknowledged === false
                  ? "bg-status-warning text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              Unacknowledged
            </button>
            <button
              onClick={() =>
                updateTopologyFilters({
                  firmwareUpdateNeeded:
                    topologySnap.filters.firmwareUpdateNeeded ? undefined : true,
                })
              }
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5",
                topologySnap.filters.firmwareUpdateNeeded
                  ? "bg-amber-600 text-white"
                  : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
              )}
            >
              <Package className="h-4 w-4" />
              Needs firmware update
              {deviceIdsNeedingFirmware.size > 0 && (
                <span className={cn(
                  "ml-1 px-1.5 py-0.5 rounded text-xs font-medium",
                  topologySnap.filters.firmwareUpdateNeeded ? "bg-amber-500/50" : "bg-bg-primary"
                )}>
                  {deviceIdsNeedingFirmware.size}
                </span>
              )}
            </button>
          </div>
          {(topologySnap.filters.eventSeverity !== undefined ||
            topologySnap.filters.eventAcknowledged !== undefined ||
            topologySnap.filters.firmwareUpdateNeeded) && (
            <button
              onClick={clearTopologyFilters}
              className="text-sm text-cisco-blue hover:text-cisco-blue-light"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Location filters - Building and Floor */}
      <div className="bg-bg-secondary border border-border rounded-lg p-4">
        <div className="flex flex-wrap items-center gap-4">
          <MapPin className="h-5 w-5 text-cisco-blue" />
          <span className="text-sm text-text-secondary">Location:</span>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-text-secondary" />
            <select
              value={topologySnap.filters.building || ''}
              onChange={(e) =>
                updateTopologyFilters({
                  building: e.target.value || undefined,
                  floor: e.target.value ? topologySnap.filters.floor : undefined,
                })
              }
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Buildings</option>
              {getUniqueBuildings().map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-text-secondary" />
            <select
              value={topologySnap.filters.floor ?? ''}
              onChange={(e) => {
                const val = e.target.value
                updateTopologyFilters({
                  floor: val === '' ? undefined : parseInt(val, 10),
                })
              }}
              className="px-3 py-2 bg-bg-tertiary border border-border rounded-lg text-sm text-text-primary focus:outline-none focus:border-cisco-blue"
            >
              <option value="">All Floors</option>
              {getUniqueFloors().map((f) => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>
          {(topologySnap.filters.building || topologySnap.filters.floor !== undefined) && (
            <button
              onClick={() => updateTopologyFilters({ building: undefined, floor: undefined })}
              className="text-sm text-cisco-blue hover:text-cisco-blue-light"
            >
              Clear location
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Topology Visualization */}
        <div className="lg:col-span-3 bg-bg-secondary border border-border rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <ReactFlow
            nodes={filteredNodes}
            edges={filteredEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
            className="bg-bg-primary"
          >
            <Background color="#2A4A6C" gap={16} />
            <Controls className="bg-bg-secondary border-border" />
            <MiniMap 
              className="bg-bg-secondary border border-border rounded-lg"
              nodeColor={(node) => {
                switch (node.data?.layer) {
                  case 'edge': return '#8B5CF6'
                  case 'core': return '#049FD9'
                  case 'distribution': return '#22C55E'
                  case 'access': return '#EAB308'
                  default: return '#049FD9'
                }
              }}
              maskColor="rgba(13, 39, 77, 0.8)"
            />
            <Panel position="top-right" className="bg-bg-secondary/90 border border-border rounded-lg p-3 m-2">
              <div className="text-xs text-text-secondary space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span>Edge/Firewall</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cisco-blue" />
                  <span>Core Router</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span>Distribution</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <span>Access/AP</span>
                </div>
                <div className="flex items-center gap-2 pt-1 mt-1 border-t border-border">
                  <Package className="h-3 w-3 text-amber-500" />
                  <span>Firmware update needed</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Device Info Panel */}
        <div className="bg-bg-secondary border border-border rounded-lg p-6 overflow-y-auto" style={{ maxHeight: '600px' }}>
          <h2 className="text-xl font-semibold text-text-primary mb-4">Device Info</h2>
          
          {selectedDevice ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-text-primary">
                  <span className="font-mono text-cisco-blue">{selectedDevice.deviceId}</span>
                </h3>
                <p className="text-sm text-text-secondary"><span className="font-semibold text-text-primary">{selectedDevice.hostname}</span> · {selectedDevice.model}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-text-secondary">Type:</span>
                  <p className="text-text-primary capitalize">{selectedDevice.type.replace('-', ' ')}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Status:</span>
                  <p className={cn(
                    "font-semibold",
                    selectedDevice.status === 'online' && "text-status-online",
                    selectedDevice.status === 'offline' && "text-status-critical",
                    selectedDevice.status === 'warning' && "text-status-warning"
                  )}>
                    {selectedDevice.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary">Location:</span>
                  <p className="text-text-primary">
                    {selectedDevice.location.building}, Floor {selectedDevice.location.floor}
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary">IP Address:</span>
                  <p className="text-text-primary font-mono">{selectedDevice.ipAddress}</p>
                </div>
                <div>
                  <span className="text-text-secondary">Uptime:</span>
                  <p className="text-text-primary">{selectedDevice.uptime}h</p>
                </div>
                <div>
                  <span className="text-text-secondary">Ports:</span>
                  <p className="text-text-primary">
                    {selectedDevice.ports.up}/{selectedDevice.ports.total} up
                  </p>
                </div>
                <div>
                  <span className="text-text-secondary">Firmware:</span>
                  <p className={cn(
                    "font-mono text-sm",
                    selectedDevice.firmware.outdated ? "text-status-warning" : "text-text-primary"
                  )}>
                    {selectedDevice.firmware.type} {selectedDevice.firmware.version}
                    {selectedDevice.firmware.outdated && (
                      <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <Package className="h-3 w-3" />
                        Update needed
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {impactRadius && impactRadius.count > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-status-warning mb-2">Impact Analysis</h4>
                  <p className="text-sm text-text-secondary">
                    Taking this device offline would affect <span className="font-bold text-status-warning">{impactRadius.count}</span> downstream device(s).
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <Link
                  to="/devices/$deviceId"
                  params={{ deviceId: selectedDevice.id }}
                  className="flex-1 px-4 py-2 bg-cisco-blue text-white text-center rounded-lg hover:bg-cisco-blue-dark transition-colors"
                >
                  View Details
                </Link>
                {selectedDevice.firmware.outdated && (
                  <Link
                    to="/firmware"
                    className="flex-1 px-4 py-2 bg-amber-600 text-white text-center rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Package className="h-4 w-4" />
                    Update Firmware
                  </Link>
                )}
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="w-full px-4 py-2 bg-bg-tertiary text-text-primary rounded-lg hover:bg-bg-primary transition-colors"
              >
                Clear Selection
              </button>
            </div>
          ) : (
            <p className="text-text-secondary text-sm">
              Click on a device in the topology to view details and impact analysis
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/topology')({
  component: TopologyPage,
})
