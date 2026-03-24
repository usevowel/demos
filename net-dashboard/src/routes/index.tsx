/**
 * Dashboard overview page with key metrics and charts
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { getDeviceStats } from '@/store/deviceStore'
import { eventStore, getEventStats } from '@/store/eventStore'
import { Server, Activity, Package, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MetricAreaChart, MultiMetricChart } from '@/components/charts/MetricCharts'
import { networkMetrics, siteHealthHistory } from '@/data/metrics'
import { useState } from 'react'

function DashboardPage() {
  const eventSnap = useSnapshot(eventStore)
  const [timeRange, setTimeRange] = useState<'hourly' | 'daily' | 'monthly'>('hourly')
  
  const deviceStats = getDeviceStats()
  const eventStats = getEventStats()

  const currentMetrics = networkMetrics[timeRange]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Network Overview</h1>
        <p className="text-text-secondary mt-1">
          Monitor your network infrastructure at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Devices */}
        <Link to="/devices" className="device-card group cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Total Devices</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{deviceStats.total}</p>
            </div>
            <Server className="h-12 w-12 text-cisco-blue" />
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
            <span className="px-2 py-1 rounded-md text-xs font-semibold status-online">{deviceStats.online} online</span>
            <span className="px-2 py-1 rounded-md text-xs font-semibold status-critical">{deviceStats.offline} offline</span>
          </div>
        </Link>

        {/* Recent Events */}
        <Link to="/events" className="device-card group cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Recent Events</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{eventStats.unacknowledged}</p>
            </div>
            <Activity className="h-12 w-12 text-status-warning" />
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-between text-sm">
            <span className="px-2 py-1 rounded-md text-xs font-semibold status-critical">{eventStats.critical} critical</span>
            <span className="px-2 py-1 rounded-md text-xs font-semibold status-warning">{eventStats.warning} warnings</span>
          </div>
        </Link>

        {/* Outdated Firmware */}
        <Link to="/firmware" className="device-card group cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Outdated Firmware</p>
              <p className="text-4xl font-bold text-text-primary mt-2">{deviceStats.outdated}</p>
            </div>
            <Package className="h-12 w-12 text-status-warning" />
          </div>
          <div className="mt-4 pt-4 border-t border-border text-sm text-text-secondary">
            {((deviceStats.outdated / deviceStats.total) * 100).toFixed(0)}% of fleet needs updates
          </div>
        </Link>

        {/* Network Health */}
        <div className="device-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary text-sm">Network Health</p>
              <p className="text-4xl font-bold text-status-online mt-2">
                {((deviceStats.online / deviceStats.total) * 100).toFixed(1)}%
              </p>
            </div>
            <Activity className="h-12 w-12 text-status-online" />
          </div>
          <div className="mt-4 pt-4 border-t border-border text-sm text-text-secondary">
            Uptime: 99.8%
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-cisco-blue" />
            <h2 className="text-xl font-semibold text-text-primary">Network Performance</h2>
          </div>
          <div className="flex gap-2">
            {(['hourly', 'daily', 'monthly'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1 rounded text-sm font-medium transition-colors",
                  timeRange === range
                    ? "bg-cisco-blue text-white"
                    : "bg-bg-tertiary text-text-secondary hover:text-text-primary"
                )}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MultiMetricChart
              title="Network Utilization Trends"
              datasets={[
                { name: 'CPU', data: currentMetrics.cpu, color: '#049FD9' },
                { name: 'Memory', data: currentMetrics.memory, color: '#6CC04A' },
                { name: 'Bandwidth', data: currentMetrics.bandwidth, color: '#F59E0B' },
              ]}
              height={250}
              timeRange={timeRange}
            />
          </div>
          <div className="space-y-4">
            <MetricAreaChart
              title="Site Health - Building 1"
              data={siteHealthHistory['Building 1']}
              color="#22C55E"
              height={110}
              timeRange="daily"
            />
            <MetricAreaChart
              title="Site Health - Building 2"
              data={siteHealthHistory['Building 2']}
              color="#EAB308"
              height={110}
              timeRange="daily"
            />
          </div>
        </div>
      </div>

      {/* Device Type Breakdown */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Device Types</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-text-secondary text-sm">Routers</p>
            <p className="text-2xl font-bold text-text-primary">{deviceStats.byType.router}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Switches</p>
            <p className="text-2xl font-bold text-text-primary">{deviceStats.byType.switch}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Access Points</p>
            <p className="text-2xl font-bold text-text-primary">{deviceStats.byType['access-point']}</p>
          </div>
          <div>
            <p className="text-text-secondary text-sm">Firewalls</p>
            <p className="text-2xl font-bold text-text-primary">{deviceStats.byType.firewall}</p>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-bg-secondary border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Recent Events</h2>
          <Link to="/events" className="text-sm text-cisco-blue hover:text-cisco-blue-light">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {eventSnap.events
            .filter(e => !e.acknowledged)
            .slice(0, 5)
            .map(event => (
              <Link
                key={event.id}
                to="/events"
                className="block p-3 bg-bg-tertiary rounded-lg hover:border-cisco-blue border border-transparent transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-semibold",
                      event.severity === 'critical' && "bg-status-critical text-white",
                      event.severity === 'warning' && "bg-status-warning",
                      event.severity === 'info' && "bg-status-info text-white",
                      event.severity === 'success' && "bg-status-online text-white"
                    )}>
                      {event.severity.toUpperCase()}
                    </span>
                    <span className="text-text-primary font-medium">{event.title}</span>
                  </div>
                  <span className="text-xs text-text-secondary">
                    {event.timestamp.toLocaleString()}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: DashboardPage,
})
