import { DurableObject } from "cloudflare:workers";
import WarehouseSession from "./warehouse-session";

// Re-export WarehouseSession so wrangler can discover it
export { WarehouseSession };

/**
 * Environment interface for Cloudflare Worker
 */
export interface Env {
  WAREHOUSE_SESSION: DurableObjectNamespace<WarehouseSession>;
}

/**
 * CORS headers for cross-origin requests
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/**
 * Helper to create a response with CORS headers
 */
function createCorsResponse(body: BodyInit | null, init: ResponseInit = {}): Response {
  return new Response(body, {
    ...init,
    headers: {
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

/**
 * Helper to create a JSON response with CORS headers
 */
function createCorsJsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return createCorsResponse(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers || {}),
    },
  });
}

/**
 * Generate a short alphanumeric pairing code (6 characters)
 * This IS the session ID - no separate mapping needed
 */
function generatePairingCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed confusing chars (0, O, 1, I)
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Main Worker entry point
 * Handles HTTP requests and WebSocket upgrades
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Handle WebSocket upgrades
    if (request.headers.get("Upgrade") === "websocket") {
      const sessionId = url.searchParams.get("sessionId");
      const clientType = url.searchParams.get("clientType"); // "warehouse" or "picker"
      const clientId = url.searchParams.get("clientId"); // Unique client identifier

      if (!sessionId || !clientType || !clientId) {
        return createCorsResponse("Missing required query parameters: sessionId, clientType, clientId", {
          status: 400,
        });
      }

      // Get the Durable Object stub for this session
      const stub = env.WAREHOUSE_SESSION.getByName(sessionId);

      // Forward the WebSocket upgrade to the Durable Object
      return stub.fetch(request);
    }

    // Handle HTTP requests
    if (url.pathname === "/api/session/create") {
      // Generate a short pairing code that IS the session ID
      const sessionId = generatePairingCode();
      return createCorsJsonResponse({ sessionId });
    }

    if (url.pathname === "/api/session/status") {
      const sessionId = url.searchParams.get("sessionId");
      if (!sessionId) {
        return createCorsJsonResponse({ error: "Missing sessionId parameter" }, { status: 400 });
      }

      const stub = env.WAREHOUSE_SESSION.getByName(sessionId);
      try {
        const status = await stub.getStatus();
        return createCorsJsonResponse(status);
      } catch (error) {
        return createCorsJsonResponse({ error: "Session not found" }, { status: 404 });
      }
    }

    return createCorsResponse("Not Found", { status: 404 });
  },
};
