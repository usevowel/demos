# Pickr Warehouse Worker

Cloudflare Workers with Durable Objects for real-time warehouse session synchronization.

## Setup

1. Install dependencies:
```bash
cd src
npm install
# or
bun install
```

2. Configure your Cloudflare account:
```bash
npx wrangler login
```

3. Update `wrangler.toml` with your account ID if needed.

## Development

Run the worker locally:
```bash
npm run dev
# or
bun run dev
```

The worker will be available at `http://localhost:8787` (or the port shown in the terminal).

## Environment Variables

Set these in your Expo app (`.env` or `app.json`):
- `EXPO_PUBLIC_WS_URL` - WebSocket URL (e.g., `ws://localhost:8787` for local, `wss://your-worker.workers.dev` for production)
- `EXPO_PUBLIC_API_URL` - API URL (e.g., `http://localhost:8787` for local, `https://your-worker.workers.dev` for production)

## Deployment

Deploy to Cloudflare:
```bash
npm run deploy
# or
bun run deploy
```

After deployment, update your Expo app environment variables to use the production URLs.

## Architecture

- **Worker** (`worker.ts`): Handles HTTP requests and WebSocket upgrades
- **WarehouseSession** (`warehouse-session.ts`): Durable Object that manages:
  - WebSocket connections for warehouse and picker clients
  - State persistence in SQLite
  - Real-time state synchronization between clients

## API Endpoints

- `GET /api/session/create` - Create a new warehouse session
- `GET /api/session/status?sessionId=...` - Get session status
- `WebSocket /?sessionId=...&clientType=warehouse|picker&clientId=...` - Connect to session

## State Synchronization

The Durable Object maintains:
- `activeQRCodes`: Map of location -> QR code data
- `selectedOrderItem`: Currently selected order item

All state changes are:
1. Persisted to SQLite storage
2. Broadcast to all connected clients via WebSocket
