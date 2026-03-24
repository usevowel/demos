/**
 * Mock data for network devices
 */

export type DeviceType = 'router' | 'switch' | 'access-point' | 'firewall'
export type DeviceStatus = 'online' | 'offline' | 'warning' | 'critical'

export interface Device {
  id: string
  /** Cisco DNA/Catalyst-style device ID: two letters + digits, no dashes, voice-friendly (e.g. RT01, SW01) */
  deviceId: string
  hostname: string
  type: DeviceType
  model: string
  ipAddress: string
  macAddress: string
  location: {
    building: string
    floor: number
    rack?: string
  }
  firmware: {
    type: string
    version: string
    outdated: boolean
  }
  status: DeviceStatus
  lastSeen: Date
  uptime: number // in hours
  uplinks: string[] // device IDs of parent devices
  ports: {
    total: number
    up: number
    down: number
    disabled: number
  }
  metrics: {
    cpu: number // percentage
    memory: number // percentage
    temperature: number // celsius
  }
}

// Generate mock devices
export const mockDevices: Device[] = [
  // Core Routers (5)
  {
    id: 'router-core-01',
    deviceId: 'RT01',
    hostname: 'router-core-01.corp.net',
    type: 'router',
    model: 'ASR 1001-X',
    ipAddress: '10.0.0.1',
    macAddress: '00:1A:2B:3C:4D:01',
    location: { building: 'Building 1', floor: 1, rack: 'R1-A1' },
    firmware: { type: 'IOS-XE', version: '17.9.4a', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 30),
    uptime: 2160,
    uplinks: [],
    ports: { total: 8, up: 6, down: 0, disabled: 2 },
    metrics: { cpu: 35, memory: 42, temperature: 48 },
  },
  {
    id: 'router-core-02',
    deviceId: 'RT02',
    hostname: 'router-core-02.corp.net',
    type: 'router',
    model: 'ASR 1001-X',
    ipAddress: '10.0.0.2',
    macAddress: '00:1A:2B:3C:4D:02',
    location: { building: 'Building 1', floor: 1, rack: 'R1-A2' },
    firmware: { type: 'IOS-XE', version: '17.9.4a', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 25),
    uptime: 2160,
    uplinks: [],
    ports: { total: 8, up: 5, down: 0, disabled: 3 },
    metrics: { cpu: 38, memory: 45, temperature: 50 },
  },
  {
    id: 'router-core-03',
    deviceId: 'RT03',
    hostname: 'router-core-03.corp.net',
    type: 'router',
    model: 'ASR 1002-HX',
    ipAddress: '10.0.0.3',
    macAddress: '00:1A:2B:3C:4D:03',
    location: { building: 'Building 2', floor: 1, rack: 'R2-A1' },
    firmware: { type: 'IOS-XE', version: '17.6.5', outdated: true },
    status: 'warning',
    lastSeen: new Date(Date.now() - 1000 * 45),
    uptime: 1440,
    uplinks: [],
    ports: { total: 10, up: 7, down: 0, disabled: 3 },
    metrics: { cpu: 55, memory: 68, temperature: 58 },
  },
  {
    id: 'router-core-04',
    deviceId: 'RT04',
    hostname: 'router-core-04.corp.net',
    type: 'router',
    model: 'ASR 1002-HX',
    ipAddress: '10.0.0.4',
    macAddress: '00:1A:2B:3C:4D:04',
    location: { building: 'Building 2', floor: 1, rack: 'R2-A2' },
    firmware: { type: 'IOS-XE', version: '17.9.4a', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 20),
    uptime: 1440,
    uplinks: [],
    ports: { total: 10, up: 8, down: 0, disabled: 2 },
    metrics: { cpu: 42, memory: 51, temperature: 52 },
  },
  {
    id: 'router-core-05',
    deviceId: 'RT05',
    hostname: 'router-core-05.corp.net',
    type: 'router',
    model: 'ASR 1001-X',
    ipAddress: '10.0.0.5',
    macAddress: '00:1A:2B:3C:4D:05',
    location: { building: 'Building 3', floor: 1, rack: 'R3-A1' },
    firmware: { type: 'IOS-XE', version: '17.9.4a', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 35),
    uptime: 720,
    uplinks: [],
    ports: { total: 8, up: 6, down: 0, disabled: 2 },
    metrics: { cpu: 28, memory: 38, temperature: 45 },
  },

  // Distribution Switches (12)
  ...Array.from({ length: 12 }, (_, i) => {
    const id = `switch-dist-${String(i + 1).padStart(2, '0')}`
    const deviceId = `DS${String(i + 1).padStart(2, '0')}`
    const building = i < 4 ? 'Building 1' : i < 8 ? 'Building 2' : 'Building 3'
    const floor = Math.floor((i % 4) / 2) + 1
    const outdated = i === 3 || i === 7 // Some have outdated firmware
    const status: DeviceStatus = outdated ? 'warning' : 'online'
    
    return {
      id,
      deviceId,
      hostname: `${id}.corp.net`,
      type: 'switch' as DeviceType,
      model: i % 2 === 0 ? 'Catalyst 9300-48P' : 'Catalyst 9400',
      ipAddress: `10.1.${Math.floor(i / 4) + 1}.${(i % 4) + 1}`,
      macAddress: `00:1A:2B:3C:D0:${String(i + 1).padStart(2, '0')}`,
      location: { building, floor, rack: `R${Math.floor(i / 4) + 1}-D${(i % 4) + 1}` },
      firmware: { 
        type: 'IOS-XE', 
        version: outdated ? '16.12.3' : '17.9.4a', 
        outdated 
      },
      status,
      lastSeen: new Date(Date.now() - 1000 * (20 + i * 5)),
      uptime: 1440 + i * 48,
      uplinks: [`router-core-${String(Math.floor(i / 4) + 1).padStart(2, '0')}`],
      ports: { total: 48, up: 40 + i, down: 0, disabled: 8 - i },
      metrics: { 
        cpu: 25 + (i * 3), 
        memory: 40 + (i * 2), 
        temperature: 42 + i 
      },
    }
  }),

  // Access Switches (30)
  ...Array.from({ length: 30 }, (_, i) => {
    const id = `switch-access-${String(i + 1).padStart(2, '0')}`
    const deviceId = `AS${String(i + 1).padStart(2, '0')}`
    const building = i < 10 ? 'Building 1' : i < 20 ? 'Building 2' : 'Building 3'
    const floor = (i % 10 < 5 ? 2 : 3)
    const distSwitch = `switch-dist-${String(Math.floor(i / 2.5) + 1).padStart(2, '0')}`
    const outdated = i % 7 === 0 // Some have outdated firmware
    const offline = i === 15 // One is offline
    const status: DeviceStatus = offline ? 'offline' : outdated ? 'warning' : 'online'
    
    return {
      id,
      deviceId,
      hostname: `${id}.corp.net`,
      type: 'switch' as DeviceType,
      model: 'Catalyst 9200-24P',
      ipAddress: `10.2.${Math.floor(i / 10) + 1}.${(i % 10) + 1}`,
      macAddress: `00:1A:2B:3C:A0:${String(i + 1).padStart(2, '0')}`,
      location: { building, floor, rack: `R${Math.floor(i / 10) + 1}-A${(i % 10) + 1}` },
      firmware: { 
        type: 'IOS-XE', 
        version: outdated ? '16.12.3' : '17.9.4a', 
        outdated 
      },
      status,
      lastSeen: offline ? new Date(Date.now() - 1000 * 3600) : new Date(Date.now() - 1000 * (10 + i)),
      uptime: offline ? 0 : 720 + i * 24,
      uplinks: [distSwitch],
      ports: { total: 24, up: offline ? 0 : 18 + (i % 5), down: offline ? 24 : 0, disabled: offline ? 0 : 6 - (i % 5) },
      metrics: { 
        cpu: offline ? 0 : 15 + (i % 20), 
        memory: offline ? 0 : 30 + (i % 15), 
        temperature: offline ? 0 : 38 + (i % 10) 
      },
    }
  }),

  // Wireless Access Points (8)
  ...Array.from({ length: 8 }, (_, i) => {
    const id = `ap-wireless-${String(i + 1).padStart(2, '0')}`
    const deviceId = `AP${String(i + 1).padStart(2, '0')}`
    const building = i < 3 ? 'Building 1' : i < 6 ? 'Building 2' : 'Building 3'
    const floor = (i % 3) + 1
    
    return {
      id,
      deviceId,
      hostname: `${id}.corp.net`,
      type: 'access-point' as DeviceType,
      model: 'Catalyst 9130AXI',
      ipAddress: `10.3.${Math.floor(i / 3) + 1}.${(i % 3) + 1}`,
      macAddress: `00:1A:2B:3C:W0:${String(i + 1).padStart(2, '0')}`,
      location: { building, floor },
      firmware: { type: 'IOS-XE', version: '17.9.4a', outdated: false },
      status: 'online' as DeviceStatus,
      lastSeen: new Date(Date.now() - 1000 * (15 + i * 10)),
      uptime: 360 + i * 48,
      uplinks: [`switch-access-${String((i * 3) + 1).padStart(2, '0')}`],
      ports: { total: 2, up: 2, down: 0, disabled: 0 },
      metrics: { cpu: 20 + i * 2, memory: 35 + i * 3, temperature: 40 + i },
    }
  }),

  // Firewalls (3)
  {
    id: 'firewall-01',
    deviceId: 'FW01',
    hostname: 'firewall-01.corp.net',
    type: 'firewall',
    model: 'ASA 5525-X',
    ipAddress: '10.0.1.1',
    macAddress: '00:1A:2B:3C:F0:01',
    location: { building: 'Building 1', floor: 1, rack: 'R1-F1' },
    firmware: { type: 'ASA', version: '9.18.4', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 40),
    uptime: 4320,
    uplinks: ['router-core-01'],
    ports: { total: 8, up: 4, down: 0, disabled: 4 },
    metrics: { cpu: 45, memory: 58, temperature: 55 },
  },
  {
    id: 'firewall-02',
    deviceId: 'FW02',
    hostname: 'firewall-02.corp.net',
    type: 'firewall',
    model: 'ASA 5525-X',
    ipAddress: '10.0.1.2',
    macAddress: '00:1A:2B:3C:F0:02',
    location: { building: 'Building 2', floor: 1, rack: 'R2-F1' },
    firmware: { type: 'ASA', version: '9.16.2', outdated: true },
    status: 'critical',
    lastSeen: new Date(Date.now() - 1000 * 120),
    uptime: 2160,
    uplinks: ['router-core-03'],
    ports: { total: 8, up: 4, down: 1, disabled: 3 },
    metrics: { cpu: 85, memory: 92, temperature: 68 },
  },
  {
    id: 'firewall-03',
    deviceId: 'FW03',
    hostname: 'firewall-03.corp.net',
    type: 'firewall',
    model: 'Firepower 2130',
    ipAddress: '10.0.1.3',
    macAddress: '00:1A:2B:3C:F0:03',
    location: { building: 'Building 3', floor: 1, rack: 'R3-F1' },
    firmware: { type: 'FTD', version: '7.4.1', outdated: false },
    status: 'online',
    lastSeen: new Date(Date.now() - 1000 * 30),
    uptime: 1440,
    uplinks: ['router-core-05'],
    ports: { total: 10, up: 6, down: 0, disabled: 4 },
    metrics: { cpu: 38, memory: 52, temperature: 48 },
  },
]

// Helper functions
export function getAllDevices(): Device[] {
  return mockDevices
}

export function getDeviceById(id: string): Device | undefined {
  return mockDevices.find(d => d.id === id)
}

/** Look up device by Cisco-style deviceId (e.g. RT01, AS15) for voice/display matching */
export function getDeviceByDeviceId(deviceId: string): Device | undefined {
  const normalized = deviceId.toUpperCase().replace(/\s/g, '')
  return mockDevices.find(d => d.deviceId.toUpperCase() === normalized)
}

export function getDevicesByType(type: DeviceType): Device[] {
  return mockDevices.filter(d => d.type === type)
}

export function getDevicesByStatus(status: DeviceStatus): Device[] {
  return mockDevices.filter(d => d.status === status)
}

export function getDevicesByLocation(building: string, floor?: number): Device[] {
  return mockDevices.filter(d => 
    d.location.building === building && 
    (floor === undefined || d.location.floor === floor)
  )
}

/** Get unique building names from all devices (for filter dropdowns) */
export function getUniqueBuildings(): string[] {
  const buildings = new Set(mockDevices.map(d => d.location.building))
  return Array.from(buildings).sort()
}

/** Get unique floor numbers from all devices (for filter dropdowns) */
export function getUniqueFloors(): number[] {
  const floors = new Set(mockDevices.map(d => d.location.floor))
  return Array.from(floors).sort((a, b) => a - b)
}

export function getOutdatedDevices(): Device[] {
  return mockDevices.filter(d => d.firmware.outdated)
}
