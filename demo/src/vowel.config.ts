/**
 * Vowel Configuration - vowel-core preset (localhost:3000)
 *
 * Uses the self-hosted vowel-core preset with local token endpoint.
 * All demos now use localhost:3000 as the token endpoint.
 */

import type { VowelConfig } from '@vowel.to/client';

/** Demo configuration using vowel-core preset */
export const selectedDemoConfig = {
  id: 'vowel-core-local',
  label: 'vowel-core (localhost:3000)',
  description: 'Self-hosted core preset pointed at localhost:3000 token endpoint',

  /** Language setting */
  language: 'en-US' as const,

  /**
   * Turn detection preset
   * - 'server-vad': Server-side VAD (recommended for vowel-core with Deepgram)
   * - 'client-vad': Client-side VAD using @ricky0123/vad-web
   */
  turnDetectionPreset: 'server-vad' as const,

  /** Initial greeting prompt */
  initialGreetingPrompt: 'Hello! I\'m your shopping assistant. How can I help you today?',

  /**
   * Resolve token configuration for vowel-core preset
   * Uses localhost:3000 as the token endpoint
   */
  resolveTokenConfig() {
    return {
      preset: 'vowel-core' as const,
      tokenEndpoint: 'http://localhost:3000/vowel/api/generateToken',
    };
  },

  /**
   * Voice configuration - minimal as preset handles the rest
   */
  voiceConfig: {
    // Preset handles provider/model/voice configuration
    // These are optional overrides if needed for development
  } as VowelConfig['_voiceConfig'],
};

/** Current demo config identifier */
export const selectedDemoConfigId = selectedDemoConfig.id;

/**
 * Get the App ID from environment or use a default for local development
 * With vowel-core, this identifies the app in the local core instance
 */
export function getEnvAppId(): string | undefined {
  // For vowel-core preset, we use a default app ID for local development
  // The actual app registration happens in the local core at localhost:3000
  return import.meta.env.VITE_VOWEL_APP_ID || 'default';
}
