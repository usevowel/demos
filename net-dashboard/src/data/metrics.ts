/**
 * Mock time-series metrics data for charts
 */

export interface MetricPoint {
  timestamp: Date
  value: number
}

export interface DeviceMetrics {
  deviceId: string
  cpu: MetricPoint[]
  memory: MetricPoint[]
  temperature: MetricPoint[]
  bandwidthIn: MetricPoint[]
  bandwidthOut: MetricPoint[]
}

// Generate 24 hours of hourly data
function generateHourlyData(baseValue: number, variance: number): MetricPoint[] {
  const data: MetricPoint[] = []
  const now = new Date()
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
    const randomVariance = (Math.random() - 0.5) * variance
    const value = Math.max(0, Math.min(100, baseValue + randomVariance))
    data.push({ timestamp, value: Math.round(value) })
  }
  
  return data
}

// Generate 7 days of daily data
function generateDailyData(baseValue: number, variance: number): MetricPoint[] {
  const data: MetricPoint[] = []
  const now = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const randomVariance = (Math.random() - 0.5) * variance
    const value = Math.max(0, Math.min(100, baseValue + randomVariance))
    data.push({ timestamp, value: Math.round(value) })
  }
  
  return data
}

// Generate 30 days of daily data
function generateMonthlyData(baseValue: number, variance: number): MetricPoint[] {
  const data: MetricPoint[] = []
  const now = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const randomVariance = (Math.random() - 0.5) * variance
    const value = Math.max(0, Math.min(100, baseValue + randomVariance))
    data.push({ timestamp, value: Math.round(value) })
  }
  
  return data
}

// Mock metrics for core routers
export const coreRouterMetrics: DeviceMetrics[] = [
  {
    deviceId: 'router-core-01',
    cpu: generateHourlyData(35, 10),
    memory: generateHourlyData(42, 8),
    temperature: generateHourlyData(48, 5),
    bandwidthIn: generateHourlyData(45, 15),
    bandwidthOut: generateHourlyData(42, 12),
  },
  {
    deviceId: 'router-core-02',
    cpu: generateHourlyData(38, 12),
    memory: generateHourlyData(45, 10),
    temperature: generateHourlyData(50, 6),
    bandwidthIn: generateHourlyData(48, 18),
    bandwidthOut: generateHourlyData(46, 15),
  },
  {
    deviceId: 'router-core-03',
    cpu: generateHourlyData(55, 15),
    memory: generateHourlyData(68, 12),
    temperature: generateHourlyData(58, 8),
    bandwidthIn: generateHourlyData(62, 20),
    bandwidthOut: generateHourlyData(58, 18),
  },
  {
    deviceId: 'router-core-04',
    cpu: generateHourlyData(42, 10),
    memory: generateHourlyData(51, 9),
    temperature: generateHourlyData(52, 5),
    bandwidthIn: generateHourlyData(50, 16),
    bandwidthOut: generateHourlyData(48, 14),
  },
  {
    deviceId: 'router-core-05',
    cpu: generateHourlyData(28, 8),
    memory: generateHourlyData(38, 7),
    temperature: generateHourlyData(45, 4),
    bandwidthIn: generateHourlyData(38, 12),
    bandwidthOut: generateHourlyData(36, 10),
  },
]

// Mock metrics for firewalls
export const firewallMetrics: DeviceMetrics[] = [
  {
    deviceId: 'firewall-01',
    cpu: generateHourlyData(45, 12),
    memory: generateHourlyData(58, 10),
    temperature: generateHourlyData(55, 6),
    bandwidthIn: generateHourlyData(52, 18),
    bandwidthOut: generateHourlyData(50, 16),
  },
  {
    deviceId: 'firewall-02',
    cpu: generateHourlyData(85, 10),
    memory: generateHourlyData(92, 5),
    temperature: generateHourlyData(68, 4),
    bandwidthIn: generateHourlyData(78, 12),
    bandwidthOut: generateHourlyData(75, 10),
  },
  {
    deviceId: 'firewall-03',
    cpu: generateHourlyData(38, 10),
    memory: generateHourlyData(52, 8),
    temperature: generateHourlyData(48, 5),
    bandwidthIn: generateHourlyData(42, 14),
    bandwidthOut: generateHourlyData(40, 12),
  },
]

// Network-wide aggregated metrics
export const networkMetrics = {
  // Hourly data for last 24 hours
  hourly: {
    cpu: generateHourlyData(42, 15),
    memory: generateHourlyData(52, 12),
    bandwidth: generateHourlyData(58, 20),
  },
  // Daily data for last 7 days
  daily: {
    cpu: generateDailyData(40, 10),
    memory: generateDailyData(50, 8),
    bandwidth: generateDailyData(55, 15),
  },
  // Daily data for last 30 days
  monthly: {
    cpu: generateMonthlyData(41, 12),
    memory: generateMonthlyData(51, 10),
    bandwidth: generateMonthlyData(56, 18),
  },
}

// Site health scores over time
export const siteHealthHistory = {
  'Building 1': generateDailyData(95, 5),
  'Building 2': generateDailyData(88, 8),
  'Building 3': generateDailyData(92, 6),
}

// Helper functions
export function getMetricsForDevice(deviceId: string): DeviceMetrics | undefined {
  const allMetrics = [...coreRouterMetrics, ...firewallMetrics]
  return allMetrics.find(m => m.deviceId === deviceId)
}

export function getLatestMetricValue(metrics: MetricPoint[]): number {
  return metrics[metrics.length - 1]?.value ?? 0
}

export function getAverageMetricValue(metrics: MetricPoint[]): number {
  if (metrics.length === 0) return 0
  const sum = metrics.reduce((acc, m) => acc + m.value, 0)
  return Math.round(sum / metrics.length)
}

export function getMaxMetricValue(metrics: MetricPoint[]): number {
  if (metrics.length === 0) return 0
  return Math.max(...metrics.map(m => m.value))
}
