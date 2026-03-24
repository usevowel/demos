/**
 * Tenants management page - ACI-style multi-tenancy
 */

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { 
  getAllTenants, 
  getTenantStats, 
  getVRFsForTenant, 
  getBDsForTenant, 
  getEPGsForTenant,
  getTenantById,
  type Tenant 
} from '@/data/tenants'
import { tenantStore, setSelectedTenant as setStoreSelectedTenant } from '@/store/tenantStore'
import { Building2, Network, Layers, Boxes, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

function TenantsPage() {
  const tenants = getAllTenants()
  const stats = getTenantStats()
  const tenantSnap = useSnapshot(tenantStore)
  const [selectedTenant, setSelectedTenantState] = useState<Tenant | null>(null)

  /** Sync from tenantStore when navigating with pre-selected tenant (e.g. from AI or Header search) */
  useEffect(() => {
    if (tenantSnap.selectedTenantId) {
      const tenant = getTenantById(tenantSnap.selectedTenantId)
      if (tenant) setSelectedTenantState(tenant)
    } else {
      setSelectedTenantState(null)
    }
  }, [tenantSnap.selectedTenantId])

  const handleSelectTenant = (tenant: Tenant | null) => {
    setSelectedTenantState(tenant)
    setStoreSelectedTenant(tenant?.id ?? null)
  }

  const selectedVRFs = selectedTenant ? getVRFsForTenant(selectedTenant.id) : []
  const selectedBDs = selectedTenant ? getBDsForTenant(selectedTenant.id) : []
  const selectedEPGs = selectedTenant ? getEPGsForTenant(selectedTenant.id) : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
          <Building2 className="h-8 w-8 text-cisco-blue" />
          Tenants
        </h1>
        <p className="text-text-secondary mt-1">
          Multi-tenant network segmentation and policy management
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Tenants</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.total}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Active</p>
          <p className="text-2xl font-bold text-status-online mt-1">{stats.active}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Avg Health</p>
          <p className="text-2xl font-bold text-cisco-blue mt-1">{stats.avgHealth}%</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">VRFs</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalVRFs}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">Bridge Domains</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalBDs}</p>
        </div>
        <div className="bg-bg-secondary border border-border rounded-lg p-4">
          <p className="text-text-secondary text-sm">EPGs</p>
          <p className="text-2xl font-bold text-text-primary mt-1">{stats.totalEPGs}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenants List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-text-primary">Tenants</h2>
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-all",
                  selectedTenant?.id === tenant.id
                    ? "bg-cisco-blue/10 border-cisco-blue"
                    : "bg-bg-secondary border-border hover:border-cisco-blue/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary">{tenant.name}</h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                      {tenant.description}
                    </p>
                  </div>
                  <ChevronRight className={cn(
                    "h-5 w-5 transition-transform",
                    selectedTenant?.id === tenant.id ? "rotate-90 text-cisco-blue" : "text-text-secondary"
                  )} />
                </div>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs",
                    tenant.status === 'active' ? "bg-status-online/20 text-status-online" : "bg-status-warning/20 text-status-warning"
                  )}>
                    {tenant.status}
                  </span>
                  <span className="text-text-secondary">Health: {tenant.healthScore}%</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Tenant Details */}
        <div className="lg:col-span-2">
          {selectedTenant ? (
            <div className="space-y-6">
              {/* Tenant Header */}
              <div className="bg-bg-secondary border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary">{selectedTenant.name}</h2>
                    <p className="text-text-secondary mt-1">{selectedTenant.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-cisco-blue">
                      {selectedTenant.healthScore}%
                    </div>
                    <div className="text-sm text-text-secondary">Health Score</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-text-secondary">Devices:</span>
                    <span className="ml-2 text-text-primary font-semibold">{selectedTenant.deviceCount}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">VRFs:</span>
                    <span className="ml-2 text-text-primary font-semibold">{selectedTenant.vrfCount}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">BDs:</span>
                    <span className="ml-2 text-text-primary font-semibold">{selectedTenant.bdCount}</span>
                  </div>
                  <div>
                    <span className="text-text-secondary">EPGs:</span>
                    <span className="ml-2 text-text-primary font-semibold">{selectedTenant.epgCount}</span>
                  </div>
                </div>
              </div>

              {/* VRFs */}
              <div className="bg-bg-secondary border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Network className="h-5 w-5 text-cisco-blue" />
                  <h3 className="text-lg font-semibold text-text-primary">VRFs ({selectedVRFs.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedVRFs.map((vrf) => (
                    <div key={vrf.id} className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">{vrf.name}</span>
                        <span className="text-xs text-text-secondary font-mono">{vrf.rd}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{vrf.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {vrf.subnets.map((subnet, idx) => (
                          <span key={idx} className="text-xs bg-bg-secondary px-2 py-0.5 rounded text-text-secondary">
                            {subnet}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bridge Domains */}
              <div className="bg-bg-secondary border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="h-5 w-5 text-cisco-blue" />
                  <h3 className="text-lg font-semibold text-text-primary">Bridge Domains ({selectedBDs.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedBDs.map((bd) => (
                    <div key={bd.id} className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">{bd.name}</span>
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded",
                          bd.scope === 'public' ? "bg-cisco-blue/20 text-cisco-blue" : "bg-bg-secondary text-text-secondary"
                        )}>
                          {bd.scope}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{bd.description}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-text-secondary">Subnet: </span>
                        <span className="text-text-primary font-mono">{bd.subnet}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* EPGs */}
              <div className="bg-bg-secondary border border-border rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Boxes className="h-5 w-5 text-cisco-blue" />
                  <h3 className="text-lg font-semibold text-text-primary">Endpoint Groups ({selectedEPGs.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedEPGs.map((epg) => (
                    <div key={epg.id} className="p-3 bg-bg-tertiary rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-text-primary">{epg.name}</span>
                        <span className="text-xs text-text-secondary">VLAN {epg.vlan}</span>
                      </div>
                      <p className="text-sm text-text-secondary mt-1">{epg.description}</p>
                      <div className="mt-2 text-sm">
                        <span className="text-text-secondary">Endpoints: </span>
                        <span className="text-text-primary font-semibold">{epg.endpoints}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-bg-secondary border border-border rounded-lg p-12 text-center">
              <Building2 className="h-16 w-16 text-text-secondary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-text-primary">Select a Tenant</h3>
              <p className="text-text-secondary mt-2">
                Click on a tenant from the list to view its VRFs, Bridge Domains, and Endpoint Groups
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/tenants/')({
  component: TenantsPage,
})
