/**
 * App ID Manager
 *
 * Manages vowel.to App ID from environment variables, URL parameters, and local storage
 */

const APP_ID_STORAGE_KEY = 'vowel-app-id';

import { getEnvAppId } from '@/vowel.config';

/**
 * Get app ID from environment variable (for production builds)
 * When Core self-hosted is enabled, uses VITE_CORE_APP_ID (Core app) instead of VITE_VOWEL_APP_ID (platform app)
 */
export function getAppIdFromEnv(): string | null {
  return getEnvAppId();
}

/**
 * Get app ID from URL search params
 */
export function getAppIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('appId');
}

/**
 * Get app ID from local storage
 */
export function getAppIdFromStorage(): string | null {
  try {
    return localStorage.getItem(APP_ID_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Save app ID to local storage
 */
export function saveAppIdToStorage(appId: string): void {
  try {
    localStorage.setItem(APP_ID_STORAGE_KEY, appId);
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

/**
 * Remove app ID from local storage
 */
export function removeAppIdFromStorage(): void {
  try {
    localStorage.removeItem(APP_ID_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

/**
 * Get the current app ID (from environment, URL, or storage)
 * Priority: Environment > URL > Local Storage > null
 */
export function getCurrentAppId(): string | null {
  return getAppIdFromEnv() || getAppIdFromUrl() || getAppIdFromStorage();
}

/**
 * Check if app ID is available
 */
export function hasAppId(): boolean {
  return getCurrentAppId() !== null;
}

/**
 * Default URL to retrieve app ID
 */
export const DEFAULT_APP_ID_URL = 'http://localhost:3000/apps';
