/**
 * Mock events data for timeline
 */

export type EventSeverity = 'critical' | 'warning' | 'info' | 'success'
export type EventCategory = 'device' | 'alert' | 'config' | 'security' | 'system'

export interface NetworkEvent {
  id: string
  timestamp: Date
  severity: EventSeverity
  category: EventCategory
  title: string
  description: string
  source: string
  deviceId?: string
  user?: string
  acknowledged: boolean
  relatedEvents?: string[]
}

// Generate realistic events
export const mockEvents: NetworkEvent[] = [
  // Critical events
  {
    id: 'evt-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    severity: 'critical',
    category: 'device',
    title: 'Device Offline',
    description: 'switch-access-16 has gone offline. No response to SNMP or ping.',
    source: 'switch-access-16',
    deviceId: 'switch-access-16',
    acknowledged: false,
  },
  {
    id: 'evt-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
    severity: 'critical',
    category: 'security',
    title: 'Security Alert - CVE Detected',
    description: 'Critical vulnerability CVE-2024-20359 detected on firewall-02. Immediate action required.',
    source: 'firewall-02',
    deviceId: 'firewall-02',
    acknowledged: true,
    user: 'Security Team',
  },
  
  // Warning events
  {
    id: 'evt-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
    severity: 'warning',
    category: 'device',
    title: 'High CPU Usage',
    description: 'router-core-03 CPU usage exceeded 80% threshold. Current: 85%',
    source: 'router-core-03',
    deviceId: 'router-core-03',
    acknowledged: false,
  },
  {
    id: 'evt-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 mins ago
    severity: 'warning',
    category: 'config',
    title: 'Configuration Drift Detected',
    description: 'Configuration changes detected on router-core-03 outside of change window.',
    source: 'router-core-03',
    deviceId: 'router-core-03',
    acknowledged: false,
    user: 'admin',
  },
  {
    id: 'evt-005',
    timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    severity: 'warning',
    category: 'device',
    title: 'High Temperature',
    description: 'firewall-02 operating temperature at 68°C, above threshold of 60°C.',
    source: 'firewall-02',
    deviceId: 'firewall-02',
    acknowledged: true,
    user: 'Network Team',
  },
  
  // Info events
  {
    id: 'evt-006',
    timestamp: new Date(Date.now() - 1000 * 60 * 90), // 1.5 hours ago
    severity: 'info',
    category: 'system',
    title: 'Backup Completed',
    description: 'Automated configuration backup completed successfully for all devices.',
    source: 'System',
    acknowledged: true,
  },
  {
    id: 'evt-007',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    severity: 'info',
    category: 'device',
    title: 'Firmware Update Available',
    description: 'New firmware version 17.9.5 available for IOS-XE devices.',
    source: 'System',
    acknowledged: false,
  },
  {
    id: 'evt-008',
    timestamp: new Date(Date.now() - 1000 * 60 * 150), // 2.5 hours ago
    severity: 'info',
    category: 'config',
    title: 'Policy Deployment',
    description: 'Contract Web-to-App deployed successfully to tenant Production.',
    source: 'tenant-prod',
    acknowledged: true,
    user: 'admin',
  },
  
  // Success events
  {
    id: 'evt-009',
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    severity: 'success',
    category: 'device',
    title: 'Device Recovered',
    description: 'switch-access-08 has recovered and is now online.',
    source: 'switch-access-08',
    deviceId: 'switch-access-08',
    acknowledged: true,
  },
  {
    id: 'evt-010',
    timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
    severity: 'success',
    category: 'config',
    title: 'Configuration Restored',
    description: 'Configuration rollback completed successfully on switch-dist-08.',
    source: 'switch-dist-08',
    deviceId: 'switch-dist-08',
    acknowledged: true,
    user: 'Network Team',
  },
  
  // More historical events
  {
    id: 'evt-011',
    timestamp: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
    severity: 'warning',
    category: 'security',
    title: 'Login Attempt Failed',
    description: 'Multiple failed login attempts detected from IP 192.168.1.100',
    source: 'System',
    acknowledged: false,
  },
  {
    id: 'evt-012',
    timestamp: new Date(Date.now() - 1000 * 60 * 360), // 6 hours ago
    severity: 'info',
    category: 'system',
    title: 'System Maintenance',
    description: 'Scheduled system maintenance completed. All services operational.',
    source: 'System',
    acknowledged: true,
  },
  {
    id: 'evt-013',
    timestamp: new Date(Date.now() - 1000 * 60 * 420), // 7 hours ago
    severity: 'critical',
    category: 'device',
    title: 'Link Down',
    description: 'Core link between router-core-02 and router-core-03 is down.',
    source: 'router-core-02',
    deviceId: 'router-core-02',
    acknowledged: true,
    user: 'Network Team',
    relatedEvents: ['evt-014'],
  },
  {
    id: 'evt-014',
    timestamp: new Date(Date.now() - 1000 * 60 * 390), // 6.5 hours ago
    severity: 'success',
    category: 'device',
    title: 'Link Recovered',
    description: 'Core link between router-core-02 and router-core-03 has recovered.',
    source: 'router-core-02',
    deviceId: 'router-core-02',
    acknowledged: true,
    relatedEvents: ['evt-013'],
  },
  {
    id: 'evt-015',
    timestamp: new Date(Date.now() - 1000 * 60 * 480), // 8 hours ago
    severity: 'info',
    category: 'device',
    title: 'Port Status Change',
    description: 'Port Gi1/0/24 on switch-dist-04 changed state to up.',
    source: 'switch-dist-04',
    deviceId: 'switch-dist-04',
    acknowledged: true,
  },
]

// Helper functions
export function getAllEvents(): NetworkEvent[] {
  return mockEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

export function getEventsBySeverity(severity: EventSeverity): NetworkEvent[] {
  return mockEvents.filter(e => e.severity === severity)
}

export function getEventsByCategory(category: EventCategory): NetworkEvent[] {
  return mockEvents.filter(e => e.category === category)
}

export function getUnacknowledgedEvents(): NetworkEvent[] {
  return mockEvents.filter(e => !e.acknowledged)
}

export function getEventStats() {
  return {
    total: mockEvents.length,
    critical: mockEvents.filter(e => e.severity === 'critical').length,
    warning: mockEvents.filter(e => e.severity === 'warning').length,
    info: mockEvents.filter(e => e.severity === 'info').length,
    success: mockEvents.filter(e => e.severity === 'success').length,
    unacknowledged: mockEvents.filter(e => !e.acknowledged).length,
  }
}

export function getEventsByTimeRange(minutes: number): NetworkEvent[] {
  const cutoff = new Date(Date.now() - minutes * 60 * 1000)
  return mockEvents.filter(e => e.timestamp >= cutoff)
}

/**
 * Get events for a specific device.
 * @param deviceId - Device ID to get events for
 * @returns Events associated with the device, sorted by timestamp (newest first)
 */
export function getEventsForDevice(deviceId: string): NetworkEvent[] {
  return mockEvents
    .filter((e) => e.deviceId === deviceId)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get device IDs that have events matching the given criteria.
 * Use when filtering the devices list to show only devices with specific event status.
 * @param severity - Optional event severity to filter by (critical, warning, info, success)
 * @param acknowledged - Optional: true = devices with acknowledged events, false = devices with unacknowledged events
 * @returns Set of device IDs that have at least one matching event
 */
export function getDeviceIdsWithEvents(
  severity?: EventSeverity,
  acknowledged?: boolean
): Set<string> {
  let events = mockEvents.filter((e) => e.deviceId != null)
  if (severity) {
    events = events.filter((e) => e.severity === severity)
  }
  if (acknowledged !== undefined) {
    events = events.filter((e) => e.acknowledged === acknowledged)
  }
  return new Set(events.map((e) => e.deviceId!))
}
