# OSS Strategy Alignment Audit

**Date:** March 24, 2026  
**Auditor:** Claude (AI Agent)  
**Scope:** Sales submodule demos - Net Dashboard & Warehouse Picker  
**OSS Strategy Doc:** `.ai/plans/mar-26/opensource-strategy.md`

---

## Executive Summary

After reviewing the OSS strategy and auditing the demo code, I've identified **significant misalignments** that must be addressed before public release. The demos contain:

1. **Internal infrastructure references** (Cloudflare Workers, Durable Objects)
2. **Hosted service configuration** (vowel-prime staging, AssemblyAI)
3. **Provider model specifics** that expose internal provider routing
4. **Domain names** pointing to internal infrastructure

**Recommendation:** These issues require code changes, not just file exclusion.

---

## Critical OSS Violations

### 1. Cloudflare-Specific Infrastructure (CRITICAL)

**Finding:** Net Dashboard is a Cloudflare dashboard clone with extensive CF-specific references.

**Locations:**
```
sales/dashboard/src/store/defaultData.ts
  - Lines 583-1056: Complete Workers & Pages mock data
  - References: 'wrangler', 'workers.dev', 'durable_object' bindings
  
sales/dashboard/src/store/workersRoutesStore.ts
  - Lines 1-59: Workers Routes store
  
sales/dashboard/src/store/workersPagesStore.ts
  - Lines 1-118: Workers & Pages store with binding types
  
sales/dashboard/src/routes/account/compute-ai/workers-pages/
  - Complete UI for managing Cloudflare Workers

sales/dashboard/vite.config.ts
  - Line 4: import { cloudflare } from '@cloudflare/vite-plugin'
  - Line 12: cloudflare() plugin
```

**OSS Issue:** Exposes internal Cloudflare deployment architecture - exactly what the OSS strategy says should stay in the **private hosted wrapper repo**.

> From OSS strategy: "The private hosted repo should contain: Cloudflare-specific entrypoints, hosted deployment bootstrap and config, wrangler configuration"

**Required Action:** 
- **Option A:** Remove Cloudflare-specific sections entirely
- **Option B:** Genericize to "compute instances" without CF-specific terminology
- **Option C:** Do not migrate this demo (it's too CF-specific)

---

### 2. vowel-prime Provider References (CRITICAL)

**Finding:** Multiple references to `vowel-prime` hosted service in voice config.

**Locations:**
```
sales/dashboard-network/src/vowel.client.ts
  - Line 275: provider: 'vowel-prime'
  - Line 276: vowelPrimeConfig: { environment: 'staging' }
  
sales/auto-parts/src/vowel.client.ts
  - Lines 400-404: vowel-prime config with environment: "testing"
  
sales/continuing-ed/src/vowel.client.ts
  - Line 387: vowelPrimeConfig: { environment: 'staging' }
  
sales/dashboard-ra/src/vowel.client.ts
  - Line 204: provider: 'vowel-prime'
```

**OSS Issue:** `vowel-prime` is the **hosted/proprietary** voice provider. The OSS strategy explicitly separates:
- Public: `usevowel/engine` (self-hosted engine)
- Private: hosted wrapper with proprietary provider composition

Exposing `vowel-prime` config in public demos:
1. Promotes the hosted service over self-hosted
2. Exposes internal environment names (staging, testing)
3. Violates the boundary between public engine and private hosted code

**Required Action:**
- Replace `vowel-prime` with generic `openai` or `grok` providers
- Remove `vowelPrimeConfig` entirely
- Update to use direct API providers (OpenAI, xAI)

---

### 3. Internal Provider Routing (HIGH)

**Finding:** Code exposes internal LLM provider routing infrastructure.

**Locations:**
```
sales/dashboard-network/src/vowel.client.ts
  - Line 278: llmProvider: "openrouter"
  - Lines 280-284: Commented model options showing internal routing:
      // model: "minimax/minimax-m2.1",
      // model: "minimax/minimax-m2.5",
      // model: "minimax/minimax-m2:nitro",
      // model: 'openai/gpt-oss-120b',
      model: "z-ai/glm-4.7-flash",
      
sales/dashboard/src/vowel.client.ts
  - Lines 1054-1057: groq, openrouter providers
  - Line 1057: model: 'z-ai/glm-4.7-flash:nitro'
  
sales/auto-parts/src/vowel.client.ts
  - Lines 407-411: groq, openrouter references
  - Lines 409, 419: moonshotai/kimi-k2-instruct references
```

**OSS Issue:**
1. **OpenRouter** is a third-party routing service - exposing it implies internal architecture
2. **Model names** like `z-ai/glm-4.7-flash`, `minimax/minimax-m2` expose specific provider routing
3. These are implementation details of the hosted service, not public API

> From OSS strategy: "hosted/proprietary runtime and provider wiring" stays private

**Required Action:**
- Simplify to direct provider configs (OpenAI, Grok)
- Remove OpenRouter references
- Remove Chinese model references (minimax, z-ai/glm)
- Use standard OpenAI models (gpt-4o, gpt-4o-mini)

---

### 4. AssemblyAI Integration (MEDIUM)

**Finding:** AssemblyAI-specific speech-to-text configuration.

**Locations:**
```
sales/dashboard-network/src/vowel.client.ts
  - Lines 46-49: "Server-side VAD uses AssemblyAI ASR with integrated VAD"
  - Lines 303-325: Full AssemblyAI config with wordBoost arrays
  
sales/continuing-ed/src/vowel.client.ts
  - Lines 424-448: AssemblyAI providerConfig
  
sales/auto-parts/src/vowel.client.ts
  - Lines 434-456: AssemblyAI providerConfig
```

**OSS Issue:** While AssemblyAI is a third-party service, the specific integration details (wordBoost arrays, sampleRate configs) expose internal implementation. This creates a maintenance burden if the hosted service changes providers.

**Required Action:**
- Remove AssemblyAI-specific configuration
- Use generic `server_vad` mode without provider-specific config
- Or use `client_vad` (default) to avoid provider dependencies

---

### 5. Internal Domain Names (HIGH)

**Finding:** Hardcoded references to internal infrastructure domains.

**Locations:**
```
sales/dashboard/src/store/defaultData.ts
  - Line 757: 'speaktest-server.vowel.workers.dev'
  - Line 762: '*-speaktest-server.vowel.workers.dev'
  - Line 941: 'staging-server.vowel.workers.dev'
  - Line 946: '*-staging-server.vowel.workers.dev'
  
sales/dashboard/src/vowel.client.ts
  - Multiple references to Cloudflare worker processes
```

**OSS Issue:** Exposes internal infrastructure naming conventions and staging environments.

**Required Action:**
- Remove all `.vowel.workers.dev` references
- Use generic example domains (`example.com`, `demo.local`)

---

### 6. Gemini Live References (PER OSS STRATEGY)

**Finding:** Despite OSS strategy saying "purge all references to Gemini Live", skills still reference it.

**Locations:**
```
sales/.opencode/skills/vowel-vite-demo/SKILL.md
sales/.cursor/skills/vowel-vite-demo/SKILL.md
  - Lines 208-212: Gemini Live configuration examples
```

**Note:** The demos themselves don't use Gemini Live, but the skills that create them do. This is in the `.skills/` directories which should be excluded anyway.

**Required Action:**
- Already covered by excluding `.skills/` directories
- Verify no Gemini Live in actual demo code (confirmed: none found)

---

## OSS Strategy Alignment Matrix

| Violation | Severity | Effort to Fix | Recommendation |
|------------|----------|---------------|----------------|
| Cloudflare-specific code | CRITICAL | High (days) | **Remove or genericize** |
| vowel-prime references | CRITICAL | Medium (hours) | **Replace with openai/grok** |
| Provider routing details | HIGH | Medium (hours) | **Simplify config** |
| Internal domain names | HIGH | Low (minutes) | **Find/replace** |
| AssemblyAI specifics | MEDIUM | Low (minutes) | **Remove or genericize** |
| Staging environment refs | MEDIUM | Low (minutes) | **Remove** |

---

## Revised Migration Recommendations

### Net Dashboard (`sales/dashboard-network/`)

**Decision: DO NOT MIGRATE AS-IS**

This demo is too deeply coupled with:
1. Cloudflare-specific infrastructure concepts
2. Internal `vowel-prime` provider configuration
3. Complex provider routing (OpenRouter, multiple LLMs)

**Alternative Options:**

**Option A: Create New Generic Network Dashboard**
- Keep the network topology visualization (ReactFlow)
- Keep device/firmware/alert management
- Remove all Cloudflare-specific sections (Workers, Pages, Email Workers)
- Replace `vowel-prime` with `openai` provider
- Simplify to single LLM (gpt-4o-mini)
- **Effort:** 2-3 days refactoring

**Option B: Migrate with Heavy Modifications**
- Remove Workers/Pages stores and routes
- Genericize remaining infrastructure concepts
- Replace voice config entirely
- **Risk:** May break voice features
- **Effort:** 3-4 days

**Option C: Skip This Demo**
- Focus on Warehouse Picker (simpler, less infrastructure-specific)
- Create a new network demo from scratch if needed
- **Effort:** 0 (for this demo)

### Warehouse Picker (`sales/auto-parts/`)

**Decision: MIGRATE WITH MODIFICATIONS**

This demo is more suitable but still needs changes:

**Required Changes:**
1. **Remove PostHog** (already planned)
2. **Replace voice config:**
   - Change `vowel-prime` to `openai`
   - Remove AssemblyAI-specific config
   - Remove `environment: 'testing'`
   - Simplify to standard OpenAI model
3. **Remove brand toggle complexity** (`NO_LOGOS`)
   - Default to generic "Auto Parts Warehouse" branding
4. **Clean up hardcoded addresses**
   - Jacksonville store address (line 991 in vowel.client.ts)
   - Make generic or configurable

**Effort:** 1 day

---

## Code Changes Required

### For Warehouse Picker (auto-parts)

**File: `src/vowel.client.ts`**

Current (lines 400-462):
```typescript
voiceConfig: {
  provider: 'vowel-prime',
  vowelPrimeConfig: {
    environment: "testing",
  },
  llmProvider: 'groq',
  // ... complex AssemblyAI config
}
```

Should become:
```typescript
voiceConfig: {
  provider: 'openai',  // or 'grok'
  token: import.meta.env.VITE_OPENAI_TOKEN,  // User provides their own
  model: 'gpt-4o-mini',
  voice: 'alloy',
  language: 'en-US',
  // No providerConfig - use defaults
}
```

**File: `README.md`**
- Change: "Voice Provider: vowel-prime (staging environment)"
- To: "Voice Provider: OpenAI Realtime API (user-provided token)"

---

## Summary

| Demo | Migrate? | Effort | Key Issues |
|------|----------|--------|------------|
| Net Dashboard | **No/Refactor** | 2-4 days | Too CF-specific, vowel-prime, complex routing |
| Warehouse Picker | **Yes** | 1 day | vowel-prime, AssemblyAI, branding |

**The OSS Strategy is clear:**
- Public repos = self-hosted products (`stack`, `core`, `engine`)
- Private repos = hosted deployment wrapper
- Demos should showcase **public/self-hosted** capabilities, not hosted internals

**The current demos showcase the hosted service (`vowel-prime`), not the self-hosted stack.**

This is backwards from the OSS strategy's intent.

---

## Final Recommendation

1. **Do not migrate Net Dashboard** - it's too coupled to Cloudflare concepts
2. **Migrate Warehouse Picker** with voice config changes to use OpenAI directly
3. **Consider creating new demos** that showcase the self-hosted stack:
   - Demo using `usevowel/core` for token issuance
   - Demo using `usevowel/engine` directly
   - Demo with Docker Compose setup

4. **Update skills** to generate demos using `openai` provider, not `vowel-prime`

The demos should answer: "How do I self-host vowel?"  
Not: "How do I use the hosted vowel-prime service?"
