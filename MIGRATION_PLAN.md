# Demo Migration Plan: Sales Submodule → Demos Repository

## Executive Summary

This document outlines the plan to migrate two showcase demos from the `sales` submodule to the new `demos` repository for eventual public release.

**Target Demos:**
1. **Net Dashboard** (from `sales/dashboard-network/`) - Network management dashboard with voice control
2. **Warehouse Picker** (from `sales/auto-parts/`) - E-commerce auto parts shopping with voice-controlled cart

---

## Source Analysis

### 1. Net Dashboard (`sales/dashboard-network/`)

**What it is:**
A Cisco Nexus Dashboard-inspired network management interface featuring:
- 58 network devices across 4 types (routers, switches, APs, firewalls)
- Multi-site topology (3 buildings with hierarchical layers)
- Alert management with severity levels
- Firmware lifecycle tracking
- Interactive topology visualization using ReactFlow
- Real-time metrics with Recharts
- Tenant/VRF management views
- Event timeline
- Session notes feature

**Technology Stack:**
- React 19 + TypeScript 5.9
- Vite 7
- TanStack Router
- Valtio (state management with localStorage persistence)
- ReactFlow (topology visualization)
- Recharts (metrics/charts)
- Tailwind CSS
- vowel.to voice integration

**Files & Structure:**
```
dashboard-network/
├── src/
│   ├── components/       # 15+ React components
│   ├── routes/           # 10+ route files
│   ├── store/            # Valtio stores (device, event, topology, tenant, etc.)
│   ├── data/             # Mock data (devices.ts, events.ts, tenants.ts, etc.)
│   ├── router.ts
│   ├── vowel.client.ts   # Voice agent configuration (40+ custom actions)
│   └── main.tsx
├── public/
├── .ai/                  # AI planning artifacts (DO NOT MIGRATE)
├── .tanstack/            # Generated (DO NOT MIGRATE)
├── .wrangler/            # Cloudflare config (DO NOT MIGRATE)
├── .env                  # Local dev (DO NOT MIGRATE - has app ID)
├── .env.production       # Has REAL app ID (DO NOT MIGRATE)
├── package.json
└── vite.config.ts
```

### 2. Warehouse Picker (`sales/auto-parts/`)

**What it is:**
A voice-powered e-commerce demo for auto parts featuring:
- Product catalog with search and filtering
- Vehicle management (add/select vehicles)
- Shopping cart with 3 delivery methods
- Discount codes
- Wishlist management
- Purchase history
- Product vehicle compatibility checking

**Technology Stack:**
- React 19 + TypeScript 5.9
- Vite 7
- TanStack Router
- Valtio + valtio-persist (localStorage)
- Tailwind CSS
- PostHog analytics integration
- vowel.to voice integration

**Files & Structure:**
```
auto-parts/
├── src/
│   ├── components/       # React components
│   ├── routes/           # Route files
│   ├── store/            # Valtio stores (cart, vehicle, wishlist, purchases)
│   ├── data/
│   │   ├── products.ts   # Product catalog data
│   │   ├── auto-parts.json
│   │   └── users.ts      # Mock user data
│   ├── lib/
│   │   └── posthog.ts    # Analytics integration
│   ├── router.ts
│   ├── vowel.client.ts   # Voice agent (25+ custom actions)
│   └── main.tsx
├── public/
├── data/
│   └── auto-parts.json   # Product data
├── .tanstack/            # Generated (DO NOT MIGRATE)
├── .wrangler/            # Cloudflare config (DO NOT MIGRATE)
├── .env.production       # Has REAL app ID + PostHog key (DO NOT MIGRATE)
├── package.json
└── vite.config.ts
```

---

## Secrets & Sensitive Data Inventory

### Current Secrets Found:

| Secret | Location | Value | Action |
|--------|----------|-------|--------|
| `VITE_VOWEL_APP_ID` | `dashboard/.env.production` | `jh7894bm8xjpczdszj79x3jk9d7s7tb3` | **REMOVE** - Replace with placeholder |
| `VITE_VOWEL_APP_ID` | `dashboard-network/.env` | `jh7894bm8xjpczdszj79x3jk9d7s7tb3` | **REMOVE** - Already gitignored but present |
| `VITE_VOWEL_APP_ID` | `dashboard-network/.env.production` | `jh7894bm8xjpczdszj79x3jk9d7s7tb3` | **REMOVE** |
| `VITE_VOWEL_APP_ID` | `auto-parts/.env.production` | `jh7894bm8xjpczdszj79x3jk9d7s7tb3` | **REMOVE** |
| `VITE_POSTHOG_KEY` | `dashboard/.env.production` | `phc_jup2QLV0QA2eUtB7aLy8KQWM3ohwunkhYuuaVc3k46j` | **REMOVE** |
| `VITE_POSTHOG_KEY` | `auto-parts/.env.production` | `phc_jup2QLV0QA2eUtB7aLy8KQWM3ohwunkhYuuaVc3k46j` | **REMOVE** |
| `VITE_NO_LOGOS` | Multiple `.env.production` | `true` | **REMOVE** - Can default in code |

### .gitignore Analysis:

**Current Issues:**
1. `dashboard/.gitignore` has `!.env.production` - **DANGEROUS** - commits production env
2. `dashboard-network/.gitignore` ignores `.env` but NOT `.env.production`
3. `auto-parts/.gitignore` properly ignores all env files

---

## Migration Checklist

### Phase 1: Preparation (Before Migration)

- [ ] **Create demo structure in demos repo**
  ```
  demos/
  ├── net-dashboard/
  ├── warehouse-picker/
  └── README.md
  ```

- [ ] **Clean sensitive data from source**
  - Remove all `.env` files from git tracking
  - Remove all `.env.production` files
  - Audit for any hardcoded keys in source code
  - Check `vowel.client.ts` files for hardcoded app IDs

- [ ] **Create template .env.example files**
  - net-dashboard/.env.example
  - warehouse-picker/.env.example
  - Use placeholder values like `YOUR_VOWEL_APP_ID_HERE`

### Phase 2: Migration Steps

#### Net Dashboard Migration:

- [ ] Copy source files (excluding secrets/artifacts)
  ```bash
  # KEEP these:
  - src/ (all source code)
  - public/ (static assets)
  - package.json
  - vite.config.ts
  - tsconfig*.json
  - tailwind.config.js
  - postcss.config.mjs
  - index.html
  - README.md (rewrite for public audience)
  
  # EXCLUDE these:
  - .ai/
  - .claude/
  - .cursor/
  - .tanstack/
  - .wrangler/
  - .env*
  - bun.lockb
  - package-lock.json
  - NEXUS_DASHBOARD_ENHANCEMENTS.md (internal doc)
  - .playwright-mcp/
  ```

- [ ] **Update package.json**
  - Change name from `dashboard-network-temp` to `@vowel.to/demo-net-dashboard`
  - Remove wrangler deploy scripts (or make optional)
  - Update dependencies to use published `@vowel.to/client` instead of `link:`

- [ ] **Rewrite README.md**
  - Remove internal-only references
  - Add setup instructions for public users
  - Document voice capabilities
  - Add screenshots/animated GIFs

- [ ] **Create .env.example**
  ```bash
  # Vowel App ID - Get yours at https://vowel.to
  VITE_VOWEL_APP_ID=your_app_id_here
  ```

#### Warehouse Picker Migration:

- [ ] Copy source files (same exclusion rules as above)

- [ ] **Handle PostHog integration**
  - Option A: Remove PostHog entirely (simpler)
  - Option B: Make it optional with feature flag
  - Option C: Replace with generic analytics placeholder

- [ ] **Update package.json**
  - Change name from `auto-parts-vowel-demo` to `@vowel.to/demo-warehouse-picker`
  - Remove `posthog-js` or make optional

- [ ] **Clean up brand references**
  - Current code has "Advance Auto Parts" vs "Vowel Auto Parts" toggle
  - For public release, should default to generic "Auto Parts" or "Warehouse"
  - Review `NO_LOGOS` logic and simplify

- [ ] **Create .env.example**
  ```bash
  # Vowel App ID - Get yours at https://vowel.to
  VITE_VOWEL_APP_ID=your_app_id_here
  
  # Optional: Disable logos for generic branding
  VITE_NO_LOGOS=true
  ```

### Phase 3: Post-Migration Cleanup

- [ ] **Verify no secrets in git history**
  ```bash
  cd demos
  git log --all --full-history -- .env
  git log --all --full-history -- '*app_id*'
  git log --all --full-history -- '*phc_*'  # PostHog keys
  ```

- [ ] **Update .gitignore in demos repo**
  ```gitignore
  # Environment variables
  .env
  .env.local
  .env.*.local
  .env.production
  
  # Generated files
  .tanstack/
  src/routeTree.gen.ts
  
  # Build artifacts
  dist/
  dist-ssr/
  
  # Package managers
  bun.lockb
  package-lock.json
  yarn.lock
  pnpm-lock.yaml
  ```

- [ ] **Test both demos**
  - Install dependencies
  - Configure with test app ID
  - Verify voice features work
  - Build successfully

- [ ] **Update main demos README.md**
  - Document both demos
  - Add screenshots
  - Include setup instructions

---

## Files to Exclude from Migration

### Never Include:
1. `.env*` files (all environment files)
2. `.ai/` directories (AI planning artifacts)
3. `.claude/` directories (Claude-specific configs)
4. `.cursor/` directories (Cursor IDE configs)
5. `.tanstack/` directories (generated router files)
6. `.wrangler/` directories (Cloudflare deployment config)
7. `.playwright-mcp/` directories (test artifacts)
8. `bun.lockb` / `package-lock.json` (lock files)
9. `*.tsbuildinfo` (TypeScript build info)
10. `dist/` / `dist-ssr/` (build outputs)
11. `wrangler.toml` (if it contains account IDs)
12. Internal documentation (e.g., `NEXUS_DASHBOARD_ENHANCEMENTS.md`)

### Review Before Including:
1. `README.md` - Rewrite for public audience
2. `vowel.client.ts` - Check for hardcoded config
3. `package.json` - Remove internal dependencies/scripts
4. Any config files with account IDs or project-specific values

---

## Voice Integration Considerations

### App ID Strategy:

Since demos will be public, we need a strategy for the `VITE_VOWEL_APP_ID`:

**Option A: Placeholder (Recommended)**
- Use placeholder in .env.example
- Users must get their own app ID from vowel.to
- Most transparent but adds friction

**Option B: Demo App ID**
- Create a special "demo" app ID on vowel.to
- Hardcode in examples (rate-limited, restricted)
- Easier for users but requires backend support

**Option C: Hybrid**
- Use demo app ID as fallback in code
- Allow override via .env
- Best UX but more complex

### Recommended: Option A (Placeholder)

```typescript
// In vowel.client.ts
const appId = import.meta.env.VITE_VOWEL_APP_ID

if (!appId) {
  console.warn(
    '⚠️ VITE_VOWEL_APP_ID not found. ' +
    'Get your free app ID at https://vowel.to to enable voice features.'
  )
}
```

---

## PostHog Analytics Decision

The auto-parts demo has PostHog integration for analytics tracking.

**Decision: REMOVE for public demos**

Reasons:
1. Requires PostHog account (extra setup friction)
2. Analytics tracking not essential for demo functionality
3. Simpler code = easier to understand
4. Users can add their own analytics if needed

**Action:**
- Remove `posthog-js` dependency
- Remove PostHog initialization code
- Remove `VITE_POSTHOG_KEY` references
- Keep the `NO_LOGOS` feature flag logic (rename to `VITE_USE_GENERIC_BRANDING`)

---

## Branding Decisions

### Net Dashboard:
- Currently has generic "Network Dashboard" branding
- No changes needed

### Warehouse Picker:
- Currently has "Advance Auto Parts" vs "Vowel Auto Parts" toggle
- For public demos: Use generic "Auto Parts Warehouse" branding
- Remove the brand name complexity
- Keep the `NO_LOGOS` flag but rename to `VITE_GENERIC_BRANDING`

---

## Timeline

1. **Day 1:** Audit and document current state ✓ (this document)
2. **Day 2:** Prepare clean copies of both demos
3. **Day 3:** Migrate Net Dashboard
4. **Day 4:** Migrate Warehouse Picker
5. **Day 5:** Testing and documentation
6. **Day 6:** Final review and commit

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Secrets leaked in git history | HIGH | Audit history before first commit to public repo |
| Missing dependencies after migration | MEDIUM | Test both demos completely after migration |
| Voice features don't work with placeholder | MEDIUM | Add clear documentation about getting app ID |
| Complex build/setup frustrates users | MEDIUM | Provide simple setup instructions, use npm (not bun) |
| Internal references remain in code | LOW | Code review with fresh eyes |

---

## Success Criteria

- [ ] Both demos build successfully with `npm install && npm run build`
- [ ] No secrets present in repository
- [ ] README clearly explains setup process
- [ ] Voice features work when configured with valid app ID
- [ ] No internal/sales-specific references remain
- [ ] Demos are runnable by external developers

---

## Next Steps

1. Review and approve this plan
2. Create clean working branches
3. Begin Phase 1: Preparation
4. Execute migrations
5. Test and validate
6. Merge to main and tag for release
