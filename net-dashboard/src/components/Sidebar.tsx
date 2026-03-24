/**
 * Sidebar navigation component
 */

import { Link, useRouterState } from '@tanstack/react-router'
import { 
  LayoutDashboard, 
  Server, 
  Package, 
  Network, 
  ChevronLeft,
  ChevronRight,
  Building2,
  Activity,
  FileText
} from 'lucide-react'
import { useSnapshot } from 'valtio'
import { uiStore, toggleSidebar } from '@/store/uiStore'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/devices', label: 'Devices', icon: Server },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/events', label: 'Events', icon: Activity },
  { to: '/firmware', label: 'Firmware', icon: Package },
  { to: '/topology', label: 'Topology', icon: Network },
  { to: '/notes', label: 'Notes', icon: FileText },
]

export function Sidebar() {
  const snap = useSnapshot(uiStore)
  const router = useRouterState()
  const currentPath = router.location.pathname

  return (
    <aside 
      className={cn(
        "bg-bg-secondary border-r border-border transition-all duration-300 flex flex-col",
        snap.sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="flex items-center justify-end p-4 text-text-secondary hover:text-text-primary transition-colors"
        title={snap.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {snap.sidebarCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>

      {/* Navigation items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPath === item.to || (item.to !== '/' && currentPath.startsWith(item.to))
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive 
                  ? "bg-cisco-blue text-white font-semibold" 
                  : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
              )}
              title={snap.sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!snap.sidebarCollapsed && (
                <span className="text-sm">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer info */}
      {!snap.sidebarCollapsed && (
        <div className="p-4 border-t border-border text-xs text-text-secondary">
          <div>vowel | net v1.0</div>
          <div className="mt-1">Demo Environment</div>
        </div>
      )}
    </aside>
  )
}
