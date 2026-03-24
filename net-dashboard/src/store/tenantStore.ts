/**
 * Tenant store - manages selected tenant for tenants page
 * Used by AI selectTenant action and Header search to pre-select a tenant when navigating.
 */

import { proxy } from 'valtio'
import { getTenantById } from '@/data/tenants'
import type { Tenant } from '@/data/tenants'

export interface TenantStore {
  /** Currently selected tenant ID (used when navigating to /tenants) */
  selectedTenantId: string | null
}

const initialState: TenantStore = {
  selectedTenantId: null,
}

export const tenantStore = proxy<TenantStore>(initialState)

/** Set the selected tenant ID (used before/after navigating to tenants page) */
export function setSelectedTenant(tenantId: string | null) {
  tenantStore.selectedTenantId = tenantId
}

/** Get the selected tenant object, if any */
export function getSelectedTenant(): Tenant | undefined {
  return tenantStore.selectedTenantId ? getTenantById(tenantStore.selectedTenantId) : undefined
}
