# vowel.to Demo - React + TanStack Router

A comprehensive demo showcasing the vowel.to voice agent integration with React and TanStack Router.

## ✨ New Feature: Speaking State Tracking

This demo now includes **real-time speaking state tracking** with visual indicators!

- 🔵 **User Speaking** - Client-side VAD with <100ms latency
- 🟡 **AI Thinking** - Processing and tool execution indicators
- 🟣 **AI Speaking** - Audio playback tracking

👉 **[See Full Demo Guide](./SPEAKING_STATE_DEMO.md)**

## Features

- 🎤 **Voice-powered navigation and interactions**
- 🤖 **NEW:** Full page automation - control the app with voice commands!
- 🎯 **Real-time speaking state tracking** with visual feedback
- 🛒 E-commerce functionality (products, cart, users)
- 🔐 Authentication system
- 📱 Responsive design with DaisyUI
- 🚀 Modern React with TypeScript

## 🤖 Page Automation

This demo uses the **DirectAutomationAdapter** for same-page DOM interaction. You can control the entire app with voice commands!

**Try these commands:**
- "Click the add to cart button"
- "Type 'laptop' in the search box"
- "Search for electronics"
- "Set maximum price to 100"
- "Go to products and add the first item to cart"

👉 **[See Full Voice Automation Guide](./VOICE_AUTOMATION_GUIDE.md)**

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- GitHub Packages access (for @vowel.to/client)

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun run dev
```

### Build for Production

```bash
npm run build
# or
bun run build
```

## Configuration

### GitHub Packages Access

This demo uses the `@vowel.to/client` package from GitHub Packages. You'll need to configure access:

1. Create a `.npmrc` file in your project root:
```
@vowel.to:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

2. Generate a GitHub Personal Access Token with `packages:read` permission

### Environment Variables

The demo supports two main local modes:

- `.env.local`: Core/self-hosted flow
- `.env.grok`: platform-backed Grok flow

For Grok testing, run:

```bash
cd demos/demo
bun run dev:grok
```

This starts the demo on `http://localhost:3901`.

Note: the demo currently resolves `@vowel.to/client` through the package exports again. That means local demo development depends on a current `client/dist`, so if you change the client package you should rebuild it before rerunning the demo.

### Core Self-Hosted / Docker Compose (Optional)

To point the demo at the local Docker Compose stack from the platform root:

1. **Start the stack** (from platform root):
   ```bash
   cp stack.env.example stack.env
   bun run stack:sync-secrets
   bun run stack:up
   ```
   By default the stack uses `http://localhost:3000` and `ws://localhost:8787`. If those ports are busy, set `CORE_HOST_PORT` / `ENGINE_HOST_PORT` in `stack.env`.

2. **Add to demo** (`demos/demo/.env.local`):
   ```
   VITE_USE_CORE_COMPOSE=1
   VITE_CORE_BASE_URL=http://localhost:3000
   VITE_CORE_TOKEN_ENDPOINT=http://localhost:3000/vowel/api/generateToken
   VITE_CORE_API_KEY=vkey_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   VITE_CORE_APP_ID=default
   ```

   `VITE_CORE_SELF_HOSTED=1` still works as a legacy alias, but `VITE_USE_CORE_COMPOSE=1` is the preferred flag now.

3. **Run the demo**:
   ```bash
   cd demos/demo && bun run dev
   ```

4. **Test**: Open the demo, click the mic, and speak. The demo will fetch tokens from Core, which proxies to the configured engine runtime.

### Grok Realtime (Platform-backed)

To test Grok through the platform token flow instead of the Core/self-hosted path:

1. Create or update `demos/demo/.env.grok`
2. Ensure the target app has a configured `grok` AI connection in the platform
3. Start the demo:
   ```bash
   cd demos/demo && bun run dev:grok
   ```
4. Open `http://localhost:3901`

In Grok mode, the demo uses `_voiceConfig.provider = "grok"` and should not route through `vowel-prime`.

## Project Structure

```
src/
├── components/     # Reusable UI components
├── routes/        # TanStack Router route components
├── store/         # State management (Valtio)
├── lib/           # Utilities and configurations
├── vowel.client.ts # Vowel voice agent configuration
└── main.tsx       # Application entry point
```

## Language Requirements

**⚠️ Important:** All tool inputs (search queries, form inputs, and other tool parameters) must be provided in **English**. While you can speak to the voice agent in any language, the AI will translate your requests and execute tool calls with English parameters.

Examples:
- Search queries: "laptop", "wireless earbuds", "electronics", "storage", "charging"
- Form inputs: Product names, categories, prices
- Tool parameters: All action parameters should be in English

## Voice Agent Features

The demo includes a fully configured Vowel voice agent with **dual adapter architecture**:

### 📍 Navigation (TanStackNavigationAdapter)
- Voice-powered routing between pages
- Automatic route detection from TanStack Router
- Examples: "Go to products", "Take me to cart", "Navigate to dashboard"

### 🤖 Page Automation (DirectAutomationAdapter)
- **Element Search**: Find any element on the page by description
- **Click Actions**: "Click the add to cart button"
- **Form Filling**: "Type 'laptop' in the search box"
- **Selections**: "Search for accessories"
- **Complex Commands**: "Go to search and find items under $100"

### 🎯 Custom Actions
- **Product Search**: "Find storage products under $100"
- **Cart Management**: "Add this to my cart", "Remove item from cart"
- **User Management**: "Show user details", "Create new user"
- **Admin Functions**: "Show all orders", "Update inventory"

### Speaking State Tracking

See visual indicators throughout the UI:

- **Navbar Badge**: Top-right, shows current state (🎤 🧠 🔊 ✓)
- **Tracker Panel**: Bottom-left, comprehensive real-time display
- **Microphone Button**: Changes color based on state with pulsing animations

**Try it out:**
1. Start a voice session (click mic button)
2. Say "Show me the products"
3. Watch the indicators change as you speak, AI thinks, and AI responds!

## Customization

### Adding New Voice Actions

Edit `src/vowel.client.ts` to add custom voice actions:

```typescript
{
  name: 'custom_action',
  description: 'Description of what this action does',
  handler: async (params) => {
    // Your custom logic here
    return { success: true, message: 'Action completed' };
  }
}
```

### Styling

The demo uses Tailwind CSS with DaisyUI components. Customize the theme in `tailwind.config.js`.

## License

MIT License - see LICENSE file for details.
