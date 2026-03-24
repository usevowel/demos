/**
 * Reusable chart components using Recharts
 */

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import type { MetricPoint } from '@/data/metrics'
import { format } from 'date-fns'

interface ChartDataPoint {
  timestamp: string
  value: number
  fullDate: Date
}

function transformMetricsToChartData(metrics: MetricPoint[]): ChartDataPoint[] {
  return metrics.map(m => ({
    timestamp: format(m.timestamp, 'HH:mm'),
    value: m.value,
    fullDate: m.timestamp,
  }))
}

function transformDailyMetricsToChartData(metrics: MetricPoint[]): ChartDataPoint[] {
  return metrics.map(m => ({
    timestamp: format(m.timestamp, 'MMM dd'),
    value: m.value,
    fullDate: m.timestamp,
  }))
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string> & { payload?: Array<{ value: number }>, label?: string }) => {
  if (active && payload && payload.length > 0) {
    const firstPayload = payload[0]
    return (
      <div className="bg-bg-secondary border border-border rounded-lg p-3 shadow-lg">
        <p className="text-text-secondary text-sm">{label}</p>
        <p className="text-text-primary font-semibold">
          {firstPayload.value}%
        </p>
      </div>
    )
  }
  return null
}

interface SparklineChartProps {
  data: MetricPoint[]
  color?: string
  height?: number
}

export function SparklineChart({ data, color = '#049FD9', height = 40 }: SparklineChartProps) {
  const chartData = transformMetricsToChartData(data)

  return (
    <div style={{ width: '100%', height }} className="sparkline-container">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MetricLineChartProps {
  data: MetricPoint[]
  title?: string
  color?: string
  showGrid?: boolean
  height?: number
  timeRange?: 'hourly' | 'daily' | 'monthly'
}

export function MetricLineChart({
  data,
  title,
  color = '#049FD9',
  showGrid = true,
  height = 200,
  timeRange = 'hourly',
}: MetricLineChartProps) {
  const chartData = timeRange === 'hourly'
    ? transformMetricsToChartData(data)
    : transformDailyMetricsToChartData(data)

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-text-secondary mb-2">{title}</h4>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#2A4A6C" opacity={0.3} />
            )}
            <XAxis
              dataKey="timestamp"
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
            />
            <YAxis
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface MetricAreaChartProps {
  data: MetricPoint[]
  title?: string
  color?: string
  showGrid?: boolean
  height?: number
  timeRange?: 'hourly' | 'daily' | 'monthly'
}

export function MetricAreaChart({
  data,
  title,
  color = '#049FD9',
  showGrid = true,
  height = 200,
  timeRange = 'hourly',
}: MetricAreaChartProps) {
  const chartData = timeRange === 'hourly'
    ? transformMetricsToChartData(data)
    : transformDailyMetricsToChartData(data)

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-text-secondary mb-2">{title}</h4>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#2A4A6C" opacity={0.3} />
            )}
            <XAxis
              dataKey="timestamp"
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
            />
            <YAxis
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <defs>
              <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${color.replace('#', '')})`}
              dot={{ fill: color, strokeWidth: 0, r: 3 }}
              activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

interface MultiMetricChartProps {
  datasets: {
    name: string
    data: MetricPoint[]
    color: string
  }[]
  title?: string
  showGrid?: boolean
  height?: number
  timeRange?: 'hourly' | 'daily' | 'monthly'
}

export function MultiMetricChart({
  datasets,
  title,
  showGrid = true,
  height = 250,
  timeRange = 'hourly',
}: MultiMetricChartProps) {
  // Transform all datasets to use the same timestamps
  const chartData = datasets[0]?.data.map((_, index) => {
    const point: Record<string, number | string> = {
      timestamp: timeRange === 'hourly'
        ? format(datasets[0].data[index].timestamp, 'HH:mm')
        : format(datasets[0].data[index].timestamp, 'MMM dd'),
    }
    
    datasets.forEach(dataset => {
      point[dataset.name] = dataset.data[index]?.value ?? 0
    })
    
    return point
  }) ?? []

  return (
    <div className="w-full">
      {title && (
        <h4 className="text-sm font-medium text-text-secondary mb-2">{title}</h4>
      )}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#2A4A6C" opacity={0.3} />
            )}
            <XAxis
              dataKey="timestamp"
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
            />
            <YAxis
              stroke="#6B7B8C"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#2A4A6C' }}
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {datasets.map((dataset) => (
              <Line
                key={dataset.name}
                type="monotone"
                dataKey={dataset.name}
                stroke={dataset.color}
                strokeWidth={2}
                dot={{ fill: dataset.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 6, fill: dataset.color, stroke: '#fff', strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
