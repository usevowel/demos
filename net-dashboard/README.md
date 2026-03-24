# Net Dashboard Demo

A voice-powered network infrastructure management dashboard showcasing voice AI capabilities with vowel.to.

## Features

- 🌐 **Interactive Network Topology** - Visualize 58+ network devices across 3 buildings using ReactFlow
- 📊 **Real-time Metrics** - Charts and dashboards showing device health, bandwidth, and events
- 🔔 **Alert Management** - Filter and manage critical/warning/info events by severity
- 🔧 **Firmware Lifecycle** - Track firmware versions and manage update workflows
- 🏢 **Multi-tenancy Views** - Tenant, VRF, and EPG management interfaces
- 📝 **Session Notes** - Voice-controlled note-taking during sessions
- 🔍 **Voice Search** - Find devices, filter by type/status/building using natural language

## Voice Commands

Try these voice commands to control the dashboard:

### Navigation
- "Go to devices"
- "Show me the topology"
- "Navigate to events"
- "Open the firmware page"
- "Show my notes"

### Device Management
- "Show all routers"
- "Filter devices in Building 2"
- "Find devices on Floor 3"
- "Show me critical devices"
- "Which devices are offline?"
- "Show device RT01"

### Event Management
- "How many critical events?"
- "Show unacknowledged events"
- "Filter events by security category"
- "Show me warning events"

### Topology
- "Show topology with critical events"
- "Filter topology to Building 2"
- "Show devices needing firmware updates on topology"

### Firmware
- "How many devices need firmware updates?"
- "Create firmware update for RT01, RT02"
- "Start update workflow WORKFLOW-123"

### Notes
- "Show my notes"
- "Create note about router maintenance"
- "How many notes do I have?"

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool
- **TanStack Router** - File-based routing
- **Valtio** - State management with localStorage persistence
- **ReactFlow** - Interactive topology visualization
- **Recharts** - Metrics and charts
- **Tailwind CSS** - Styling
- **vowel.to** - Voice AI integration

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.1+
- A free vowel.to App ID ([get one here](https://vowel.to))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Configure your App ID:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your vowel.to App ID:
   ```
   VITE_VOWEL_APP_ID=your_app_id_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

5. **Activate voice:**
   Click the microphone button in the bottom-right corner to start voice interaction.

## Project Structure

```
src/
├── components/           # React UI components
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (Sidebar, Header)
│   ├── topology/        # ReactFlow topology components
│   └── charts/          # Recharts chart components
├── routes/              # TanStack Router routes
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Dashboard overview
│   ├── devices/         # Device management routes
│   ├── topology.tsx     # Network topology view
│   ├── events.tsx       # Event timeline
│   ├── firmware.tsx     # Firmware management
│   ├── tenants.tsx      # Tenant management
│   └── notes.tsx        # Session notes
├── store/               # Valtio state stores
│   ├── deviceStore.ts   # Device state management
│   ├── eventStore.ts    # Event state management
│   ├── topologyStore.ts # Topology filter state
│   ├── tenantStore.ts   # Tenant state management
│   ├── updateStore.ts   # Firmware update workflows
│   └── notesStore.ts    # Session notes (sessionStorage)
├── data/                # Mock data files
│   ├── devices.ts       # 58 network devices
│   ├── events.ts        # Event definitions
│   ├── firmware.ts      # Firmware catalog
│   ├── tenants.ts       # Tenant/VRF/EPG data
│   └── topology.ts      # Topology node generation
├── vowel.client.ts      # Voice agent configuration
├── router.ts            # TanStack Router setup
└── main.tsx             # App entry point
```

## Voice Integration

The demo uses `@vowel.to/client` to add voice capabilities. Key features:

### Custom Actions

40+ voice actions are registered in `vowel.client.ts`:

- **Device Actions:** `searchDevices`, `filterDevicesByType`, `filterDevicesByStatus`, `filterDevicesByBuilding`, `filterDevicesByFloor`, `filterDevicesByEventStatus`, `selectDevice`
- **Event Actions:** `filterEventsBySeverity`, `filterEventsByCategory`, `filterEventsByAcknowledged`, `selectEvent`
- **Topology Actions:** `filterTopologyByEventStatus`, `filterTopologyByBuilding`, `filterTopologyByFloor`, `clearTopologyFilters`
- **Tenant Actions:** `selectTenant`
- **Firmware Actions:** `getDevicesNeedingUpdates`, `createFirmwareUpdate`, `startFirmwareUpdate`, `cancelFirmwareUpdate`
- **Notes Actions:** `showNotes`, `createNote`, `updateNote`, `deleteNote`, `listNotes`

### Configuration

Voice features are configured in `vowel.client.ts`:

```typescript
const vowel = new Vowel({
  appId: import.meta.env.VITE_VOWEL_APP_ID,
  
  instructions: `You are a helpful voice assistant for the Network Dashboard...`,
  
  navigationAdapter: createTanStackAdapters({ router }),
  
  borderGlow: {
    enabled: true,
    color: 'rgba(99, 102, 241, 0.5)',
  },
  
  _caption: {
    enabled: true,
    position: 'top-center',
  },
})
```

## Customization

### Adding New Voice Actions

1. Open `src/vowel.client.ts`
2. Add a new action in the `registerCustomActions` function:

```typescript
vowel.registerAction(
  'myNewAction',
  {
    description: 'What this action does',
    parameters: {
      paramName: { 
        type: 'string', 
        description: 'What this parameter is for' 
      },
    },
  },
  async ({ paramName }) => {
    // Your implementation
    return {
      success: true,
      message: `Action completed with ${paramName}`,
    }
  }
)
```

3. Update the AI instructions to mention the new action

### Theming

Customize colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        // ... other colors
      },
    },
  },
}
```

## Data

All data is mock data stored in `src/data/`:

- **58 network devices** - Routers, switches, access points, firewalls
- **Multi-site topology** - 3 buildings with hierarchical layers
- **Firmware catalog** - Version tracking with CVE awareness
- **Events & alerts** - Severity-based event simulation
- **Tenants** - Multi-tenancy with VRFs, BDs, EPGs

Data persists to localStorage via Valtio stores.

## Troubleshooting

### Voice Not Working

1. **Check App ID:** Verify `VITE_VOWEL_APP_ID` is set in `.env`
2. **Browser Console:** Look for error messages
3. **Microphone Permission:** Ensure browser has microphone access
4. **HTTPS:** Voice requires HTTPS (localhost works for development)

### Build Errors

1. **Node Version:** Ensure Node 18+ or Bun 1.1+
2. **Dependencies:** Run `rm -rf node_modules && npm install`
3. **TypeScript:** Check for type errors with `npx tsc --noEmit`

## License

MIT License - See [LICENSE](../LICENSE) for details

---

Built with [vowel.to](https://vowel.to) - Voice AI for web applications
