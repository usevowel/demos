# Pickr - Warehouse Picking System

A real-time warehouse picking system with state synchronization between warehouse displays and mobile picker devices using Cloudflare Durable Objects and WebSockets.

## Architecture

- **Frontend**: React Native (Expo) web app with real-time QR code generation
- **Backend**: Cloudflare Worker with Durable Objects for state persistence
- **State Sync**: WebSocket connections for real-time updates between warehouse and picker devices
- **Storage**: SQLite within Durable Objects for session state persistence

## Project Structure

```
├── app/                    # Expo/React Native frontend
│   ├── warehouse.tsx      # Warehouse display page (admin view)
│   ├── pick.tsx           # Picker mobile interface
│   └── index.tsx          # Login page
├── src/                    # Cloudflare Worker backend
│   ├── worker.ts          # HTTP request handler & WebSocket upgrade
│   └── warehouse-session.ts # Durable Object for session state
├── lib/                    # Shared utilities
│   ├── store.ts           # Valtio state management
│   ├── websocket.ts       # WebSocket client wrapper
│   └── session-pairing.ts # QR code pairing utilities
├── components/            # React components
└── wrangler.toml         # Cloudflare Worker configuration
```

## Prerequisites

- Bun runtime (https://bun.sh)
- Cloudflare account with Workers enabled
- Wrangler CLI installed: `bun install -g wrangler`
- Expo CLI (optional, for mobile testing): `bun install -g expo-cli`

## Setup

1. **Install dependencies:**
   ```bash
   bun install
   cd src && bun install
   ```

2. **Configure environment variables:**
   ```bash
   # .env file in project root
   EXPO_PUBLIC_WS_URL=wss://pickr-warehouse.YOUR_SUBDOMAIN.workers.dev
   EXPO_PUBLIC_API_URL=https://pickr-warehouse.YOUR_SUBDOMAIN.workers.dev
   ```

3. **Update `wrangler.toml` with your Cloudflare settings** if you are deploying the Worker.

## Deployment

1. **Deploy the Worker:**
   ```bash
   cd src
   wrangler deploy
   ```
   
   Note the deployment URL (e.g., `https://pickr-warehouse.YOUR_SUBDOMAIN.workers.dev`)

2. **Update environment variables** with the actual deployed URL

3. **Start the frontend:**
   ```bash
   # For web development
   bun run web
   
   # For mobile (requires Expo Go app)
   bun start
   ```

## Testing the Flow

### 1. Login as Admin (Warehouse)

1. Open the app at `http://localhost:8081` (or your deployed URL)
2. Login with:
   - **Email**: `admin@warehouse.com`
   - **Password**: use the local demo credential from your environment
3. You'll be redirected to the **Warehouse** page
4. A pairing QR code modal will appear automatically

### 2. Connect a Picker Device

**Option A: Using a second browser window**
1. Open a new browser window in incognito/private mode
2. Navigate to the app
3. Login with:
   - **Email**: `picker1@warehouse.com` (or any picker account)
   - **Password**: use the local demo credential from your environment
4. You'll be prompted to scan the pairing QR code
5. Since you can't scan with a browser, use the **manual connection** method:
   - Check the browser console or network tab for the session ID
   - Or use the session ID displayed in the warehouse modal

**Option B: Using a mobile device**
1. Install the Expo Go app on your phone
2. Start the app with `bun start`
3. Scan the QR code with your phone's camera
4. Login as a picker
5. Scan the warehouse's pairing QR code with your phone

### 3. Test State Synchronization

**Generate QR Codes:**
1. On the **Picker** device:
   - Tap "Available" tab
   - Select an order (e.g., ORD-001)
   - Tap on an item row to select it
   
2. On the **Warehouse** display:
   - You should see a QR code appear on the corresponding shelf location
   - The QR code contains item ID, location, and order information
   - The Active QR Codes panel at the bottom will show the generated code

**Verify Real-time Sync:**
1. The QR code should appear instantly on the warehouse display
2. Tap the QR code on the warehouse display to see details
3. On the picker device, select a different item - the QR code should update
4. Clear the selection on the picker - the QR code should disappear from warehouse

**Test Multiple Pickers:**
1. Open multiple picker sessions (different browsers/devices)
2. Each picker should see the same active QR codes
3. When one picker selects an item, all connected devices update

### 4. Test Order Management

**Pick Items:**
1. On the picker device, select an order
2. Tap "Pick" on an item
3. The order progress bar updates
4. Continue picking until order is complete

**Block Items:**
1. Select an item with issues
2. Tap "Skip" or use block functionality
3. The item status updates to "blocked"
4. Warehouse display reflects the blocked status

### 5. Test Session Persistence

1. Refresh the warehouse page
2. The session should restore with active QR codes
3. Durable Object persists state in SQLite
4. Reconnect picker devices using the same session ID

## WebSocket Message Types

**Client → Server:**
- `connect`: Initial connection with client type
- `addQRCode`: Add a QR code to a location
- `removeQRCode`: Remove QR code from location
- `clearAllQRCodes`: Clear all active QR codes
- `setSelectedOrderItem`: Update selected order item
- `syncRequest`: Request full state sync

**Server → Client:**
- `connected`: Connection acknowledged
- `stateSync`: Full state synchronization
- `qrCodeAdded`: New QR code added
- `qrCodeRemoved`: QR code removed
- `allQRCodesCleared`: All codes cleared
- `selectedOrderItemChanged`: Selection changed

## Troubleshooting

**WebSocket Connection Issues:**
- Check that `EXPO_PUBLIC_WS_URL` uses `wss://` for production, `ws://` for local
- Verify the worker is deployed and accessible
- Check browser console for connection errors

**Durable Object Errors:**
- Ensure `wrangler.toml` has correct `account_id`
- Verify Durable Object migrations are applied: `wrangler d1 migrations apply`
- Check worker logs: `wrangler tail`

**State Not Syncing:**
- Verify both devices are connected to the same session ID
- Check WebSocket messages in browser DevTools Network tab
- Ensure session ID is being passed correctly in URL params

**QR Code Not Generating:**
- Verify picker has selected an order item
- Check that location string format is correct (e.g., "A1-R1-B1")
- Ensure `qrcode` library is installed

## Development

**Local Development:**
```bash
# Terminal 1: Start the worker locally
wrangler dev

# Terminal 2: Start the Expo app
bun run web
```

**Testing WebSocket Locally:**
- Worker runs on `http://localhost:8787`
- Expo app runs on `http://localhost:8081`
- Update `.env` to use `ws://localhost:8787`

**Adding New Features:**
1. Update the Durable Object state interface in `warehouse-session.ts`
2. Add RPC methods for new operations
3. Update WebSocket message types
4. Modify frontend components to use new messages
5. Update SQLite schema if needed (add migrations)

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_WS_URL` | WebSocket endpoint | `wss://pickr-warehouse.YOUR_SUBDOMAIN.workers.dev` |
| `EXPO_PUBLIC_API_URL` | HTTP API endpoint | `https://pickr-warehouse.YOUR_SUBDOMAIN.workers.dev` |

## License

MIT
