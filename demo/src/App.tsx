/**
 * Main App component with vowel.to voice agent integration
 * 
 * This demo showcases the new dual adapter architecture with:
 * - NavigationAdapter: Voice-controlled routing (TanStack Router)
 * - AutomationAdapter: Voice-controlled page interaction (search, click, type, etc.)
 * - FloatingCursorRenderer: Visual feedback for automation actions (included in VowelAgent)
 * - Centralized configuration in vowel.client.ts
 * - Custom action registration for business logic
 * - Clean React integration via VowelProvider
 * 
 * The VowelProvider is now null-tolerant, allowing it to be initialized with a null client.
 * Voice components (VowelAgent) will not render until the client is available.
 * 
 * Note: VowelAgent includes FloatingCursorRenderer automatically, so we don't need to mount it separately.
 */

import { useState, useEffect } from 'react';
import { RouterProvider } from '@tanstack/react-router';
import { VowelProvider } from '@vowel.to/client/react';
import { router } from './router';
import { getVowel, subscribeToVowelChanges, type VowelClientType } from './vowel.client';
import { signIn, authStore } from './store/authStore';

/**
 * Main App component
 * 
 * VowelProvider wraps the RouterProvider to provide voice agent functionality
 * throughout the entire app. The provider accepts a null client and components
 * will gracefully not render until the client is initialized.
 * 
 * The vowel client is initialized after the AppIdProvider sets the App ID,
 * and components will automatically appear once the client is available.
 * 
 * VowelAgent (mounted in __root.tsx) includes FloatingCursorRenderer automatically.
 */
function App() {
  const [vowel, setVowel] = useState<VowelClientType>(getVowel());

  useEffect(() => {
    // Restore user from localStorage happens automatically in authStore initialization
    // Only auto-sign in as Jane Smith if no user is stored in localStorage
    // Users can sign out and choose a different user if they want
    if (!authStore.isAuthenticated) {
      const janeEmail = 'jane@example.com';
      const janePassword = 'test123';
      const success = signIn(janeEmail, janePassword);
      if (success) {
        console.log('✅ Auto-signed in as Jane Smith');
      }
    } else {
      console.log('✅ Restored user session from localStorage:', authStore.currentUser?.email);
    }
  }, []);

  useEffect(() => {
    // Subscribe to vowel client changes
    const unsubscribe = subscribeToVowelChanges((newClient) => {
      console.log('📱 [App] Vowel client changed:', newClient);
      setVowel(newClient);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <VowelProvider client={vowel as any}>
      <RouterProvider router={router} />
    </VowelProvider>
  );
}

export default App;

