import { Vowel, createTanStackAdapters } from '@vowel.to/client'
import { router } from './router'
import {
  updateFilters as updateDeviceFilters,
  clearFilters as clearDeviceFilters,
  selectDevice,
} from '@/store/deviceStore'
import {
  updateFilters as updateEventFilters,
  clearFilters as clearEventFilters,
  selectEvent,
} from '@/store/eventStore'
import {
  createUpdateWorkflow,
  startUpdateWorkflow,
  cancelUpdateWorkflow,
  updateStore,
} from '@/store/updateStore'
import {
  updateTopologyFilters,
  clearTopologyFilters,
} from '@/store/topologyStore'
import { getAllDevices, getDeviceById, getDeviceByDeviceId, getOutdatedDevices } from '@/data/devices'
import { getAllFirmwareVersions, getLatestFirmware } from '@/data/firmware'
import type { Device, DeviceType, DeviceStatus } from '@/data/devices'
import type { EventSeverity, EventCategory } from '@/data/events'
import { getAllEvents, getDeviceIdsWithEvents } from '@/data/events'
import { generateTopologyNodes } from '@/data/topology'
import { getAllTenants, getTenantById } from '@/data/tenants'
import { setSelectedTenant } from '@/store/tenantStore'
import { createNote, getAllNotes, updateNote, deleteNote } from '@/store/notesStore'

/**
 * VAD Configuration - Use server-side VAD like the auto parts demo
 * Server-side VAD uses AssemblyAI ASR with integrated VAD, which works better
 * on older devices and provides more consistent turn detection.
 */
const USE_SERVER_VAD = true

let vowelInstance: Vowel | null = null

type VowelChangeListener = (client: Vowel | null) => void
const vowelChangeListeners = new Set<VowelChangeListener>()

// Create adapters lazily to avoid circular dependency with router initialization
let navigationAdapter: ReturnType<typeof createTanStackAdapters>['navigationAdapter'] | null = null

function getNavigationAdapter() {
  if (!navigationAdapter) {
    const adapters = createTanStackAdapters({
      router: router as any,
      enableAutomation: false,
    })
    navigationAdapter = adapters.navigationAdapter
  }
  return navigationAdapter
}

/**
 * Terseness instruction sets - concatenated into the main instructions
 */
/** Maximum brevity - one short sentence, counts only, no closing phrases */
const TERSENESS_HIGH = `
## CRITICAL: Terseness - HIGH (Maximum Brevity)
**Strong default: say the absolute least amount of verbiage.** Use counts only, never device hostnames/IDs/models. One short sentence maximum. **NEVER** add closing phrases like "Let me know if I can do anything else"—if the user needs something, they will ask.

**Override**: If the user explicitly asks for more detail (e.g. "expound", "more detail", "explain", "tell me more", "what specifically"), then provide fuller answers—device names, models, breakdowns—as requested. Terseness is the default; explicit requests for detail override it.

**Default (terse—prefer)**: "3 devices." / "5 switches, 2 routers." / "1 critical." / "Done." / "Updated."
**When user asks for detail**: "There are 3 devices with critical events: router core 03 with high CPU, switch access 16 offline, firewall 02 with a CVE alert." (Omit hyphens when speaking—say "router core 03" not "router hyphen core hyphen 03".)
**Negative (verbose without being asked—avoid)**: Unprompted long lists, explanations, or "Let me know if I can help with anything else."
`

/** Unselected option - use TERSENESS_HIGH for maximum brevity (kept for reference) */
// @ts-expect-error - kept for reference, not currently used
const TERSENESS_MEDIUM_HIGH = `
## CRITICAL: Terseness - MEDIUM-HIGH (Default)
**Default: be concise but natural.** Use 1-2 short sentences maximum. You may mention general device types (e.g., "3 routers, 2 switches, 1 firewall") but never specific hostnames, IDs, or models unless explicitly asked. **CRITICAL: Do NOT repeat yourself**—state the count once and move on. Do not restate the number of devices in multiple ways.

**Override**: If the user explicitly asks for more detail (e.g. "expound", "more detail", "explain", "tell me more", "what specifically"), then provide fuller answers—device names, models, breakdowns—as requested. Terseness is the default; explicit requests for detail override it.

**Default (concise—prefer)**: "3 devices: 2 switches, 1 router." / "5 devices found." / "1 critical event." / "Done." / "Filter applied."
**When user asks for detail**: "There are 3 devices with critical events: router core 03 with high CPU, switch access 16 offline, firewall 02 with a CVE alert." (Omit hyphens when speaking.)
**Negative (verbose/repetitive—avoid)**: "There are 3 devices. You have 3 devices in Building 2. Building 2 has 3 devices." / Unprompted long lists, explanations, or "Let me know if I can help with anything else."
`

function createVowelClient(appId: string): Vowel {
  const vowel = new Vowel({
    appId: appId,
    instructions: `You are a helpful voice assistant for the Network Dashboard - a network management and monitoring application.

` + TERSENESS_HIGH + `

## CRITICAL: Write to App Store, Not DOM
**⚠️ MOST IMPORTANT RULE**: When performing actions, you MUST write to the application store/state management system, NOT manipulate the DOM directly. Always use registered actions that modify the app store. The UI will automatically update to reflect state changes.

## STT / Transcription Gotchas
Speech-to-text often mishears number words as homonyms. **Interpret and correct** before calling actions:
- **"too" / "to"** in building/floor context → usually means **"two"** (Building 2, floor 2). Use filterDevicesByBuilding with building: "Building 2", or filterDevicesByFloor with floor: 2.
- **"for"** in number context → may mean **"four"** (floor 4). Note: valid floors are 1, 2, 3—if user says "floor 4" and no floor 4 exists, check context.devices.availableFloors.
- **"ate"** → may mean **"eight"**.
- **"free" / "threw"** → may mean **"three"** (Building 3, floor 3).
- **"floor"** may be misheard as **"for"** or **"four"**—if context suggests location, treat as floor.

When the user says "devices in building two" or "building 2", STT may transcribe "building too". **Treat "building too" as Building 2** and call filterDevicesByBuilding with building: "Building 2". Valid buildings: Building 1, Building 2, Building 3. Valid floors: 1, 2, 3. Check context.devices.availableBuildings and context.devices.availableFloors for current values.

## TTS / Speaking: Omit Hyphens in Device Names
When **speaking** device names or hostnames that contain hyphens (e.g. router-core-03, switch-access-16), **omit the hyphens**—say "router core 03" or "switch access 16" instead of "router hyphen core hyphen 03". The TTS engine tends to read hyphens literally as the word "hyphen", which sounds unnatural. Apply this to any identifiers you read aloud: hostnames, device IDs with dashes, model names, etc.

## CRITICAL: Always Refer to Context for Information
Before answering ANY question or performing ANY action, ALWAYS check the <context> section for current information. The context contains the most up-to-date state of the application.

## Current Application State:
The current state (devices, events, firmware, updates) is automatically provided in the <context> section. You always have access to the latest state - no need to call any actions to read it.

**context.ui.currentRoute** tells you the current page (e.g. "/", "/devices", "/events", "/topology", "/firmware"). Use this to know where the user is before acting.

## CRITICAL: Always Navigate to the Most Relevant Page
When the user **asks about something**—whether they say "show me" or not—**always** take them to the most relevant page that can display or answer their question. Ignore the current page. Examples: "how many devices need firmware updates" → /firmware; "how many critical events" → /events; "which devices are offline" → /devices; "show me my notes" → /notes.

**Procedure for any question that has a corresponding page:**
1. **Identify the most relevant page** for the user's intent (see mapping below).
2. **Navigate to that page**—ignore context.ui.currentRoute.
3. **Call the appropriate action** (which applies filters and/or returns data). Most actions navigate automatically.

**Most relevant page by intent:**
- Device list, "which devices", "devices with X", device counts → /devices
- Event timeline, "what events", "event log", "critical events" (as log) → /events
- Firmware updates, devices needing updates → /firmware
- Alerts by severity/status → /alerts
- Tenant details, VRFs, EPGs → /tenants
- **Notes**, "show my notes", "show notes" → /notes (use showNotes action)
- Topology/network map (only when explicitly asked) → /topology

**CRITICAL – Topology only when explicitly requested**: Do NOT navigate to /topology or use any topology filters unless the user explicitly asks for "topology", "network map", "device graph", or similar. For generic "devices with X events" or "show me critical devices" requests, use /devices or /events—never topology.

**Pages that can show "devices with events" (critical/unacknowledged/warning/etc.):**
- /devices → filterDevicesByEventStatus (device list). Supports severity + acknowledged. **Default for "devices with X events" when user does NOT ask for topology.**
- /events → filterEventsBySeverity + filterEventsByAcknowledged (event log filtered—shows events tied to devices). **Use when user asks for event log / "show me critical events" (the timeline).**
- /topology → filterTopologyByEventStatus. **ONLY when user explicitly asks for topology** (e.g. "topology with critical events", "show me the network map with devices having warnings").

**Examples – always navigate to the most relevant page:**
- "How many devices need firmware updates?" → Call getDevicesNeedingUpdates (navigates to /firmware, returns count).
- "How many critical events?" / "What events do I have?" → Call filterEventsBySeverity (navigates to /events).
- "Which devices are offline?" / "How many devices in building 2?" → Call filterDevicesByStatus or filterDevicesByBuilding (navigates to /devices).
- "Show me devices with critical events" → Call filterDevicesByEventStatus (navigates to /devices).
- "Show me critical events" (event log) → Call filterEventsBySeverity (navigates to /events).
- "Show me my notes" / "How many notes do I have?" → Call showNotes (navigates to /notes).

**Other mappings (single page per query type):**
- Alerts by severity/status → /alerts (filterAlertsBySeverity, filterAlertsByStatus)
- Event log by severity/category (the timeline of events, not devices) → /events (filterEventsBySeverity, etc.)
- Firmware updates → /firmware

**Principle**: When the user asks about something that has a corresponding page, always take them there—regardless of whether they said "show" or not. "How many devices need firmware updates" → firmware page. "How many critical events" → events page. Ignore current page.

**When showing filtered results**: Apply the terseness principle above—counts by default; expand with device names/models only when the user explicitly asks for more detail.

## Routes and What Each Page Can Show

| Route | What it shows | Use for |
|-------|---------------|---------|
| / (Dashboard) | Overview stats, charts, quick actions | High-level summary only; no per-device or event filtering |
| /devices | **Device list** (table/list of devices) | Search devices, filter by type/status/building/**event status** |
| /devices/$id | Single device detail | One device's config, ports, history |
| /topology | **Device graph** (network map of devices) | **ONLY when user explicitly asks for topology** (e.g. "show topology", "network map", "topology with critical events"). Can filter by event severity/acknowledged, firmware update needed, building, and floor. |
| /events | **Event log** (timeline of individual events) | Filter by severity/category/acknowledged. When user says "show me events" or "show critical events", navigate here and apply filters. |
| /alerts | Alert list | Filter alerts by severity, status |
| /firmware | Firmware catalog, update workflows | Firmware management |
| /tenants | Tenant management | Tenants only. Use selectTenant to show a specific tenant's VRFs, BDs, EPGs. |
| /notes | Session notes | Create, view, edit notes. When user says "show me notes" or "show my notes", use showNotes to navigate here. Stored in sessionStorage. |
| /settings | App settings | Settings only |

**Device detail requests**: When the user asks for specific details about a device (e.g. "tell me about RT 0 3", "show me A S 1 5", "what's going on with switch X"), use selectDevice(deviceId) to navigate to /devices/$id. Prefer matching by deviceId (e.g. RT01, DS03, AS15, AP02, FW01) from context.devices.allDevices—these are voice-friendly, no dashes.

**CRITICAL distinction**: "devices with X events" vs "events":
- **"devices with critical/unacknowledged/warning events"** (no topology mentioned) → Navigate to /devices (filterDevicesByEventStatus). **Do NOT use /topology** unless user explicitly asks for topology/network map.
- **"show me critical events"** (event log) → /events (filterEventsBySeverity, etc.).
- **"topology with X" or "show topology" or "network map"** → Only then use /topology and topology filters.

## Available Actions:

### Device Management:
- searchDevices: Search devices by hostname, IP, or model. Navigates to /devices. Parameters: query (string).
- filterDevicesByType: Filter devices by type. Navigates to /devices. Parameters: type (router|switch|access-point|firewall).
- filterDevicesByStatus: Filter devices by status. Navigates to /devices. Parameters: status (online|offline|warning|critical). Use when user asks "which devices are offline", "how many critical devices", etc.
- filterDevicesByBuilding: Filter devices by building. Navigates to /devices. Parameters: building (string), floor (number, optional). Valid buildings: "Building 1", "Building 2", "Building 3". Use when user says "devices in building 2", "how many devices in building 2", etc.
- filterDevicesByFloor: Filter devices by floor across all buildings. Navigates to /devices. Parameters: floor (number). Valid floors: 1, 2, 3. Use when user says "devices on floor 2", "show floor 3", "what's on floor 1".
- filterDevicesByEventStatus: Filter devices to those that have events with a specific severity or acknowledgment status. Parameters: severity (critical|warning|info|success), and/or acknowledged (true|false). Use when user asks for "devices with critical events", "devices with unacknowledged events", etc.
- clearDeviceFilters: Clear all device filters.
- selectDevice: Select a specific device and navigate to its detail page. Parameters: deviceId (string). **Use when the user asks for specific details about a device** (e.g. "tell me about router X", "show me switch core-01", "what's the status of device DEV-123", "open the firewall page"). Navigates to /devices/$id so the user sees config, ports, and history.

### Event Management:
- filterEventsBySeverity: Filter events by severity. Navigates to /events. Parameters: severity (critical|warning|info|success). Use when user asks "how many critical events", "show critical events", etc.
- filterEventsByCategory: Filter events by category. Navigates to /events. Parameters: category (device|alert|config|security|system).
- filterEventsByAcknowledged: Filter events by acknowledgment status. Navigates to /events. Parameters: acknowledged (acknowledged|unacknowledged).
- clearEventFilters: Clear all event filters.
- selectEvent: Select a specific event. Parameters: eventId (string).

### Topology (ONLY when user explicitly asks for topology/network map):
- filterTopologyByEventStatus: Filter topology view to show only devices that have events with a specific severity and/or acknowledgment status. Navigates to topology page. Parameters: severity (critical|warning|info|success), acknowledged (true|false). **Use ONLY when user explicitly says "topology"** (e.g. "show topology with critical events", "topology with devices having unacknowledged events").
- filterTopologyByFirmwareUpdate: Filter topology view to show only devices that need firmware updates. Navigates to topology page. **Use ONLY when user explicitly asks for topology** (e.g. "topology with devices needing firmware updates").
- filterTopologyByBuilding: Filter topology view to devices in a building. Parameters: building (string), floor (number, optional). Navigates to topology page. **Use ONLY when user says "topology"** (e.g. "topology for building 2", "show building 3 on topology").
- filterTopologyByFloor: Filter topology view to devices on a floor. Parameters: floor (number). Navigates to topology page. **Use ONLY when user says "topology"** (e.g. "topology for floor 2", "show floor 3 on topology").
- clearTopologyFilters: Clear topology filters (event, firmware, and location).

### Tenant Management:
- selectTenant: Navigate to tenants page and select a specific tenant to show its VRFs, Bridge Domains, and EPGs. Parameters: tenantId (string). Use when user asks for tenant details (e.g. "show me Production tenant", "what's in the DMZ tenant", "open Development"). Match tenant name or ID from context.tenants.allTenants.

### Firmware Management:
- getDevicesNeedingUpdates: Get list of devices with outdated firmware. Navigates to /firmware. Use when user asks "how many devices need firmware updates", "which devices need updates", etc.
- createFirmwareUpdate: Create a firmware update workflow. Parameters: deviceIds (array of strings), firmwareVersion (string).
- startFirmwareUpdate: Start a pending firmware update. Parameters: workflowId (string).
- cancelFirmwareUpdate: Cancel a firmware update. Parameters: workflowId (string).

### Notes:
- **showNotes**: Navigate to /notes so the user sees their notes in the UI. **Use when user says "show me notes", "show my notes", "how many notes do I have", "what notes do I have"**—always navigate to the notes page. Returns count for terse response.
- createNote: Create a new note. Parameters: title (string), content (string, optional). Navigates to /notes.
- listNotes: List all notes (count and titles). Does NOT navigate. Prefer showNotes when the user asks about notes—it navigates and returns count.
- updateNote: Update a note. Parameters: noteId (string), title (string, optional), content (string, optional).
- deleteNote: Delete a note. Parameters: noteId (string).

## How to Use:
- To navigate: Say "go to devices" or "show me events" or "open firmware page"
- **For device details**: Say "show me router core 03" or "tell me about switch X" or "open device DEV-001"—use selectDevice to navigate to the device detail page
- **For tenant details**: Say "show me Production tenant" or "open DMZ" or "what's in Development"—use selectTenant to navigate to /tenants with that tenant selected
- **For location filtering**: Say "devices in building 2", "building 3 floor 2", "show floor 2 devices", "devices on floor 1"—use filterDevicesByBuilding (with optional floor) or filterDevicesByFloor on /devices. **For topology** (only when user explicitly asks): "topology for building 2", "show floor 3 on topology"—use filterTopologyByBuilding or filterTopologyByFloor. Check context.devices.availableBuildings and context.devices.availableFloors for valid values.
- To search/filter: Say "search for devices named core" or "show critical events" or "show devices with critical events" or "devices with unacknowledged events"—use /devices or /events. For topology (explicit only): "show topology with critical events" or "topology view"
- **For any question with a corresponding page**: Always take the user to the most relevant page—whether they said "show" or not. E.g. "how many devices need firmware updates" → getDevicesNeedingUpdates (goes to /firmware); "how many critical events" → filterEventsBySeverity (goes to /events).
- To update firmware: Say "create firmware update for device DEV-001" or "start update WORKFLOW-123"
- For notes: Say "show me my notes" or "show notes" (use showNotes—navigates to /notes), "add a note", "create note about X", "go to notes", or "how many notes do I have"
- **DO NOT use DOM manipulation** - always use the registered actions

Help users navigate and manage their network infrastructure through voice commands.`,

    navigationAdapter: getNavigationAdapter(),
    floatingCursor: { enabled: false },

    borderGlow: {
      enabled: true,
      color: 'rgba(99, 102, 241, 0.5)',
      intensity: 30,
      pulse: true,
    },

    /** Caption system - Real-time speech captions displayed as floating toast notifications */
    // @ts-ignore - Internal feature, may not be fully typed
    _caption: {
      enabled: true,
      position: 'top-center',
      maxWidth: '600px',
      showRole: true,
      showOnMobile: false,
    },

    _voiceConfig: {
      // Default: vowel.to hosted voice service
      provider: 'vowel-prime',
      voice: 'Timothy',
      language: 'en-US',
      initialGreetingPrompt: `Check the context for action items: critical events (context.events.stats.critical), unacknowledged events, devices needing firmware updates, and pending firmware workflows. If there are action items: if there are many (3+), summarize in 1-2 sentences. If there are few (1-2), mention them specifically. If none, say "Hello, how can I help?". Be terse and get out of the user's way immediately.`,

      /** Turn detection: server-side VAD (AssemblyAI STT with integrated VAD) */
      ...(USE_SERVER_VAD
        ? {
            turnDetection: {
              mode: 'server_vad' as const,
              serverVAD: {
                threshold: 0.5,
                prefixPaddingMs: 350,
                silenceDurationMs: 550,
                interruptResponse: true,
              },
            },
          }
        : {}),
    },

    onUserSpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🗣️ User started speaking' : '🔇 User stopped speaking')
    },
    onAIThinkingChange: (isThinking) => {
      console.log(isThinking ? '🧠 AI started thinking' : '💭 AI stopped thinking')
    },
    onAISpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🔊 AI started speaking' : '🔇 AI stopped speaking')
    },
  })

  registerCustomActions(vowel)
  return vowel
}

export function setAppId(appId: string) {
  vowelInstance = createVowelClient(appId)
  console.log('✅ Vowel client initialized with App ID:', appId)
  vowelChangeListeners.forEach((listener) => listener(vowelInstance))
}

export function getVowel(): Vowel | null {
  return vowelInstance
}

export function subscribeToVowelChanges(listener: VowelChangeListener): () => void {
  vowelChangeListeners.add(listener)
  // Immediately notify listener if client already exists
  if (vowelInstance) {
    listener(vowelInstance)
  }
  return () => {
    vowelChangeListeners.delete(listener)
  }
}

function registerCustomActions(vowel: Vowel) {
  // Device Actions
  vowel.registerAction(
    'searchDevices',
    {
      description: 'Search devices by hostname, IP address, or model name',
      parameters: {
        query: { type: 'string', description: 'Search query string' },
      },
    },
    async ({ query }) => {
      updateDeviceFilters({ query })
      const filtered = getAllDevices().filter(
        (d) =>
          d.hostname.toLowerCase().includes(query.toLowerCase()) ||
          d.ipAddress.includes(query) ||
          d.model.toLowerCase().includes(query.toLowerCase())
      )
      router.navigate({ to: '/devices' })
      return {
        success: true,
        message: `Found ${filtered.length} devices matching "${query}"`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'filterDevicesByType',
    {
      description: 'Filter devices by device type',
      parameters: {
        type: {
          type: 'string',
          description: 'Device type to filter by',
          enum: ['router', 'switch', 'access-point', 'firewall'],
        },
      },
    },
    async ({ type }) => {
      updateDeviceFilters({ type: type as DeviceType })
      const filtered = getAllDevices().filter((d) => d.type === type)
      router.navigate({ to: '/devices' })
      return {
        success: true,
        message: `Filtered to ${filtered.length} ${type} devices`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'filterDevicesByStatus',
    {
      description: 'Filter devices by status',
      parameters: {
        status: {
          type: 'string',
          description: 'Status to filter by',
          enum: ['online', 'offline', 'warning', 'critical'],
        },
      },
    },
    async ({ status }) => {
      updateDeviceFilters({ status: status as DeviceStatus })
      const filtered = getAllDevices().filter((d) => d.status === status)
      router.navigate({ to: '/devices' })
      return {
        success: true,
        message: `Found ${filtered.length} devices with ${status} status`,
        count: filtered.length,
      }
    }
  )

  /**
   * Filter devices by building and optionally by floor.
   * Use when user says "devices in building 2", "building 3 floor 2", "show me building 1 devices", etc.
   * Valid buildings: Building 1, Building 2, Building 3. Floors: 1, 2, 3.
   */
  vowel.registerAction(
    'filterDevicesByBuilding',
    {
      description:
        'Filter devices by building location. Optionally filter by floor within that building. Use when user says "devices in building 2", "building 3 floor 2", "show me building 1 devices". Valid buildings: Building 1, Building 2, Building 3.',
      parameters: {
        building: { type: 'string', description: 'Building name (e.g. "Building 1", "Building 2", "Building 3")' },
        floor: {
          type: 'number',
          description: 'Optional floor number within the building (1, 2, or 3). Use when user specifies both building and floor.',
          optional: true,
        },
      },
    },
    async ({ building, floor }) => {
      updateDeviceFilters({ building, floor })
      const filtered = getAllDevices().filter(
        (d) =>
          d.location.building === building && (floor === undefined || d.location.floor === floor)
      )
      router.navigate({ to: '/devices' })
      const locDesc = floor !== undefined ? `${building}, Floor ${floor}` : building
      return {
        success: true,
        message: `Found ${filtered.length} devices in ${locDesc}`,
        count: filtered.length,
      }
    }
  )

  /**
   * Filter devices by floor (across all buildings).
   * Use when user says "devices on floor 2", "show floor 3 devices", "what's on floor 1", etc.
   */
  vowel.registerAction(
    'filterDevicesByFloor',
    {
      description:
        'Filter devices by floor number across all buildings. Use when user says "devices on floor 2", "show floor 3 devices", "what\'s on floor 1". Valid floors: 1, 2, 3.',
      parameters: {
        floor: { type: 'number', description: 'Floor number (1, 2, or 3)' },
      },
    },
    async ({ floor }) => {
      updateDeviceFilters({ floor, building: undefined })
      const filtered = getAllDevices().filter((d) => d.location.floor === floor)
      router.navigate({ to: '/devices' })
      return {
        success: true,
        message: `Found ${filtered.length} devices on Floor ${floor}`,
        count: filtered.length,
      }
    }
  )

  /**
   * Filter network devices to those that have events with a specific severity and/or
   * acknowledgment status. Navigates to devices page so the filtered list is visible.
   * Use when user asks e.g. "show devices with critical events" or "devices with unacknowledged events".
   */
  vowel.registerAction(
    'filterDevicesByEventStatus',
    {
      description:
        'Filter devices to those that have events with a specific severity (critical, warning, info, success) and/or acknowledgment status (acknowledged vs unacknowledged). Navigates to devices page. Use when user asks for "devices with critical events", "devices with unacknowledged events", etc.',
      parameters: {
        severity: {
          type: 'string',
          description: 'Event severity to filter by',
          enum: ['critical', 'warning', 'info', 'success'],
        },
        acknowledged: {
          type: 'boolean',
          description:
            'If true, filter to devices with acknowledged events. If false, filter to devices with unacknowledged events.',
        },
      },
    },
    async ({ severity, acknowledged }) => {
      const deviceIdsWithEvents = getDeviceIdsWithEvents(
        severity as EventSeverity | undefined,
        acknowledged
      )
      const allDevices = getAllDevices()
      const allEvents = getAllEvents()
      const filtered = allDevices.filter((d) => deviceIdsWithEvents.has(d.id))

      /** Build device summary for AI: hostname, type, and event title for actionable summary */
      const devices = filtered.map((d) => {
        const matchingEvents = allEvents.filter(
          (e) =>
            e.deviceId === d.id &&
            (severity == null || e.severity === severity) &&
            (acknowledged === undefined || e.acknowledged === acknowledged)
        )
        const eventTitle = matchingEvents[0]?.title ?? 'event'
        return { hostname: d.hostname, type: d.type, eventTitle, severity: matchingEvents[0]?.severity }
      })

      updateDeviceFilters({
        eventSeverity: severity as EventSeverity | undefined,
        eventAcknowledged: acknowledged,
      })

      /** Navigate to devices page so user sees the filtered list */
      router.navigate({ to: '/devices' })

      const statusDesc = []
      if (severity) statusDesc.push(`${severity} events`)
      if (acknowledged !== undefined) statusDesc.push(acknowledged ? 'acknowledged' : 'unacknowledged')
      const statusStr = statusDesc.join(', ')

      return {
        success: true,
        message: `Found ${filtered.length} devices with ${statusStr}`,
        count: filtered.length,
        devices,
      }
    }
  )

  vowel.registerAction(
    'clearDeviceFilters',
    {
      description: 'Clear all device filters',
      parameters: {},
    },
    async () => {
      clearDeviceFilters()
      return {
        success: true,
        message: 'Device filters cleared',
      }
    }
  )

  /**
   * Filter topology view to devices that have events with a specific severity and/or
   * acknowledgment status. Navigates to topology page so the filtered view is visible.
   */
  vowel.registerAction(
    'filterTopologyByEventStatus',
    {
      description:
        'Filter the topology view to show only devices that have events with a specific severity (critical, warning, info, success) and/or acknowledgment status. Navigates to topology page. Use ONLY when user explicitly asks for topology (e.g. "topology with critical events", "show topology with unacknowledged events"). Do NOT use for generic "devices with X events" requests—use filterDevicesByEventStatus instead.',
      parameters: {
        severity: {
          type: 'string',
          description: 'Event severity to filter by',
          enum: ['critical', 'warning', 'info', 'success'],
        },
        acknowledged: {
          type: 'boolean',
          description:
            'If true, filter to devices with acknowledged events. If false, filter to devices with unacknowledged events.',
        },
      },
    },
    async ({ severity, acknowledged }) => {
      const deviceIdsWithEvents = getDeviceIdsWithEvents(
        severity as EventSeverity | undefined,
        acknowledged
      )
      const topologyNodes = generateTopologyNodes()
      const allDevices = getAllDevices()
      const allEvents = getAllEvents()
      const filteredNodes = topologyNodes.filter((n) => deviceIdsWithEvents.has(n.id))

      /** Build device summary for AI: hostname, type, and event title for actionable summary */
      const devices = filteredNodes.map((node) => {
        const d = allDevices.find((dev) => dev.id === node.id)
        if (!d) return { hostname: node.id, type: 'unknown', eventTitle: 'event', severity: severity }
        const matchingEvents = allEvents.filter(
          (e) =>
            e.deviceId === d.id &&
            (severity == null || e.severity === severity) &&
            (acknowledged === undefined || e.acknowledged === acknowledged)
        )
        const eventTitle = matchingEvents[0]?.title ?? 'event'
        return { hostname: d.hostname, type: d.type, eventTitle, severity: matchingEvents[0]?.severity }
      })

      updateTopologyFilters({
        eventSeverity: severity as EventSeverity | undefined,
        eventAcknowledged: acknowledged,
      })

      /** Navigate to topology page so user sees the filtered view */
      router.navigate({ to: '/topology' })

      const statusDesc = []
      if (severity) statusDesc.push(`${severity} events`)
      if (acknowledged !== undefined) statusDesc.push(acknowledged ? 'acknowledged' : 'unacknowledged')
      const statusStr = statusDesc.join(', ')

      return {
        success: true,
        message: `Topology filtered to ${filteredNodes.length} devices with ${statusStr}`,
        count: filteredNodes.length,
        devices,
      }
    }
  )

  /**
   * Filter topology view to devices that need firmware updates.
   * Navigates to topology page so the filtered view is visible.
   */
  vowel.registerAction(
    'filterTopologyByFirmwareUpdate',
    {
      description:
        'Filter the topology view to show only devices that need firmware updates. Navigates to topology page. Use ONLY when user explicitly asks for topology (e.g. "topology with devices needing firmware updates"). Do NOT use for generic "devices needing updates" requests—use /devices or filterDevicesByEventStatus.',
      parameters: {},
    },
    async () => {
      const outdatedDevices = getOutdatedDevices()
      const topologyNodes = generateTopologyNodes()
      const outdatedIds = new Set(outdatedDevices.map((d) => d.id))
      const filteredNodes = topologyNodes.filter((n) => outdatedIds.has(n.id))

      updateTopologyFilters({ firmwareUpdateNeeded: true })
      router.navigate({ to: '/topology' })

      const devices = filteredNodes.map((node) => {
        const d = outdatedDevices.find((dev) => dev.id === node.id)
        return d
          ? {
              hostname: d.hostname,
              type: d.type,
              currentVersion: d.firmware.version,
              latestVersion: getLatestFirmware(d.firmware.type as import('@/data/firmware').FirmwareType)?.version,
            }
          : null
      }).filter(Boolean)

      return {
        success: true,
        message: `Topology filtered to ${filteredNodes.length} devices needing firmware updates`,
        count: filteredNodes.length,
        devices,
      }
    }
  )

  /**
   * Filter topology view to devices in a building. Optionally by floor.
   * Use when user says "topology for building 2", "show building 3 on topology", "building 2 floor 3 topology".
   */
  vowel.registerAction(
    'filterTopologyByBuilding',
    {
      description:
        'Filter the topology view to show only devices in a building. Optionally filter by floor. Navigates to topology page. Use ONLY when user explicitly asks for topology (e.g. "topology for building 2", "show building 3 on topology"). For generic "devices in building X" use filterDevicesByBuilding on /devices.',
      parameters: {
        building: { type: 'string', description: 'Building name (e.g. "Building 1", "Building 2", "Building 3")' },
        floor: {
          type: 'number',
          description: 'Optional floor number within the building (1, 2, or 3)',
          optional: true,
        },
      },
    },
    async ({ building, floor }) => {
      updateTopologyFilters({ building, floor })
      router.navigate({ to: '/topology' })
      const allDevices = getAllDevices()
      const filtered = allDevices.filter(
        (d) =>
          d.location.building === building && (floor === undefined || d.location.floor === floor)
      )
      const locDesc = floor !== undefined ? `${building}, Floor ${floor}` : building
      return {
        success: true,
        message: `Topology filtered to ${filtered.length} devices in ${locDesc}`,
        count: filtered.length,
      }
    }
  )

  /**
   * Filter topology view to devices on a floor (across all buildings).
   * Use when user says "topology for floor 2", "show floor 3 on topology".
   */
  vowel.registerAction(
    'filterTopologyByFloor',
    {
      description:
        'Filter the topology view to show only devices on a floor. Navigates to topology page. Use ONLY when user explicitly asks for topology (e.g. "topology for floor 2", "show floor 3 on topology"). For generic "devices on floor X" use filterDevicesByFloor on /devices.',
      parameters: {
        floor: { type: 'number', description: 'Floor number (1, 2, or 3)' },
      },
    },
    async ({ floor }) => {
      updateTopologyFilters({ floor, building: undefined })
      router.navigate({ to: '/topology' })
      const allDevices = getAllDevices()
      const filtered = allDevices.filter((d) => d.location.floor === floor)
      return {
        success: true,
        message: `Topology filtered to ${filtered.length} devices on Floor ${floor}`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'clearTopologyFilters',
    {
      description: 'Clear topology filters (event, firmware, and location)',
      parameters: {},
    },
    async () => {
      clearTopologyFilters()
      return {
        success: true,
        message: 'Topology filters cleared',
      }
    }
  )

  vowel.registerAction(
    'selectDevice',
    {
      description:
        'Select a specific device and navigate to its detail page. Use when the user asks for specific details about a device (e.g. "tell me about RT 0 3", "show me A S 1 5", "what\'s the status of FW 0 2"). Use deviceId from context (RT01, DS03, AS15, AP02, FW01)—voice-friendly, no dashes.',
      parameters: {
        deviceId: { type: 'string', description: 'Device ID: RT01-RT05 routers, DS01-DS12 dist switches, AS01-AS30 access switches, AP01-AP08 APs, FW01-FW03 firewalls' },
      },
    },
    async ({ deviceId }) => {
      const device = getDeviceByDeviceId(deviceId) ?? getDeviceById(deviceId)
      if (!device) {
        return { success: false, message: `Device ${deviceId} not found` }
      }
      selectDevice(device.id)
      /** Navigate to device detail page so user sees config, ports, history */
      router.navigate({ to: '/devices/$deviceId', params: { deviceId: device.id } })
      return {
        success: true,
        message: `Showing ${device.deviceId} (${device.hostname})—config, ports, and event history`,
        device: {
          id: device.id,
          deviceId: device.deviceId,
          hostname: device.hostname,
          model: device.model,
          status: device.status,
        },
      }
    }
  )

  vowel.registerAction(
    'selectTenant',
    {
      description:
        'Navigate to tenants page and select a specific tenant to show its VRFs, Bridge Domains, and EPGs. Use when user asks for tenant details (e.g. "show me Production tenant", "what\'s in the DMZ tenant", "open Development"). Match tenant name or ID from context.tenants.allTenants.',
      parameters: {
        tenantId: { type: 'string', description: 'Tenant ID (e.g. tenant-prod, tenant-dev, tenant-dmz, tenant-mgmt)' },
      },
    },
    async ({ tenantId }) => {
      /** Match by ID or by name (case-insensitive) */
      const tenant =
        getTenantById(tenantId) ??
        getAllTenants().find(
          (t) => t.name.toLowerCase() === tenantId.toLowerCase() || t.id.toLowerCase() === tenantId.toLowerCase()
        )
      if (!tenant) {
        return {
          success: false,
          message: `Tenant "${tenantId}" not found. Available: ${getAllTenants().map((t) => `${t.name} (${t.id})`).join(', ')}`,
        }
      }
      setSelectedTenant(tenant.id)
      router.navigate({ to: '/tenants' })
      return {
        success: true,
        message: `Showing ${tenant.name}—VRFs, Bridge Domains, and EPGs`,
        tenant: { id: tenant.id, name: tenant.name, deviceCount: tenant.deviceCount },
      }
    }
  )

  // Event Actions
  vowel.registerAction(
    'filterEventsBySeverity',
    {
      description: 'Filter events by severity level',
      parameters: {
        severity: {
          type: 'string',
          description: 'Severity level',
          enum: ['critical', 'warning', 'info', 'success'],
        },
      },
    },
    async ({ severity }) => {
      updateEventFilters({ severity: severity as EventSeverity })
      const filtered = getAllEvents().filter((e) => e.severity === severity)
      router.navigate({ to: '/events' })
      return {
        success: true,
        message: `Found ${filtered.length} ${severity} events`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'filterEventsByCategory',
    {
      description: 'Filter events by category',
      parameters: {
        category: {
          type: 'string',
          description: 'Event category',
          enum: ['device', 'alert', 'config', 'security', 'system'],
        },
      },
    },
    async ({ category }) => {
      updateEventFilters({ category: category as EventCategory })
      const filtered = getAllEvents().filter((e) => e.category === category)
      router.navigate({ to: '/events' })
      return {
        success: true,
        message: `Found ${filtered.length} ${category} events`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'filterEventsByAcknowledged',
    {
      description: 'Filter events by acknowledgment status',
      parameters: {
        acknowledged: {
          type: 'string',
          description: 'Acknowledgment status',
          enum: ['acknowledged', 'unacknowledged'],
        },
      },
    },
    async ({ acknowledged }) => {
      updateEventFilters({ acknowledged: acknowledged as 'acknowledged' | 'unacknowledged' })
      const filtered = getAllEvents().filter((e) => 
        acknowledged === 'acknowledged' ? e.acknowledged : !e.acknowledged
      )
      router.navigate({ to: '/events' })
      return {
        success: true,
        message: `Found ${filtered.length} ${acknowledged} events`,
        count: filtered.length,
      }
    }
  )

  vowel.registerAction(
    'clearEventFilters',
    {
      description: 'Clear all event filters',
      parameters: {},
    },
    async () => {
      clearEventFilters()
      return {
        success: true,
        message: 'Event filters cleared',
      }
    }
  )

  vowel.registerAction(
    'selectEvent',
    {
      description: 'Select a specific event by ID',
      parameters: {
        eventId: { type: 'string', description: 'Event ID' },
      },
    },
    async ({ eventId }) => {
      const events = getAllEvents()
      const event = events.find((e) => e.id === eventId)
      if (!event) {
        return { success: false, message: `Event ${eventId} not found` }
      }
      selectEvent(eventId)
      return {
        success: true,
        message: `Selected event: ${event.title}`,
        event: {
          id: event.id,
          title: event.title,
          severity: event.severity,
          category: event.category,
        },
      }
    }
  )

  // Firmware Actions
  vowel.registerAction(
    'getDevicesNeedingUpdates',
    {
      description: 'Get list of devices with outdated firmware',
      parameters: {},
    },
    async () => {
      const devices = getAllDevices()
      const needingUpdates = devices
        .map((device) => {
          const latestVersion = getLatestFirmware(device.firmware.type as import('@/data/firmware').FirmwareType)
          if (latestVersion && latestVersion.version !== device.firmware.version) {
            return {
              deviceId: device.deviceId,
              hostname: device.hostname,
              currentVersion: device.firmware.version,
              latestVersion: latestVersion.version,
            }
          }
          return null
        })
        .filter(Boolean)

      router.navigate({ to: '/firmware' })
      return {
        success: true,
        message: `Found ${needingUpdates.length} devices needing firmware updates`,
        devices: needingUpdates,
        count: needingUpdates.length,
      }
    }
  )

  vowel.registerAction(
    'createFirmwareUpdate',
    {
      description: 'Create a firmware update workflow for one or more devices. Provide device IDs as a comma-separated list (e.g. RT01,AS15,FW02).',
      parameters: {
        deviceIds: {
          type: 'string',
          description: 'Comma-separated device IDs: RT01-RT05, DS01-DS12, AS01-AS30, AP01-AP08, FW01-FW03 (voice-friendly, no dashes)',
        },
        firmwareVersion: {
          type: 'string',
          description: 'Target firmware version (optional, defaults to latest)',
          optional: true,
        },
      },
    },
    async ({ deviceIds, firmwareVersion }) => {
      const deviceIdList = deviceIds.split(',').map((id: string) => id.trim()).filter(Boolean)
      const devices: Device[] = []
      for (const idOrDeviceId of deviceIdList) {
        const device = getDeviceByDeviceId(idOrDeviceId) ?? getDeviceById(idOrDeviceId)
        if (device) {
          devices.push(device)
        }
      }

      if (devices.length === 0) {
        return { success: false, message: 'No valid devices found' }
      }

      // Get firmware version to use
      const firmwareVersions = getAllFirmwareVersions()
      let targetFirmware = firmwareVersions[0]

      if (firmwareVersion) {
        targetFirmware = firmwareVersions.find((f) => f.version === firmwareVersion) || targetFirmware
      }

      const workflow = createUpdateWorkflow(
        devices.map((d) => d.id),
        targetFirmware
      )

      return {
        success: true,
        message: `Created firmware update workflow ${workflow.id} for ${devices.length} device(s)`,
        workflowId: workflow.id,
        deviceCount: devices.length,
        targetVersion: targetFirmware.version,
      }
    }
  )

  vowel.registerAction(
    'startFirmwareUpdate',
    {
      description: 'Start a pending firmware update workflow',
      parameters: {
        workflowId: { type: 'string', description: 'Workflow ID to start' },
      },
    },
    async ({ workflowId }) => {
      const workflow = updateStore.workflows.find((w) => w.id === workflowId)
      if (!workflow) {
        return { success: false, message: `Workflow ${workflowId} not found` }
      }
      if (workflow.status !== 'pending') {
        return { success: false, message: `Workflow ${workflowId} is already ${workflow.status}` }
      }

      startUpdateWorkflow(workflowId)
      return {
        success: true,
        message: `Started firmware update workflow ${workflowId}`,
      }
    }
  )

  vowel.registerAction(
    'cancelFirmwareUpdate',
    {
      description: 'Cancel a firmware update workflow',
      parameters: {
        workflowId: { type: 'string', description: 'Workflow ID to cancel' },
      },
    },
    async ({ workflowId }) => {
      const workflow = updateStore.workflows.find((w) => w.id === workflowId)
      if (!workflow) {
        return { success: false, message: `Workflow ${workflowId} not found` }
      }

      cancelUpdateWorkflow(workflowId)
      return {
        success: true,
        message: `Cancelled firmware update workflow ${workflowId}`,
      }
    }
  )

  // Notes Actions
  /**
   * Navigate to /notes so the user sees their notes in the UI.
   * Use when user says "show me notes", "show my notes", "show notes".
   */
  vowel.registerAction(
    'showNotes',
    {
      description:
        'Navigate to the notes page so the user sees their notes in the UI. Use when user says "show me notes", "show my notes", "show notes". Returns count for terse response.',
      parameters: {},
    },
    async () => {
      router.navigate({ to: '/notes' })
      const notes = getAllNotes()
      return {
        success: true,
        count: notes.length,
        message: `${notes.length} note${notes.length === 1 ? '' : 's'}`,
      }
    }
  )

  vowel.registerAction(
    'createNote',
    {
      description: 'Create a new note. Use when user says "add a note", "create note", "note that X", etc.',
      parameters: {
        title: { type: 'string', description: 'Note title' },
        content: { type: 'string', description: 'Note content (optional)', optional: true },
      },
    },
    async ({ title, content }) => {
      createNote(title ?? 'Untitled', content ?? '')
      router.navigate({ to: '/notes' })
      return {
        success: true,
        message: 'Note created',
        count: getAllNotes().length,
      }
    }
  )

  vowel.registerAction(
    'listNotes',
    {
      description:
        'List all notes (count and titles). Use when user asks "how many notes" or "what notes do I have"—verbal answer only, does NOT navigate. For "show me notes", use showNotes instead.',
      parameters: {},
    },
    async () => {
      const notes = getAllNotes()
      return {
        success: true,
        count: notes.length,
        message: `${notes.length} note${notes.length === 1 ? '' : 's'}`,
        notes: notes.map((n) => ({ id: n.id, title: n.title })),
      }
    }
  )

  vowel.registerAction(
    'updateNote',
    {
      description: 'Update an existing note. Parameters: noteId (from context.notes.allNotes), title and/or content.',
      parameters: {
        noteId: { type: 'string', description: 'Note ID (e.g. note-1234567890-abc)' },
        title: { type: 'string', description: 'New title (optional)', optional: true },
        content: { type: 'string', description: 'New content (optional)', optional: true },
      },
    },
    async ({ noteId, title, content }) => {
      const updated = updateNote(noteId, { title, content })
      if (!updated) {
        return { success: false, message: 'Note not found' }
      }
      return { success: true, message: 'Note updated', count: getAllNotes().length }
    }
  )

  vowel.registerAction(
    'deleteNote',
    {
      description: 'Delete a note. Parameters: noteId (from context.notes.allNotes).',
      parameters: {
        noteId: { type: 'string', description: 'Note ID to delete' },
      },
    },
    async ({ noteId }) => {
      const deleted = deleteNote(noteId)
      if (!deleted) {
        return { success: false, message: 'Note not found' }
      }
      return { success: true, message: 'Note deleted', count: getAllNotes().length }
    }
  )
}

export type VowelClientType = Vowel | null
