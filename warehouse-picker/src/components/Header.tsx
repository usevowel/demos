import { useLocation, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useFeatureFlagEnabled } from '@/hooks/useFeatureFlagEnabled'

/**
 * Header component with logo display logic
 * 
 * NO_LOGOS feature flag: If enabled via PostHog, hides logos and shows "vowel | auto parts" text
 * URL param ?l=1: Shows logo.svg image (only if NO_LOGOS is not enabled)
 * No param: Shows "vowel | auto parts" text
 */
export function Header() {
  const location = useLocation()
  
  // Check NO_LOGOS feature flag from PostHog
  const noLogos = useFeatureFlagEnabled('NO_LOGOS')
  
  // Parse URL search params to check for ?l=1
  const showLogo = useMemo(() => {
    if (noLogos) return false
    // Access search params from window.location since location.search is an object in TanStack Router
    const params = new URLSearchParams(window.location.search)
    return params.get('l') === '1'
  }, [location.search, noLogos])

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {showLogo ? (
              <img
                src="/images/logo.svg"
                alt="Auto Parts Logo"
                className="h-12 w-auto"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white px-2 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    window.open('https://vowel.to', '_blank', 'noopener,noreferrer')
                  }}
                  className="font-ocr-a hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  vowel
                </button>
                <span>|</span>
                <Link
                  to="/"
                  search={{ l: undefined }}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  auto parts
                </Link>
              </h1>
            )}
          </div>
          <nav className="flex items-center space-x-4">
            <a
              href="/"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Home
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}
