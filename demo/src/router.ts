/**
 * Router Configuration
 * 
 * ⚠️ IMPORTANT: This file must be separate from vowel.client.ts!
 * 
 * Why? To avoid circular dependency:
 *   vowel.client.ts → routeTree.gen.ts → __root.tsx → vowel.client.ts ❌
 * 
 * Correct structure:
 *   1. router.ts → routeTree.gen.ts → __root.tsx (no vowel here!)
 *   2. vowel.client.ts → router.ts (already initialized)
 *   3. App.tsx → router.ts + vowel.client.ts ✅
 */

import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';

// Create and export router instance
export const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

