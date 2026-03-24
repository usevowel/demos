/**
 * Hook to check feature flags from environment variables
 * 
 * This replaces the previous PostHog-based feature flag system
 * with simple environment variable checks.
 * 
 * @param flagKey - The feature flag key to check (e.g., 'NO_LOGOS')
 * @returns boolean - Whether the flag is enabled
 * 
 * @example
 * const useGenericBranding = useFeatureFlagEnabled('USE_GENERIC_BRANDING')
 */
export function useFeatureFlagEnabled(flagKey: string): boolean {
  // Map flag keys to environment variables
  const envVarMap: Record<string, string> = {
    'NO_LOGOS': 'VITE_USE_GENERIC_BRANDING',
    'USE_GENERIC_BRANDING': 'VITE_USE_GENERIC_BRANDING',
  }

  const envVar = envVarMap[flagKey] || `VITE_${flagKey}`
  
  // Check env var - defaults to true for NO_LOGOS/USE_GENERIC_BRANDING for cleaner demo
  const defaultValue = flagKey === 'NO_LOGOS' || flagKey === 'USE_GENERIC_BRANDING'
  
  try {
    const value = import.meta.env[envVar]
    if (value === 'true') return true
    if (value === 'false') return false
    return defaultValue
  } catch {
    return defaultValue
  }
}
