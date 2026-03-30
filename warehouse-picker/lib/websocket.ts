/**
 * WebSocket client for warehouse session synchronization
 * Handles connection, reconnection, and message broadcasting
 */

export interface QRCodeEntry {
  data: {
    location: string;
    itemId: string;
    orderId?: string;
    timestamp: number;
  };
  imageUri: string;
  shelfId: string;
}

export type ClientType = "warehouse" | "picker";

export type ServerMessage =
  | { type: "connected"; sessionId: string }
  | {
      type: "stateSync";
      state: {
        activeQRCodes: Record<string, QRCodeEntry>;
        selectedOrderItem: { orderId: string; itemId: string; location: string } | null;
        createdAt: number;
        lastUpdated: number;
      };
    }
  | { type: "qrCodeAdded"; location: string; qrCode: QRCodeEntry }
  | { type: "qrCodeRemoved"; location: string }
  | { type: "allQRCodesCleared" }
  | {
      type: "selectedOrderItemChanged";
      orderItem: { orderId: string; itemId: string; location: string } | null;
    }
  | { type: "error"; message: string };

export type ClientMessage =
  | { type: "addQRCode"; location: string; qrCode: QRCodeEntry }
  | { type: "removeQRCode"; location: string }
  | { type: "clearAllQRCodes" }
  | {
      type: "setSelectedOrderItem";
      orderItem: { orderId: string; itemId: string; location: string } | null;
    }
  | { type: "syncRequest" };

/**
 * WebSocket client class for warehouse sessions
 */
export class WarehouseWebSocket {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private clientId: string;
  private clientType: ClientType;
  private wsUrl: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: Map<string, Set<(message: ServerMessage) => void>> = new Map();
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  /**
   * Create a new WebSocket client
   * @param wsUrl WebSocket server URL (e.g., "wss://your-worker.workers.dev")
   * @param clientType Type of client ("warehouse" or "picker")
   * @param clientId Unique client identifier
   */
  constructor(wsUrl: string, clientType: ClientType, clientId?: string) {
    this.wsUrl = wsUrl;
    this.clientType = clientType;
    this.clientId = clientId || `client-${crypto.randomUUID()}`;
  }

  /**
   * Connect to a warehouse session
   * @param sessionId Session ID to connect to
   */
  async connect(sessionId: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN && this.sessionId === sessionId) {
      return; // Already connected to this session
    }

    this.sessionId = sessionId;
    this.disconnect();

    const url = new URL(this.wsUrl);
    url.searchParams.set("sessionId", sessionId);
    url.searchParams.set("clientType", this.clientType);
    url.searchParams.set("clientId", this.clientId);

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url.toString());
        this.ws = ws;

        ws.onopen = () => {
          console.log(`[WebSocket] Connected to session ${sessionId}`);
          this.reconnectAttempts = 0;
          if (this.onConnectCallback) {
            this.onConnectCallback();
          }
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data as string) as ServerMessage;
            this.handleMessage(message);
          } catch (error) {
            console.error("[WebSocket] Failed to parse message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          if (this.onErrorCallback) {
            this.onErrorCallback(new Error("WebSocket error"));
          }
          reject(error);
        };

        ws.onclose = () => {
          console.log("[WebSocket] Connection closed");
          this.ws = null;
          if (this.onDisconnectCallback) {
            this.onDisconnectCallback();
          }
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the current session
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Attempt to reconnect to the session
   */
  private attemptReconnect(): void {
    if (!this.sessionId || this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("[WebSocket] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(
      `[WebSocket] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.sessionId) {
        this.connect(this.sessionId).catch((error) => {
          console.error("[WebSocket] Reconnection failed:", error);
        });
      }
    }, delay);
  }

  /**
   * Send a message to the server
   */
  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn("[WebSocket] Cannot send message: WebSocket not connected");
    }
  }

  /**
   * Handle incoming server messages
   */
  private handleMessage(message: ServerMessage): void {
    // Call all handlers for this message type
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Error in handler for ${message.type}:`, error);
        }
      });
    }

    // Also call the "all" handler
    const allHandlers = this.messageHandlers.get("all");
    if (allHandlers) {
      allHandlers.forEach((handler) => {
        try {
          handler(message);
        } catch (error) {
          console.error("[WebSocket] Error in 'all' handler:", error);
        }
      });
    }
  }

  /**
   * Register a message handler
   */
  on(type: string, handler: (message: ServerMessage) => void): void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  /**
   * Remove a message handler
   */
  off(type: string, handler: (message: ServerMessage) => void): void {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Set callback for connection events
   */
  setOnConnect(callback: () => void): void {
    this.onConnectCallback = callback;
  }

  /**
   * Set callback for disconnection events
   */
  setOnDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  /**
   * Set callback for error events
   */
  setOnError(callback: (error: Error) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get client ID
   */
  getClientId(): string {
    return this.clientId;
  }
}

/**
 * Create a new warehouse session
 * @param apiUrl API server URL (e.g., "https://your-worker.workers.dev")
 */
export async function createWarehouseSession(
  apiUrl: string
): Promise<{ sessionId: string }> {
  const response = await fetch(`${apiUrl}/api/session/create`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get session status
 * @param apiUrl API server URL
 * @param sessionId Session ID to check
 */
export async function getSessionStatus(
  apiUrl: string,
  sessionId: string
): Promise<{
  sessionId: string;
  connectedClients: number;
  hasState: boolean;
}> {
  const response = await fetch(
    `${apiUrl}/api/session/status?sessionId=${encodeURIComponent(sessionId)}`,
    {
      method: "GET",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get session status: ${response.statusText}`);
  }

  return response.json();
}
