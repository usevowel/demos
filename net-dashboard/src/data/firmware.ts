/**
 * Mock data for firmware versions
 */

export type FirmwareType = 'IOS-XE' | 'IOS' | 'NX-OS' | 'ASA' | 'FTD'
export type SupportStatus = 'current' | 'deprecated' | 'eol'

export interface FirmwareVersion {
  id: string
  type: FirmwareType
  version: string
  releaseDate: Date
  supportStatus: SupportStatus
  compatibleModels: string[]
  knownIssues: string[]
  cvesFixed: string[]
  downloadSize: string
  estimatedUpdateTime: number // minutes
  prerequisites: string[]
}

export const mockFirmwareVersions: FirmwareVersion[] = [
  // IOS-XE versions
  {
    id: 'ios-xe-17.9.4a',
    type: 'IOS-XE',
    version: '17.9.4a',
    releaseDate: new Date('2025-01-15'),
    supportStatus: 'current',
    compatibleModels: ['ASR 1001-X', 'ASR 1002-HX', 'Catalyst 9200', 'Catalyst 9300', 'Catalyst 9400', 'Catalyst 9130AXI'],
    knownIssues: [],
    cvesFixed: ['CVE-2024-20698', 'CVE-2024-20532'],
    downloadSize: '1.2 GB',
    estimatedUpdateTime: 45,
    prerequisites: ['Minimum 4GB flash', 'IOS-XE 16.x or later'],
  },
  {
    id: 'ios-xe-17.6.5',
    type: 'IOS-XE',
    version: '17.6.5',
    releaseDate: new Date('2024-09-20'),
    supportStatus: 'current',
    compatibleModels: ['ASR 1001-X', 'ASR 1002-HX', 'Catalyst 9200', 'Catalyst 9300', 'Catalyst 9400'],
    knownIssues: ['High CPU usage under certain conditions'],
    cvesFixed: ['CVE-2024-20425'],
    downloadSize: '1.1 GB',
    estimatedUpdateTime: 42,
    prerequisites: ['Minimum 4GB flash', 'IOS-XE 16.x or later'],
  },
  {
    id: 'ios-xe-17.6.3',
    type: 'IOS-XE',
    version: '17.6.3',
    releaseDate: new Date('2024-06-10'),
    supportStatus: 'deprecated',
    compatibleModels: ['ASR 1001-X', 'ASR 1002-HX', 'Catalyst 9200', 'Catalyst 9300', 'Catalyst 9400'],
    knownIssues: ['High CPU on distribution switches', 'Memory leak in OSPF process'],
    cvesFixed: [],
    downloadSize: '1.1 GB',
    estimatedUpdateTime: 42,
    prerequisites: ['Minimum 4GB flash'],
  },
  {
    id: 'ios-xe-16.12.3',
    type: 'IOS-XE',
    version: '16.12.3',
    releaseDate: new Date('2023-11-15'),
    supportStatus: 'deprecated',
    compatibleModels: ['ASR 1001-X', 'ASR 1002-HX', 'Catalyst 9200', 'Catalyst 9300', 'Catalyst 9400'],
    knownIssues: ['Security vulnerabilities present'],
    cvesFixed: [],
    downloadSize: '950 MB',
    estimatedUpdateTime: 40,
    prerequisites: ['Minimum 2GB flash'],
  },
  {
    id: 'ios-xe-16.9.8',
    type: 'IOS-XE',
    version: '16.9.8',
    releaseDate: new Date('2023-03-20'),
    supportStatus: 'eol',
    compatibleModels: ['ASR 1001-X', 'Catalyst 9200', 'Catalyst 9300'],
    knownIssues: ['End of life - no support'],
    cvesFixed: [],
    downloadSize: '900 MB',
    estimatedUpdateTime: 38,
    prerequisites: ['Minimum 2GB flash'],
  },

  // ASA versions
  {
    id: 'asa-9.18.4',
    type: 'ASA',
    version: '9.18.4',
    releaseDate: new Date('2025-01-10'),
    supportStatus: 'current',
    compatibleModels: ['ASA 5525-X', 'ASA 5545-X'],
    knownIssues: [],
    cvesFixed: ['CVE-2024-20359', 'CVE-2024-20412'],
    downloadSize: '280 MB',
    estimatedUpdateTime: 20,
    prerequisites: ['ASA 9.12 or later'],
  },
  {
    id: 'asa-9.16.2',
    type: 'ASA',
    version: '9.16.2',
    releaseDate: new Date('2024-05-15'),
    supportStatus: 'deprecated',
    compatibleModels: ['ASA 5525-X', 'ASA 5545-X'],
    knownIssues: ['Critical security vulnerabilities'],
    cvesFixed: [],
    downloadSize: '265 MB',
    estimatedUpdateTime: 18,
    prerequisites: [],
  },

  // FTD versions
  {
    id: 'ftd-7.4.1',
    type: 'FTD',
    version: '7.4.1',
    releaseDate: new Date('2024-12-20'),
    supportStatus: 'current',
    compatibleModels: ['Firepower 2110', 'Firepower 2120', 'Firepower 2130'],
    knownIssues: [],
    cvesFixed: ['CVE-2024-20439'],
    downloadSize: '3.8 GB',
    estimatedUpdateTime: 90,
    prerequisites: ['FMC 7.2 or later', 'Minimum 128GB SSD'],
  },
  {
    id: 'ftd-7.2.5',
    type: 'FTD',
    version: '7.2.5',
    releaseDate: new Date('2024-08-10'),
    supportStatus: 'current',
    compatibleModels: ['Firepower 2110', 'Firepower 2120', 'Firepower 2130'],
    knownIssues: [],
    cvesFixed: [],
    downloadSize: '3.5 GB',
    estimatedUpdateTime: 85,
    prerequisites: ['FMC 7.0 or later'],
  },
]

// Helper functions
export function getAllFirmwareVersions(): FirmwareVersion[] {
  return mockFirmwareVersions
}

export function getFirmwareById(id: string): FirmwareVersion | undefined {
  return mockFirmwareVersions.find(f => f.id === id)
}

export function getFirmwareByType(type: FirmwareType): FirmwareVersion[] {
  return mockFirmwareVersions.filter(f => f.type === type)
}

export function getCurrentFirmwareVersions(): FirmwareVersion[] {
  return mockFirmwareVersions.filter(f => f.supportStatus === 'current')
}

export function getCompatibleFirmware(model: string): FirmwareVersion[] {
  return mockFirmwareVersions.filter(f => 
    f.compatibleModels.some(m => m.includes(model) || model.includes(m))
  )
}

export function getLatestFirmware(type: FirmwareType): FirmwareVersion | undefined {
  const versions = getFirmwareByType(type)
    .filter(f => f.supportStatus === 'current')
    .sort((a, b) => b.releaseDate.getTime() - a.releaseDate.getTime())
  return versions[0]
}
