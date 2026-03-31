# vowel.to Demo Applications

A collection of interactive demo applications showcasing the voice AI capabilities of [vowel.to](https://vowel.to). These demos are designed to be run locally and demonstrate how voice agents can enhance web applications across different domains.

> **⚠️ Beta Release** — This open-source release is in beta. You may encounter rough edges, incomplete features, or breaking changes. We are actively reviewing and merging community PRs, but please expect some instability as we iterate toward a stable release. Your feedback and contributions are welcome.

## Available Demos

### Demo (E-commerce)

A comprehensive e-commerce demo showcasing voice-powered shopping with product catalog, cart management, and full page automation.

**Features:**
- 🛍️ **Product Catalog** - Browse and search products across multiple categories
- 🛒 **Shopping Cart** - Voice-controlled cart management with add/remove items
- 🤖 **Page Automation** - Full DOM control via voice (click, type, search)
- 🎯 **Speaking State Tracking** - Real-time visual indicators for voice states
- 📍 **Voice Navigation** - Navigate between pages using natural language
- 👤 **User Management** - User profiles and authentication
- 🎨 **Responsive Design** - DaisyUI components with Tailwind CSS

**Voice Capabilities:**
- "Show me products"
- "Add this to my cart"
- "Search for electronics under $100"
- "Click the add to cart button"
- "Type 'laptop' in the search box"
- "Go to cart"
- "Navigate to dashboard"

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, Valtio, DaisyUI, Tailwind CSS

[View Demo →](./demo/)

---

### Net Dashboard

A voice-powered network infrastructure management dashboard with voice-controlled navigation and device management.

**Features:**
- 🌐 **Interactive Network Topology** - Visualize 58+ network devices across 3 buildings using ReactFlow
- 📊 **Real-time Metrics** - Charts and dashboards showing device health, bandwidth, and events
- 🔔 **Alert Management** - Filter and manage critical/warning/info events by severity
- 🔧 **Firmware Lifecycle** - Track firmware versions and manage update workflows
- 🏢 **Multi-tenancy Views** - Tenant, VRF, and EPG management interfaces
- 📝 **Session Notes** - Voice-controlled note-taking during sessions
- 🔍 **Voice Search** - Find devices, filter by type/status/building using natural language

**Voice Capabilities:**
- "Show me all critical devices"
- "Navigate to the firmware page"
- "Filter devices in Building 2, Floor 3"
- "Create a note about router maintenance"
- "How many devices need firmware updates?"

**Tech Stack:** React 19, TypeScript, Vite, TanStack Router, Valtio, ReactFlow, Recharts, Tailwind CSS

[View Demo →](./net-dashboard/)

---

### Warehouse Picker (Pickr)

A real-time warehouse picking system with state synchronization between warehouse displays and mobile picker devices.

**Features:**
- 📱 **Mobile Picker Interface** - React Native (Expo) app for pickers
- 🖥️ **Warehouse Display** - Real-time QR code generation for shelf locations
- 🔄 **State Synchronization** - WebSocket-based real-time updates via Cloudflare Durable Objects
- 📦 **Order Management** - Pick, skip, and block items with progress tracking
- 🔐 **Session Pairing** - QR code pairing between warehouse and picker devices
- 💾 **Session Persistence** - SQLite state persistence in Durable Objects

**Voice Capabilities:**
- Voice integration ready (infrastructure for voice commands)

**Tech Stack:** React Native (Expo), TypeScript, Cloudflare Workers, Durable Objects, WebSockets, SQLite

[View Demo →](./warehouse-picker/)

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun 1.1+
- A free vowel.to App ID ([get one here](https://vowel.to))

### Running a Demo

1. **Navigate to a demo:**
   ```bash
   cd demo
   # or
   cd net-dashboard
   # or
   cd warehouse-picker
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure your App ID:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Vowel App ID:
   ```
   VITE_VOWEL_APP_ID=your_app_id_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:5173`

6. **Activate voice:**
   Click the microphone button in the bottom-right corner to start voice interaction.

---

## How Voice Works

These demos use the `@vowel.to/client` SDK to add voice capabilities:

1. **Natural Language Processing** - Users speak naturally, no need to memorize commands
2. **Context Awareness** - The AI understands the current page and application state
3. **Custom Actions** - Each demo registers domain-specific actions (e.g., `addToCart`, `filterDevicesByBuilding`)
4. **Visual Feedback** - Border glow indicates when the AI is listening or speaking
5. **Captions** - Real-time speech-to-text captions appear as toast notifications

### Voice Configuration

Voice features are configured in `src/vowel.client.ts`:

```typescript
const vowel = new Vowel({
  appId: import.meta.env.VITE_VOWEL_APP_ID,
  
  // System instructions for the AI
  instructions: `You are a helpful voice assistant for...`,
  
  // Enable navigation via voice
  navigationAdapter: createTanStackAdapters({ router }),
  
  // Visual feedback
  borderGlow: { enabled: true, color: 'rgba(99, 102, 241, 0.5)' },
  
  // Caption display
  _caption: { enabled: true, position: 'top-center' },
})

// Register custom actions
vowel.registerAction('searchProducts', {
  description: 'Search for products by name',
  parameters: { query: { type: 'string' } },
}, async ({ query }) => {
  // Implementation
})
```

---

## Project Structure

```
demos/
├── demo/                   # E-commerce shopping demo
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── routes/         # TanStack Router routes
│   │   ├── store/          # Valtio state management
│   │   ├── vowel.client.ts # Voice configuration
│   │   └── main.tsx        # App entry point
│   ├── public/             # Static assets
│   ├── .env.example        # Environment template
│   ├── package.json
│   └── README.md           # Demo-specific docs
│
├── net-dashboard/          # Network management demo
│   ├── src/
│   │   ├── components/     # React UI components
│   │   ├── routes/         # TanStack Router routes
│   │   ├── store/          # Valtio state management
│   │   ├── data/           # Mock data files
│   │   ├── vowel.client.ts # Voice configuration
│   │   └── main.tsx        # App entry point
│   ├── public/             # Static assets
│   ├── .env.example        # Environment template
│   ├── package.json
│   └── README.md           # Demo-specific docs
│
├── warehouse-picker/       # Warehouse picking system (Pickr)
│   ├── app/                # Expo/React Native frontend
│   ├── src/                # Cloudflare Worker backend
│   ├── components/         # React components
│   ├── package.json
│   └── README.md           # Demo-specific docs
│
└── README.md               # This file
```

---

## Customization

### Adding Your Own Actions

To extend a demo with new voice capabilities:

1. **Open `src/vowel.client.ts`**

2. **Add a new action:**
   ```typescript
   vowel.registerAction(
     'myCustomAction',
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

3. **Update the AI instructions** to mention the new action

### Theming

**Demo (E-commerce)** and **Net Dashboard** use Tailwind CSS. Customize colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',    // Change brand color
        secondary: '#8b5cf6',
      },
    },
  },
}
```

**Warehouse Picker (Pickr)** uses its own styling system within the Expo/React Native framework.
```

---

## Voice Best Practices

Based on these demos, here are patterns that work well:

### 1. Context-First Design
Always provide the AI with current application state:

```typescript
// Sync app state to voice context
useEffect(() => {
  vowel.setContext({
    cart: { items, total },
    user: { name },
  })
}, [items, total, name])
```

### 2. Action Results
Return meaningful results from actions:

```typescript
return {
  success: true,
  count: filtered.length,
  message: `Found ${filtered.length} products`,
}
```

### 3. Navigation Integration
Actions should navigate to relevant pages:

```typescript
async ({ query }) => {
  const results = search(query)
  router.navigate({ to: '/search', search: { q: query } })
  return { success: true, count: results.length }
}
```

### 4. Terse by Default
Configure the AI to be concise:

```
## CRITICAL: Be Terse
**Default**: One short sentence maximum.
**Never** add "Let me know if you need anything else."
```

---

## Troubleshooting

### Voice Not Working

1. **Check App ID:** Verify `VITE_VOWEL_APP_ID` is set in `.env`
2. **Browser Console:** Look for error messages from `@vowel.to/client`
3. **Microphone Permission:** Ensure browser has microphone access
4. **HTTPS:** Voice requires HTTPS (or localhost for development)

### Build Errors

1. **Node Version:** Ensure Node 18+ or Bun 1.1+
2. **Dependencies:** Run `rm -rf node_modules && npm install`
3. **TypeScript:** Check for type errors with `npx tsc --noEmit`

### Demo-Specific Issues

**Demo (E-commerce):**
- Check that `@vowel.to/client` is built if making changes to the client library
- For Grok testing, ensure the app has a configured Grok AI connection in the platform

**Net Dashboard:**
- If topology doesn't render, check ReactFlow is installed
- Mock data loads from `src/data/` - verify files exist

**Warehouse Picker (Pickr):**
- Ensure `wrangler.toml` has correct `account_id` for Cloudflare deployment
- Verify Durable Object migrations are applied: `wrangler d1 migrations apply`
- For WebSocket issues, check that `EXPO_PUBLIC_WS_URL` uses correct protocol (`wss://` for production, `ws://` for local)

---

## Contributing

These demos are part of the [vowel.to](https://vowel.to) ecosystem. To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Adding a New Demo

1. Create a new directory: `mkdir my-demo`
2. Copy structure from an existing demo
3. Update `package.json` with unique name
4. Write voice actions in `src/vowel.client.ts`
5. Add demo entry to this README
6. Submit PR

---

## Resources

- [vowel.to Documentation](https://docs.vowel.to)
- [Voice Integration Guide](https://docs.vowel.to/guides/voice-integration)
- [Custom Actions API](https://docs.vowel.to/api/custom-actions)
- [React SDK Reference](https://docs.vowel.to/sdks/react)

---

## License

MIT License - See [LICENSE](./LICENSE) for details

---

## Support

- 📧 Email: support@vowel.to
- 💬 Discord: [Join our community](https://discord.gg/vowel)
- 🐦 Twitter: [@usevowel](https://twitter.com/usevowel)

---

<p align="center">
  Built with ❤️ by the <a href="https://vowel.to">vowel.to</a> team
</p>
