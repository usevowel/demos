/**
 * useAppId Hook
 * 
 * React hook for managing App ID state
 */

import { useState, useEffect } from 'react';
import { getCurrentAppId, getAppIdFromUrl, saveAppIdToStorage } from '@/lib/appIdManager';

export function useAppId() {
  const [appId, setAppId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const currentAppId = getCurrentAppId();
    
    if (currentAppId) {
      setAppId(currentAppId);
      // If app ID came from URL, save it to storage
      const urlAppId = getAppIdFromUrl();
      if (urlAppId) {
        saveAppIdToStorage(urlAppId);
      }
    } else {
      // No app ID found, show dialog
      setShowDialog(true);
    }
  }, []);

  const handleAppIdSubmit = (newAppId: string) => {
    setAppId(newAppId);
    setShowDialog(false);
  };

  const requireAppId = () => {
    if (!appId) {
      setShowDialog(true);
      return false;
    }
    return true;
  };

  return {
    appId,
    showDialog,
    handleAppIdSubmit,
    requireAppId,
  };
}
