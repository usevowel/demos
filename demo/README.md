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

This demo uses the **vowel-core preset** with `localhost:3000` as the token endpoint.
The configuration is centralized in `src/vowel.config.ts`.

To run the demo:

1. **Ensure your local core is running** at `http://localhost:3000`
2. **Run the demo**:
   ```bash
   cd demos/demo && bun run dev
   ```
3. **Test**: Open the demo, click the mic, and speak. The demo will fetch tokens from your local core.

### Optional Configuration

You can optionally set the app ID in `.env.local`:
```
VITE_VOWEL_APP_ID=default
```

Note: The demo currently resolves `@vowel.to/client` through the package exports. That means local demo development depends on a current `client/dist`, so if you change the client package you should rebuild it before rerunning the demo.

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
