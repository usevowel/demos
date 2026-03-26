import type {
  VowelClientConfig,
  VowelTurnDetectionPreset,
  VowelVoiceConfig,
} from '@vowel.to/client';

type DemoAppIdSource = 'platform' | 'core';
type DemoTokenSource = 'appId' | 'core-ephemeral';

export type DemoConfigId =
  | 'hosted-vowel-prime'
  | 'grok'
  | 'core-self-hosted'
  | 'core-local-bun';

type DemoVowelPrimeConfig = NonNullable<VowelVoiceConfig['vowelPrimeConfig']> & {
  endpointPreset?: string;
};

export type DemoVoiceConfig = VowelVoiceConfig & {
  vowelPrimeConfig?: DemoVowelPrimeConfig;
};

type TokenProviderClientConfig = {
  routes?: unknown;
  actions?: unknown;
  _voiceConfig?: DemoVoiceConfig;
  voiceConfig?: DemoVoiceConfig;
  language?: string;
  systemInstructionOverride?: string;
  initialGreetingPrompt?: string;
  turnDetectionPreset?: string;
};

export interface DemoConfigPreset {
  id: DemoConfigId;
  label: string;
  description: string;
  appIdSource: DemoAppIdSource;
  tokenSource: DemoTokenSource;
  language: string;
  turnDetectionPreset: VowelTurnDetectionPreset;
  initialGreetingPrompt: string;
  voiceConfig: DemoVoiceConfig;
  resolveTokenConfig: () => Pick<VowelClientConfig, 'tokenProvider'> | {};
}

const CORE_BASE_URL = import.meta.env.VITE_CORE_BASE_URL?.trim() || 'http://localhost:3000';
const CORE_TOKEN_ENDPOINT =
  import.meta.env.VITE_CORE_TOKEN_ENDPOINT?.trim() || `${CORE_BASE_URL}/vowel/api/generateToken`;
const CORE_API_KEY = import.meta.env.VITE_CORE_API_KEY?.trim();
const CORE_ENDPOINT_PRESET = import.meta.env.VITE_CORE_ENDPOINT_PRESET?.trim() || 'dev';
const CORE_LOCAL_BUN_ENDPOINT_PRESET =
  import.meta.env.VITE_CORE_LOCAL_BUN_ENDPOINT_PRESET?.trim() || 'localhostBun';

const DEMO_TURN_DETECTION_MODE: 'server_vad' | 'client_vad' = 'server_vad';
const DEMO_LANGUAGE = 'en-US';
const DEMO_TURN_DETECTION_PRESET: VowelTurnDetectionPreset = 'balanced';
const LEO_VOICE = 'Leo';
const VOWEL_PRIME_LLM_PROVIDER = 'groq';
const VOWEL_PRIME_MODEL = 'openai/gpt-oss-120b';

function isValidDemoConfigId(value: string): value is DemoConfigId {
  return value in demoConfigs;
}

function isTruthyFlag(value: string | undefined): boolean {
  return value === '1' || value === 'true';
}

function createTurnDetection(): NonNullable<VowelVoiceConfig['turnDetection']> {
  return {
    mode: DEMO_TURN_DETECTION_MODE,
    ...(DEMO_TURN_DETECTION_MODE === 'client_vad'
      ? {
          clientVAD: {
            adapter: 'silero-vad',
            config: {
              threshold: 0.5,
              minSpeechDurationMs: 250,
              silenceDurationMs: 500,
            },
            autoCommit: true,
          },
        }
      : {}),
    ...(DEMO_TURN_DETECTION_MODE === 'server_vad'
      ? {
          serverVAD: {
            threshold: 0.5,
            silenceDurationMs: 550,
            prefixPaddingMs: 0,
            interruptResponse: true,
          },
        }
      : {}),
  };
}

function createVowelPrimeVoiceConfig(
  vowelPrimeConfig?: DemoVowelPrimeConfig
): DemoVoiceConfig {
  return {
    provider: 'vowel-prime',
    llmProvider: VOWEL_PRIME_LLM_PROVIDER,
    model: VOWEL_PRIME_MODEL,
    voice: LEO_VOICE,
    vowelPrimeConfig,
    turnDetection: createTurnDetection(),
  };
}

function createGrokVoiceConfig(): DemoVoiceConfig {
  return {
    provider: 'grok',
    model: VOWEL_PRIME_MODEL,
    voice: LEO_VOICE,
    turnDetection: createTurnDetection(),
  };
}

function getVoiceConfigFromClientConfig(clientConfig: TokenProviderClientConfig): DemoVoiceConfig {
  return clientConfig._voiceConfig ?? clientConfig.voiceConfig ?? createVowelPrimeVoiceConfig();
}

function createCoreTokenProvider(endpointPreset?: string): NonNullable<VowelClientConfig['tokenProvider']> {
  if (!CORE_API_KEY) {
    throw new Error(
      'Selected a Core-backed demo config but VITE_CORE_API_KEY is missing. Add it to demos/demo/.env.local.'
    );
  }

  return async (clientConfig: TokenProviderClientConfig) => {
    const voiceConfig = getVoiceConfigFromClientConfig(clientConfig);
    const res = await fetch(CORE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${CORE_API_KEY}`,
      },
      body: JSON.stringify({
        origin: typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        config: {
          provider: 'vowel-prime',
          routes: clientConfig.routes,
          actions: clientConfig.actions,
          language: clientConfig.language,
          initialGreetingPrompt: clientConfig.initialGreetingPrompt,
          turnDetectionPreset: clientConfig.turnDetectionPreset as
            | 'aggressive'
            | 'balanced'
            | 'conservative'
            | undefined,
          systemInstructionOverride: clientConfig.systemInstructionOverride,
          voiceConfig: {
            ...voiceConfig,
            vowelPrimeConfig: {
              ...voiceConfig.vowelPrimeConfig,
              ...(endpointPreset ? { endpointPreset } : {}),
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? `Token request failed: ${res.status}`);
    }

    const data = await res.json();
    return {
      tokenName: data.tokenName ?? data.token,
      model: data.model,
      provider: data.provider ?? 'vowel-prime',
      expiresAt: data.expiresAt,
      metadata: data.metadata,
      systemInstructions: data.systemInstructions,
    };
  };
}

export const demoConfigs: Record<DemoConfigId, DemoConfigPreset> = {
  'hosted-vowel-prime': {
    id: 'hosted-vowel-prime',
    label: 'Hosted vowel-prime',
    description: 'Hosted platform appId flow using the vowel-prime staging environment.',
    appIdSource: 'platform',
    tokenSource: 'appId',
    language: DEMO_LANGUAGE,
    turnDetectionPreset: DEMO_TURN_DETECTION_PRESET,
    initialGreetingPrompt: 'Introduce yourself as a helpful voice assistant for the store. Be friendly and welcoming.',
    voiceConfig: createVowelPrimeVoiceConfig({ environment: 'staging' }),
    resolveTokenConfig: () => ({}),
  },
  grok: {
    id: 'grok',
    label: 'Hosted Grok',
    description: 'Hosted platform appId flow using the Grok realtime provider.',
    appIdSource: 'platform',
    tokenSource: 'appId',
    language: DEMO_LANGUAGE,
    turnDetectionPreset: DEMO_TURN_DETECTION_PRESET,
    initialGreetingPrompt: 'Introduce yourself as an assistant for the store.',
    voiceConfig: createGrokVoiceConfig(),
    resolveTokenConfig: () => ({}),
  },
  'core-self-hosted': {
    id: 'core-self-hosted',
    label: 'Core self-hosted',
    description: 'Core-issued ephemeral token flow using the configured Core endpoint preset.',
    appIdSource: 'core',
    tokenSource: 'core-ephemeral',
    language: DEMO_LANGUAGE,
    turnDetectionPreset: DEMO_TURN_DETECTION_PRESET,
    initialGreetingPrompt: 'Introduce yourself as a helpful voice assistant for the store. Be friendly and welcoming.',
    voiceConfig: createVowelPrimeVoiceConfig({ endpointPreset: CORE_ENDPOINT_PRESET }),
    resolveTokenConfig: () => ({
      tokenProvider: createCoreTokenProvider(CORE_ENDPOINT_PRESET),
    }),
  },
  'core-local-bun': {
    id: 'core-local-bun',
    label: 'Core → local Bun engine',
    description:
      'Core-issued ephemeral token flow for a Core instance configured with a localhost:3001 Bun engine preset.',
    appIdSource: 'core',
    tokenSource: 'core-ephemeral',
    language: DEMO_LANGUAGE,
    turnDetectionPreset: DEMO_TURN_DETECTION_PRESET,
    initialGreetingPrompt: 'Introduce yourself as a helpful voice assistant for the store. Be friendly and welcoming.',
    voiceConfig: createVowelPrimeVoiceConfig({ endpointPreset: CORE_LOCAL_BUN_ENDPOINT_PRESET }),
    resolveTokenConfig: () => ({
      tokenProvider: createCoreTokenProvider(CORE_LOCAL_BUN_ENDPOINT_PRESET),
    }),
  },
};

function resolveDefaultDemoConfigId(): DemoConfigId {
  const explicitId = import.meta.env.VITE_VOWEL_CONFIG?.trim();
  if (explicitId && isValidDemoConfigId(explicitId)) {
    return explicitId;
  }

  if (isTruthyFlag(import.meta.env.VITE_USE_CORE_COMPOSE) || isTruthyFlag(import.meta.env.VITE_CORE_SELF_HOSTED)) {
    return 'core-local-bun';
  }

  return 'hosted-vowel-prime';
}

export const selectedDemoConfigId = resolveDefaultDemoConfigId();
export const selectedDemoConfig = demoConfigs[selectedDemoConfigId];

export function getEnvAppId(): string | null {
  const appId =
    selectedDemoConfig.appIdSource === 'core'
      ? import.meta.env.VITE_CORE_APP_ID?.trim()
      : import.meta.env.VITE_VOWEL_APP_ID?.trim();

  return appId || null;
}
