import QRCode from "qrcode";

/**
 * Pairing QR code data structure
 */
export interface PairingQRData {
  type: "warehouse-pairing";
  sessionId: string;
  wsUrl: string;
  apiUrl: string;
  timestamp: number;
}

/**
 * Generate a pairing QR code for warehouse session
 * @param sessionId Session ID to pair with
 * @param wsUrl WebSocket server URL
 * @param apiUrl API server URL
 * @returns Data URL of the QR code image
 */
export async function generatePairingQRCode(
  sessionId: string,
  wsUrl: string,
  apiUrl: string
): Promise<string> {
  const pairingData: PairingQRData = {
    type: "warehouse-pairing",
    sessionId,
    wsUrl,
    apiUrl,
    timestamp: Date.now(),
  };

  try {
    const qrImageUri = await QRCode.toDataURL(JSON.stringify(pairingData), {
      errorCorrectionLevel: "M",
      width: 300,
      margin: 2,
    });
    return qrImageUri;
  } catch (error) {
    console.error("Failed to generate pairing QR code:", error);
    throw error;
  }
}

/**
 * Parse pairing QR code data
 * @param qrDataString JSON string from scanned QR code
 * @returns Parsed pairing data or null if invalid
 */
export function parsePairingQRCode(
  qrDataString: string
): PairingQRData | null {
  try {
    const data = JSON.parse(qrDataString) as PairingQRData;
    if (
      data.type === "warehouse-pairing" &&
      data.sessionId &&
      data.wsUrl &&
      data.apiUrl
    ) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("Failed to parse pairing QR code:", error);
    return null;
  }
}

/**
 * Generate a short pairing URL using the session code directly
 * The session ID IS the 6-character pairing code
 * @param sessionId Session ID (which is the 6-char pairing code)
 * @param baseUrl The base URL of the picker app
 * @returns Short URL like http://localhost:8081/pick?code=ABC123
 */
export function generatePairingURL(
  sessionId: string,
  baseUrl: string
): string {
  return `${baseUrl}/pick?code=${sessionId}`;
}

/**
 * Extract pairing code from URL
 * @returns The code from ?code=XXX or null
 */
export function getPairingCodeFromURL(): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('code');
}
