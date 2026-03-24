import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

/**
 * Application router configuration
 * Must be separate from vowel.client.ts to avoid circular dependencies
 */
export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
