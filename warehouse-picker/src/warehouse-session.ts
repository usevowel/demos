import { DurableObject } from "cloudflare:workers";

/**
 * Environment interface for Durable Object
 */
export interface Env {
  WAREHOUSE_SESSION: DurableObjectNamespace<WarehouseSession>;
}

/**
 * Client connection information
 */
interface Client {
  id: string;
  type: "warehouse" | "picker";
  ws: WebSocket;
  connectedAt: number;
}

/**
 * QR Code data structure (matches client-side interface)
 */
export interface QRCodeData {
  location: string;
  itemId: string;
  orderId?: string;
  timestamp: number;
}

/**
 * QR Code entry with image URI
 */
export interface QRCodeEntry {
  data: QRCodeData;
  imageUri: string;
  shelfId: string;
}

/**
 * Session state persisted in SQLite
 */
interface SessionState {
  activeQRCodes: Record<string, QRCodeEntry>;
  selectedOrderItem: { orderId: string; itemId: string; location: string } | null;
  createdAt: number;
  lastUpdated: number;
}

/**
 * Message types for WebSocket communication
 */
type ClientMessage =
  | { type: "connect"; clientType: "warehouse" | "picker"; clientId: string }
  | { type: "addQRCode"; location: string; qrCode: QRCodeEntry }
  | { type: "removeQRCode"; location: string }
  | { type: "clearAllQRCodes" }
  | { type: "setSelectedOrderItem"; orderItem: { orderId: string; itemId: string; location: string } | null }
  | { type: "syncRequest" };

type ServerMessage =
  | { type: "connected"; sessionId: string }
  | { type: "stateSync"; state: SessionState }
  | { type: "qrCodeAdded"; location: string; qrCode: QRCodeEntry }
  | { type: "qrCodeRemoved"; location: string }
  | { type: "allQRCodesCleared" }
  | { type: "selectedOrderItemChanged"; orderItem: { orderId: string; itemId: string; location: string } | null }
  | { type: "error"; message: string };

/**
 * WarehouseSession Durable Object
 * Manages state and WebSocket connections for a warehouse session
 */
export default class WarehouseSession extends DurableObject<Env> {
  private clients: Map<string, Client> = new Map();
  private state: SessionState | null = null;
  private stateLoaded: boolean = false;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);

    // Initialize SQLite schema
    ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(`
        CREATE TABLE IF NOT EXISTS session_state (
          id INTEGER PRIMARY KEY CHECK (id = 1),
          state_json TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        )
      `);
    });
  }

  /**
   * Load state from SQLite storage
   */
  private async loadState(): Promise<void> {
    if (this.stateLoaded) return;

    try {
      const rows = this.ctx.storage.sql.exec<{ state_json: string }>(
        "SELECT state_json FROM session_state WHERE id = 1"
      ).toArray();

      if (rows.length > 0) {
        this.state = JSON.parse(rows[0].state_json) as SessionState;
      } else {
        // Initialize default state
        this.state = {
          activeQRCodes: {},
          selectedOrderItem: null,
          createdAt: Date.now(),
          lastUpdated: Date.now(),
        };
        await this.saveState();
      }
    } catch (error) {
      console.error("Failed to load state:", error);
      // Initialize default state on error
      this.state = {
        activeQRCodes: {},
        selectedOrderItem: null,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
      };
    }

    this.stateLoaded = true;
  }

  /**
   * Save state to SQLite storage
   */
  private async saveState(): Promise<void> {
    if (!this.state) return;

    this.state.lastUpdated = Date.now();

    try {
      this.ctx.storage.sql.exec(
        `INSERT INTO session_state (id, state_json, created_at, updated_at)
         VALUES (1, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           state_json = excluded.state_json,
           updated_at = excluded.updated_at`,
        JSON.stringify(this.state),
        this.state.createdAt,
        this.state.lastUpdated
      );
    } catch (error) {
      console.error("Failed to save state:", error);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: ServerMessage, excludeClientId?: string): void {
    const messageStr = JSON.stringify(message);
    for (const [clientId, client] of this.clients.entries()) {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.READY_STATE_OPEN) {
        try {
          client.ws.send(messageStr);
        } catch (error) {
          console.error(`Failed to send message to client ${clientId}:`, error);
        }
      }
    }
  }

  /**
   * Handle WebSocket connection
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId") || crypto.randomUUID();
    const clientType = url.searchParams.get("clientType") as "warehouse" | "picker";

    if (!clientType || (clientType !== "warehouse" && clientType !== "picker")) {
      return new Response("Invalid clientType", { status: 400 });
    }

    // Upgrade to WebSocket
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // Accept the WebSocket connection
    server.accept();

    // Load state before handling messages
    await this.loadState();

    // Store client connection
    const clientInfo: Client = {
      id: clientId,
      type: clientType,
      ws: server,
      connectedAt: Date.now(),
    };
    this.clients.set(clientId, clientInfo);

    // Send initial connection confirmation and state sync
    const sessionId = this.ctx.id.toString();
    server.send(JSON.stringify({ type: "connected", sessionId } as ServerMessage));

    // Send current state to newly connected client
    if (this.state) {
      server.send(
        JSON.stringify({
          type: "stateSync",
          state: this.state,
        } as ServerMessage)
      );
    }

    // Handle WebSocket messages
    server.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data as string) as ClientMessage;

        await this.loadState();
        if (!this.state) return;

        switch (message.type) {
          case "addQRCode":
            this.state.activeQRCodes[message.location] = message.qrCode;
            await this.saveState();
            this.broadcast(
              {
                type: "qrCodeAdded",
                location: message.location,
                qrCode: message.qrCode,
              },
              clientId
            );
            break;

          case "removeQRCode":
            delete this.state.activeQRCodes[message.location];
            if (
              this.state.selectedOrderItem?.location === message.location
            ) {
              this.state.selectedOrderItem = null;
            }
            await this.saveState();
            this.broadcast(
              {
                type: "qrCodeRemoved",
                location: message.location,
              },
              clientId
            );
            break;

          case "clearAllQRCodes":
            this.state.activeQRCodes = {};
            this.state.selectedOrderItem = null;
            await this.saveState();
            this.broadcast({ type: "allQRCodesCleared" }, clientId);
            break;

          case "setSelectedOrderItem":
            this.state.selectedOrderItem = message.orderItem;
            await this.saveState();
            this.broadcast(
              {
                type: "selectedOrderItemChanged",
                orderItem: message.orderItem,
              },
              clientId
            );
            break;

          case "syncRequest":
            // Send current state to requesting client
            server.send(
              JSON.stringify({
                type: "stateSync",
                state: this.state,
              } as ServerMessage)
            );
            break;

          default:
            console.warn("Unknown message type:", (message as any).type);
        }
      } catch (error) {
        console.error("Error handling message:", error);
        server.send(
          JSON.stringify({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          } as ServerMessage)
        );
      }
    });

    // Handle WebSocket close
    server.addEventListener("close", () => {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} disconnected`);
    });

    // Handle WebSocket error
    server.addEventListener("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  /**
   * RPC method to get session status
   */
  async getStatus(): Promise<{
    sessionId: string;
    connectedClients: number;
    hasState: boolean;
  }> {
    await this.loadState();
    return {
      sessionId: this.ctx.id.toString(),
      connectedClients: this.clients.size,
      hasState: this.state !== null,
    };
  }
}
