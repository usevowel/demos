/**
 * Mock data for network topology - ReactFlow compatible
 */

import type { Node, Edge } from 'reactflow'
import { getDeviceById } from '@/data/devices'

export interface TopologyNodeData {
  label: string
  type: 'router' | 'switch' | 'access-point' | 'firewall'
  layer: 'core' | 'distribution' | 'access' | 'edge'
  status: 'online' | 'offline' | 'warning' | 'critical'
  /** Whether this device has outdated firmware and needs an update */
  firmwareOutdated?: boolean
  metrics: {
    cpu: number
    memory: number
    temperature: number
  }
}

export interface TopologyEdgeData {
  bandwidth: string
  utilization: number
  status: 'up' | 'down' | 'degraded'
}

// Generate ReactFlow compatible nodes
export function generateTopologyNodes(): Node<TopologyNodeData>[] {
  const nodes: Node<TopologyNodeData>[] = []
  
  // Edge layer - firewalls (top)
  nodes.push(
    {
      id: 'firewall-01',
      type: 'firewallNode',
      position: { x: 200, y: 50 },
      data: {
        label: getDeviceById('firewall-01')?.deviceId ?? 'firewall-01',
        type: 'firewall',
        layer: 'edge',
        status: 'online',
        firmwareOutdated: getDeviceById('firewall-01')?.firmware.outdated ?? false,
        metrics: { cpu: 45, memory: 58, temperature: 55 }
      }
    },
    {
      id: 'firewall-02',
      type: 'firewallNode',
      position: { x: 500, y: 50 },
      data: {
        label: getDeviceById('firewall-02')?.deviceId ?? 'firewall-02',
        type: 'firewall',
        layer: 'edge',
        status: 'critical',
        firmwareOutdated: getDeviceById('firewall-02')?.firmware.outdated ?? false,
        metrics: { cpu: 85, memory: 92, temperature: 68 }
      }
    },
    {
      id: 'firewall-03',
      type: 'firewallNode',
      position: { x: 800, y: 50 },
      data: {
        label: getDeviceById('firewall-03')?.deviceId ?? 'firewall-03',
        type: 'firewall',
        layer: 'edge',
        status: 'online',
        firmwareOutdated: getDeviceById('firewall-03')?.firmware.outdated ?? false,
        metrics: { cpu: 38, memory: 52, temperature: 48 }
      }
    }
  )

  // Core layer - routers
  nodes.push(
    {
      id: 'router-core-01',
      type: 'routerNode',
      position: { x: 100, y: 200 },
      data: {
        label: getDeviceById('router-core-01')?.deviceId ?? 'router-core-01',
        type: 'router',
        layer: 'core',
        status: 'online',
        firmwareOutdated: getDeviceById('router-core-01')?.firmware.outdated ?? false,
        metrics: { cpu: 35, memory: 42, temperature: 48 }
      }
    },
    {
      id: 'router-core-02',
      type: 'routerNode',
      position: { x: 300, y: 200 },
      data: {
        label: getDeviceById('router-core-02')?.deviceId ?? 'router-core-02',
        type: 'router',
        layer: 'core',
        status: 'online',
        firmwareOutdated: getDeviceById('router-core-02')?.firmware.outdated ?? false,
        metrics: { cpu: 38, memory: 45, temperature: 50 }
      }
    },
    {
      id: 'router-core-03',
      type: 'routerNode',
      position: { x: 500, y: 200 },
      data: {
        label: getDeviceById('router-core-03')?.deviceId ?? 'router-core-03',
        type: 'router',
        layer: 'core',
        status: 'warning',
        firmwareOutdated: getDeviceById('router-core-03')?.firmware.outdated ?? false,
        metrics: { cpu: 55, memory: 68, temperature: 58 }
      }
    },
    {
      id: 'router-core-04',
      type: 'routerNode',
      position: { x: 700, y: 200 },
      data: {
        label: getDeviceById('router-core-04')?.deviceId ?? 'router-core-04',
        type: 'router',
        layer: 'core',
        status: 'online',
        firmwareOutdated: getDeviceById('router-core-04')?.firmware.outdated ?? false,
        metrics: { cpu: 42, memory: 51, temperature: 52 }
      }
    },
    {
      id: 'router-core-05',
      type: 'routerNode',
      position: { x: 900, y: 200 },
      data: {
        label: getDeviceById('router-core-05')?.deviceId ?? 'router-core-05',
        type: 'router',
        layer: 'core',
        status: 'online',
        firmwareOutdated: getDeviceById('router-core-05')?.firmware.outdated ?? false,
        metrics: { cpu: 28, memory: 38, temperature: 45 }
      }
    }
  )

  // Distribution layer - switches
  for (let i = 0; i < 12; i++) {
    const id = `switch-dist-${String(i + 1).padStart(2, '0')}`
    const col = i % 4
    const row = Math.floor(i / 4)
    const device = getDeviceById(id)
    const isOutdated = device?.firmware.outdated ?? (i === 3 || i === 7)
    
    nodes.push({
      id,
      type: 'switchNode',
      position: { x: 100 + col * 220, y: 380 + row * 120 },
      data: {
        label: device?.deviceId ?? id,
        type: 'switch',
        layer: 'distribution',
        status: isOutdated ? 'warning' : 'online',
        firmwareOutdated: device?.firmware.outdated ?? false,
        metrics: {
          cpu: 25 + (i * 3),
          memory: 40 + (i * 2),
          temperature: 42 + i
        }
      }
    })
  }

  // Access layer - switches (30 to match devices.ts)
  for (let i = 0; i < 30; i++) {
    const id = `switch-access-${String(i + 1).padStart(2, '0')}`
    const col = i % 6
    const row = Math.floor(i / 6)
    const device = getDeviceById(id)
    // Derive status from device data; fallback to online
    const status = device?.status ?? 'online'
    
    nodes.push({
      id,
      type: 'switchNode',
      position: { x: 50 + col * 180, y: 550 + row * 80 },
      data: {
        label: device?.deviceId ?? id,
        type: 'switch',
        layer: 'access',
        status,
        firmwareOutdated: device?.firmware.outdated ?? false,
        metrics: {
          cpu: device?.metrics.cpu ?? 15 + (i % 20),
          memory: device?.metrics.memory ?? 30 + (i % 15),
          temperature: device?.metrics.temperature ?? 38 + (i % 10)
        }
      }
    })
  }

  // Wireless APs (8 to match devices.ts)
  for (let i = 0; i < 8; i++) {
    const id = `ap-wireless-${String(i + 1).padStart(2, '0')}`
    const device = getDeviceById(id)
    const col = i % 4
    const row = Math.floor(i / 4)
    nodes.push({
      id,
      type: 'apNode',
      position: { x: 100 + col * 220, y: 850 + row * 60 },
      data: {
        label: device?.deviceId ?? id,
        type: 'access-point',
        layer: 'access',
        status: device?.status ?? 'online',
        firmwareOutdated: device?.firmware.outdated ?? false,
        metrics: {
          cpu: device?.metrics.cpu ?? 20 + i * 2,
          memory: device?.metrics.memory ?? 35 + i * 3,
          temperature: device?.metrics.temperature ?? 40 + i
        }
      }
    })
  }

  return nodes
}

// Generate ReactFlow compatible edges
export function generateTopologyEdges(): Edge<TopologyEdgeData>[] {
  const edges: Edge<TopologyEdgeData>[] = []

  // Firewall to Core connections
  edges.push(
    {
      id: 'fw01-r01',
      source: 'firewall-01',
      target: 'router-core-01',
      type: 'smoothstep',
      animated: true,
      data: { bandwidth: '10 Gbps', utilization: 35, status: 'up' }
    },
    {
      id: 'fw02-r03',
      source: 'firewall-02',
      target: 'router-core-03',
      type: 'smoothstep',
      animated: true,
      data: { bandwidth: '10 Gbps', utilization: 82, status: 'degraded' }
    },
    {
      id: 'fw03-r05',
      source: 'firewall-03',
      target: 'router-core-05',
      type: 'smoothstep',
      animated: true,
      data: { bandwidth: '10 Gbps', utilization: 28, status: 'up' }
    }
  )

  // Core router redundancy
  edges.push(
    {
      id: 'r01-r02',
      source: 'router-core-01',
      target: 'router-core-02',
      type: 'smoothstep',
      data: { bandwidth: '40 Gbps', utilization: 25, status: 'up' }
    },
    {
      id: 'r02-r03',
      source: 'router-core-02',
      target: 'router-core-03',
      type: 'smoothstep',
      data: { bandwidth: '40 Gbps', utilization: 30, status: 'up' }
    },
    {
      id: 'r03-r04',
      source: 'router-core-03',
      target: 'router-core-04',
      type: 'smoothstep',
      data: { bandwidth: '40 Gbps', utilization: 28, status: 'up' }
    },
    {
      id: 'r04-r05',
      source: 'router-core-04',
      target: 'router-core-05',
      type: 'smoothstep',
      data: { bandwidth: '40 Gbps', utilization: 22, status: 'up' }
    }
  )

  // Core to Distribution
  const coreToDist: [string, string[]][] = [
    ['router-core-01', ['01', '02', '03', '04']],
    ['router-core-02', ['05', '06', '07', '08']],
    ['router-core-03', ['09', '10', '11', '12']],
  ]

  coreToDist.forEach(([core, dists]) => {
    dists.forEach((dist: string, idx: number) => {
      edges.push({
        id: `${core}-d${dist}`,
        source: core as string,
        target: `switch-dist-${dist}`,
        type: 'smoothstep',
        data: {
          bandwidth: '10 Gbps',
          utilization: 40 + idx * 5,
          status: 'up'
        }
      })
    })
  })

  // Distribution to Access (12 dist switches connect to 30 access switches)
  // Each distribution switch connects to 2-3 access switches based on hierarchy
  const distToAccessMapping: [string, string[]][] = [
    ['01', ['01', '02', '03']],
    ['02', ['04', '05']],
    ['03', ['06', '07', '08']],
    ['04', ['09', '10']],
    ['05', ['11', '12', '13']],
    ['06', ['14', '15']],
    ['07', ['16', '17', '18']],
    ['08', ['19', '20']],
    ['09', ['21', '22', '23']],
    ['10', ['24', '25']],
    ['11', ['26', '27', '28']],
    ['12', ['29', '30']],
  ]

  distToAccessMapping.forEach(([distNum, accessNums]) => {
    accessNums.forEach((accessNum) => {
      edges.push({
        id: `d${distNum}-a${accessNum}`,
        source: `switch-dist-${distNum}`,
        target: `switch-access-${accessNum}`,
        type: 'smoothstep',
        data: {
          bandwidth: '1 Gbps',
          utilization: 45 + (parseInt(accessNum) % 20),
          status: 'up'
        }
      })
    })
  })

  // Access to APs (8 APs connected to various access switches)
  const apConnections = [
    ['01', '01'], ['04', '02'], ['07', '03'],
    ['10', '04'], ['13', '05'], ['16', '06'],
    ['19', '07'], ['22', '08']
  ]

  apConnections.forEach(([access, ap]) => {
    edges.push({
      id: `a${access}-ap${ap}`,
      source: `switch-access-${access.padStart(2, '0')}`,
      target: `ap-wireless-${ap.padStart(2, '0')}`,
      type: 'smoothstep',
      data: {
        bandwidth: '1 Gbps',
        utilization: 30 + parseInt(ap) * 3,
        status: 'up'
      }
    })
  })

  return edges
}

// Legacy exports for backward compatibility
export const mockTopologyNodes = generateTopologyNodes()
export const mockTopologyEdges = generateTopologyEdges()

// Helper functions
export function getAllTopologyNodes() {
  return mockTopologyNodes
}

export function getAllTopologyEdges() {
  return mockTopologyEdges
}

export function getNodesByLayer(layer: string) {
  return mockTopologyNodes.filter(n => n.data.layer === layer)
}

export function getConnectedNodes(deviceId: string): string[] {
  const connected = new Set<string>()
  mockTopologyEdges.forEach(edge => {
    if (edge.source === deviceId) connected.add(edge.target)
    if (edge.target === deviceId) connected.add(edge.source)
  })
  return Array.from(connected)
}

export function getDownstreamDevices(deviceId: string): string[] {
  const downstream = new Set<string>()
  const queue = [deviceId]
  const visited = new Set<string>([deviceId])

  while (queue.length > 0) {
    const current = queue.shift()!
    mockTopologyEdges.forEach(edge => {
      if (edge.source === current && !visited.has(edge.target)) {
        downstream.add(edge.target)
        visited.add(edge.target)
        queue.push(edge.target)
      }
    })
  }

  return Array.from(downstream)
}

export function getImpactRadius(deviceId: string): { devices: string[]; count: number } {
  const affected = getDownstreamDevices(deviceId)
  return {
    devices: affected,
    count: affected.length
  }
}
