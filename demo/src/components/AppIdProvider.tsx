/**
 * App ID Provider
 * 
 * Wraps the application and manages App ID state
 */

import React, { useEffect } from 'react';
import { AppIdDialog } from './AppIdDialog';
import { useAppId } from '@/hooks/useAppId';
import { setAppId } from '@/vowel.client';

interface AppIdProviderProps {
  children: React.ReactNode;
}

export function AppIdProvider({ children }: AppIdProviderProps) {
  const { appId, showDialog, handleAppIdSubmit } = useAppId();

  useEffect(() => {
    if (appId) {
      // Set the app ID in the vowel client
      // This will initialize/re-initialize the vowel instance
      setAppId(appId);
    }
  }, [appId]);

  const handleSubmit = (newAppId: string) => {
    setAppId(newAppId);
    handleAppIdSubmit(newAppId);
  };

  return (
    <>
      <AppIdDialog isOpen={showDialog} onAppIdSubmit={handleSubmit} />
      {/* 
        Always render children (including VowelProvider).
        VowelProvider is now null-tolerant and voice components won't show
        until the vowel client is initialized (after App ID is set).
      */}
      {children}
    </>
  );
}

