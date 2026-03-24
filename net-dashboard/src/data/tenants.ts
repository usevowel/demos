/**
 * Mock data for multi-tenant network management (ACI-style)
 */

export interface Tenant {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  healthScore: number
  deviceCount: number
  vrfCount: number
  epgCount: number
  bdCount: number
}

export interface VRF {
  id: string
  tenantId: string
  name: string
  description: string
  rd: string // Route Distinguisher
  subnets: string[]
  status: 'active' | 'inactive'
}

export interface BridgeDomain {
  id: string
  tenantId: string
  vrfId: string
  name: string
  description: string
  subnet: string
  scope: 'public' | 'private' | 'shared'
  status: 'active' | 'inactive'
}

export interface EndpointGroup {
  id: string
  tenantId: string
  bdId: string
  name: string
  description: string
  vlan: number
  endpoints: number
  status: 'active' | 'inactive'
}

export interface Contract {
  id: string
  tenantId: string
  name: string
  description: string
  scope: 'tenant' | 'global'
  subjects: ContractSubject[]
  status: 'active' | 'inactive'
}

export interface ContractSubject {
  id: string
  name: string
  filters: string[]
  action: 'permit' | 'deny'
  direction: 'both' | 'in' | 'out'
}

export const mockTenants: Tenant[] = [
  {
    id: 'tenant-prod',
    name: 'Production',
    description: 'Production environment for customer-facing applications',
    status: 'active',
    createdAt: new Date('2023-01-15'),
    healthScore: 98,
    deviceCount: 24,
    vrfCount: 3,
    epgCount: 12,
    bdCount: 6,
  },
  {
    id: 'tenant-dev',
    name: 'Development',
    description: 'Development and testing environment',
    status: 'active',
    createdAt: new Date('2023-02-20'),
    healthScore: 92,
    deviceCount: 18,
    vrfCount: 2,
    epgCount: 8,
    bdCount: 4,
  },
  {
    id: 'tenant-dmz',
    name: 'DMZ',
    description: 'Demilitarized zone for external-facing services',
    status: 'active',
    createdAt: new Date('2023-03-10'),
    healthScore: 95,
    deviceCount: 8,
    vrfCount: 1,
    epgCount: 4,
    bdCount: 2,
  },
  {
    id: 'tenant-mgmt',
    name: 'Management',
    description: 'Infrastructure management and monitoring',
    status: 'active',
    createdAt: new Date('2023-01-01'),
    healthScore: 99,
    deviceCount: 6,
    vrfCount: 1,
    epgCount: 3,
    bdCount: 2,
  },
]

export const mockVRFs: VRF[] = [
  // Production VRFs
  { id: 'vrf-prod-web', tenantId: 'tenant-prod', name: 'Web-Tier', description: 'Web application tier', rd: '65001:100', subnets: ['10.10.0.0/16'], status: 'active' },
  { id: 'vrf-prod-app', tenantId: 'tenant-prod', name: 'App-Tier', description: 'Application server tier', rd: '65001:101', subnets: ['10.11.0.0/16'], status: 'active' },
  { id: 'vrf-prod-db', tenantId: 'tenant-prod', name: 'DB-Tier', description: 'Database tier', rd: '65001:102', subnets: ['10.12.0.0/16'], status: 'active' },
  
  // Development VRFs
  { id: 'vrf-dev-main', tenantId: 'tenant-dev', name: 'Dev-Main', description: 'Main development network', rd: '65001:200', subnets: ['10.20.0.0/16'], status: 'active' },
  { id: 'vrf-dev-test', tenantId: 'tenant-dev', name: 'Dev-Test', description: 'Testing environment', rd: '65001:201', subnets: ['10.21.0.0/16'], status: 'active' },
  
  // DMZ VRF
  { id: 'vrf-dmz-ext', tenantId: 'tenant-dmz', name: 'External', description: 'External DMZ network', rd: '65001:300', subnets: ['192.168.10.0/24'], status: 'active' },
  
  // Management VRF
  { id: 'vrf-mgmt-infra', tenantId: 'tenant-mgmt', name: 'Infrastructure', description: 'Infrastructure management', rd: '65001:400', subnets: ['10.0.0.0/24'], status: 'active' },
]

export const mockBridgeDomains: BridgeDomain[] = [
  // Production BDs
  { id: 'bd-prod-web-01', tenantId: 'tenant-prod', vrfId: 'vrf-prod-web', name: 'Web-Frontend', description: 'Web frontend servers', subnet: '10.10.1.0/24', scope: 'public', status: 'active' },
  { id: 'bd-prod-web-02', tenantId: 'tenant-prod', vrfId: 'vrf-prod-web', name: 'Web-API', description: 'API gateway servers', subnet: '10.10.2.0/24', scope: 'public', status: 'active' },
  { id: 'bd-prod-app-01', tenantId: 'tenant-prod', vrfId: 'vrf-prod-app', name: 'App-Servers', description: 'Application servers', subnet: '10.11.1.0/24', scope: 'private', status: 'active' },
  { id: 'bd-prod-app-02', tenantId: 'tenant-prod', vrfId: 'vrf-prod-app', name: 'App-Workers', description: 'Background workers', subnet: '10.11.2.0/24', scope: 'private', status: 'active' },
  { id: 'bd-prod-db-01', tenantId: 'tenant-prod', vrfId: 'vrf-prod-db', name: 'DB-Primary', description: 'Primary database', subnet: '10.12.1.0/24', scope: 'private', status: 'active' },
  { id: 'bd-prod-db-02', tenantId: 'tenant-prod', vrfId: 'vrf-prod-db', name: 'DB-Replica', description: 'Database replicas', subnet: '10.12.2.0/24', scope: 'private', status: 'active' },
  
  // Development BDs
  { id: 'bd-dev-app-01', tenantId: 'tenant-dev', vrfId: 'vrf-dev-main', name: 'Dev-App', description: 'Development apps', subnet: '10.20.1.0/24', scope: 'private', status: 'active' },
  { id: 'bd-dev-db-01', tenantId: 'tenant-dev', vrfId: 'vrf-dev-main', name: 'Dev-DB', description: 'Development databases', subnet: '10.20.2.0/24', scope: 'private', status: 'active' },
  { id: 'bd-test-app-01', tenantId: 'tenant-dev', vrfId: 'vrf-dev-test', name: 'Test-App', description: 'Testing applications', subnet: '10.21.1.0/24', scope: 'private', status: 'active' },
  { id: 'bd-test-db-01', tenantId: 'tenant-dev', vrfId: 'vrf-dev-test', name: 'Test-DB', description: 'Testing databases', subnet: '10.21.2.0/24', scope: 'private', status: 'active' },
  
  // DMZ BDs
  { id: 'bd-dmz-web', tenantId: 'tenant-dmz', vrfId: 'vrf-dmz-ext', name: 'DMZ-Web', description: 'DMZ web servers', subnet: '192.168.10.0/26', scope: 'public', status: 'active' },
  { id: 'bd-dmz-proxy', tenantId: 'tenant-dmz', vrfId: 'vrf-dmz-ext', name: 'DMZ-Proxy', description: 'Reverse proxies', subnet: '192.168.10.64/26', scope: 'public', status: 'active' },
  
  // Management BDs
  { id: 'bd-mgmt-net', tenantId: 'tenant-mgmt', vrfId: 'vrf-mgmt-infra', name: 'Mgmt-Network', description: 'Network management', subnet: '10.0.0.0/25', scope: 'private', status: 'active' },
  { id: 'bd-mgmt-mon', tenantId: 'tenant-mgmt', vrfId: 'vrf-mgmt-infra', name: 'Mgmt-Monitoring', description: 'Monitoring systems', subnet: '10.0.0.128/25', scope: 'private', status: 'active' },
]

export const mockEndpointGroups: EndpointGroup[] = [
  // Production EPGs
  { id: 'epg-prod-web-fe', tenantId: 'tenant-prod', bdId: 'bd-prod-web-01', name: 'Web-Frontend', description: 'Web frontend EPG', vlan: 100, endpoints: 8, status: 'active' },
  { id: 'epg-prod-web-api', tenantId: 'tenant-prod', bdId: 'bd-prod-web-02', name: 'Web-API', description: 'API gateway EPG', vlan: 101, endpoints: 4, status: 'active' },
  { id: 'epg-prod-app-srv', tenantId: 'tenant-prod', bdId: 'bd-prod-app-01', name: 'App-Servers', description: 'Application servers EPG', vlan: 110, endpoints: 12, status: 'active' },
  { id: 'epg-prod-app-wrk', tenantId: 'tenant-prod', bdId: 'bd-prod-app-02', name: 'App-Workers', description: 'Background workers EPG', vlan: 111, endpoints: 6, status: 'active' },
  { id: 'epg-prod-db-prim', tenantId: 'tenant-prod', bdId: 'bd-prod-db-01', name: 'DB-Primary', description: 'Primary database EPG', vlan: 120, endpoints: 2, status: 'active' },
  { id: 'epg-prod-db-repl', tenantId: 'tenant-prod', bdId: 'bd-prod-db-02', name: 'DB-Replica', description: 'Database replica EPG', vlan: 121, endpoints: 4, status: 'active' },
  
  // Development EPGs
  { id: 'epg-dev-app', tenantId: 'tenant-dev', bdId: 'bd-dev-app-01', name: 'Dev-App', description: 'Development app EPG', vlan: 200, endpoints: 6, status: 'active' },
  { id: 'epg-dev-db', tenantId: 'tenant-dev', bdId: 'bd-dev-db-01', name: 'Dev-DB', description: 'Development DB EPG', vlan: 201, endpoints: 2, status: 'active' },
  { id: 'epg-test-app', tenantId: 'tenant-dev', bdId: 'bd-test-app-01', name: 'Test-App', description: 'Testing app EPG', vlan: 210, endpoints: 4, status: 'active' },
  { id: 'epg-test-db', tenantId: 'tenant-dev', bdId: 'bd-test-db-01', name: 'Test-DB', description: 'Testing DB EPG', vlan: 211, endpoints: 2, status: 'active' },
  
  // DMZ EPGs
  { id: 'epg-dmz-web', tenantId: 'tenant-dmz', bdId: 'bd-dmz-web', name: 'DMZ-Web', description: 'DMZ web EPG', vlan: 300, endpoints: 4, status: 'active' },
  { id: 'epg-dmz-proxy', tenantId: 'tenant-dmz', bdId: 'bd-dmz-proxy', name: 'DMZ-Proxy', description: 'DMZ proxy EPG', vlan: 301, endpoints: 2, status: 'active' },
  
  // Management EPGs
  { id: 'epg-mgmt-net', tenantId: 'tenant-mgmt', bdId: 'bd-mgmt-net', name: 'Mgmt-Network', description: 'Network management EPG', vlan: 400, endpoints: 8, status: 'active' },
  { id: 'epg-mgmt-mon', tenantId: 'tenant-mgmt', bdId: 'bd-mgmt-mon', name: 'Mgmt-Monitoring', description: 'Monitoring EPG', vlan: 401, endpoints: 6, status: 'active' },
]

export const mockContracts: Contract[] = [
  {
    id: 'contract-web-to-app',
    tenantId: 'tenant-prod',
    name: 'Web-to-App',
    description: 'Allow web tier to communicate with app tier',
    scope: 'tenant',
    subjects: [
      { id: 'subj-http', name: 'HTTP', filters: ['tcp-80', 'tcp-443'], action: 'permit', direction: 'both' },
      { id: 'subj-https', name: 'HTTPS', filters: ['tcp-443'], action: 'permit', direction: 'both' },
    ],
    status: 'active',
  },
  {
    id: 'contract-app-to-db',
    tenantId: 'tenant-prod',
    name: 'App-to-DB',
    description: 'Allow app tier to communicate with database tier',
    scope: 'tenant',
    subjects: [
      { id: 'subj-mysql', name: 'MySQL', filters: ['tcp-3306'], action: 'permit', direction: 'both' },
      { id: 'subj-redis', name: 'Redis', filters: ['tcp-6379'], action: 'permit', direction: 'both' },
    ],
    status: 'active',
  },
  {
    id: 'contract-deny-all',
    tenantId: 'tenant-prod',
    name: 'Default-Deny',
    description: 'Default deny all traffic',
    scope: 'tenant',
    subjects: [
      { id: 'subj-deny', name: 'Deny-All', filters: ['ip-any'], action: 'deny', direction: 'both' },
    ],
    status: 'active',
  },
  {
    id: 'contract-internet-to-dmz',
    tenantId: 'tenant-dmz',
    name: 'Internet-to-DMZ',
    description: 'Allow internet access to DMZ services',
    scope: 'global',
    subjects: [
      { id: 'subj-internet-http', name: 'HTTP', filters: ['tcp-80'], action: 'permit', direction: 'in' },
      { id: 'subj-internet-https', name: 'HTTPS', filters: ['tcp-443'], action: 'permit', direction: 'in' },
    ],
    status: 'active',
  },
]

// Helper functions
export function getAllTenants(): Tenant[] {
  return mockTenants
}

export function getTenantById(id: string): Tenant | undefined {
  return mockTenants.find(t => t.id === id)
}

export function getVRFsForTenant(tenantId: string): VRF[] {
  return mockVRFs.filter(v => v.tenantId === tenantId)
}

export function getBDsForTenant(tenantId: string): BridgeDomain[] {
  return mockBridgeDomains.filter(bd => bd.tenantId === tenantId)
}

export function getBDsForVRF(vrfId: string): BridgeDomain[] {
  return mockBridgeDomains.filter(bd => bd.vrfId === vrfId)
}

export function getEPGsForTenant(tenantId: string): EndpointGroup[] {
  return mockEndpointGroups.filter(epg => epg.tenantId === tenantId)
}

export function getEPGsForBD(bdId: string): EndpointGroup[] {
  return mockEndpointGroups.filter(epg => epg.bdId === bdId)
}

export function getContractsForTenant(tenantId: string): Contract[] {
  return mockContracts.filter(c => c.tenantId === tenantId)
}

export function getTenantStats() {
  return {
    total: mockTenants.length,
    active: mockTenants.filter(t => t.status === 'active').length,
    avgHealth: Math.round(mockTenants.reduce((acc, t) => acc + t.healthScore, 0) / mockTenants.length),
    totalVRFs: mockVRFs.length,
    totalBDs: mockBridgeDomains.length,
    totalEPGs: mockEndpointGroups.length,
    totalContracts: mockContracts.length,
  }
}
