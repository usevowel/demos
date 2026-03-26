/**
 * Convex Client Provider (OPTIONAL for demo app)
 * 
 * Note: This is only needed if YOUR app uses Convex for its own data.
 * The Vowel library uses its own isolated Convex client and doesn't require this provider.
 * 
 * If your app doesn't use Convex, you can remove this provider entirely!
 */

import { ReactNode } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

// This is YOUR app's Convex deployment (if you have one)
const convexUrl = import.meta.env.VITE_CONVEX_URL || 'https://your-app-deployment.convex.cloud';

const convex = new ConvexReactClient(convexUrl);

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

