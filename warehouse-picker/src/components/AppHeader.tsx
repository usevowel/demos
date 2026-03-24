import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { Search, MapPin, Menu, ChevronDown, ShoppingCart, Car, RotateCcw, Heart, Package } from 'lucide-react'
import { openCartOverlay, cartStore, clearCart } from '@/store/cart'
import { openVehicleModal, getVehicleDisplayName, vehicleStore } from '@/store/vehicle'
import { VehicleSelectorModal } from './VehicleSelectorModal'
import { useFeatureFlagEnabled } from '@/hooks/useFeatureFlagEnabled'
import { resetToDefaultData } from '@/store/mockData'

/**
 * Reusable header component with logo, vehicle selector, search, and sticky navigation
 * Used on landing page and category/search results pages
 * 
 * NO_LOGOS feature flag: If enabled via PostHog, hides logos and shows "vowel | auto parts" text
 */
export function AppHeader({ showLogo = true }: { showLogo?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const cart = useSnapshot(cartStore)
  const cartItemCount = cart.items.reduce((total, item) => total + item.quantity, 0)
  const navigate = useNavigate()
  const vehicleDisplayName = getVehicleDisplayName()
  const vehicleButtonRef = useRef<HTMLButtonElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const vehicle = useSnapshot(vehicleStore)

  // Check NO_LOGOS feature flag from PostHog
  const noLogos = useFeatureFlagEnabled('NO_LOGOS')
  console.log("[Feature Flag] No Logos Flag", noLogos)
  const shouldShowLogo = showLogo && !noLogos

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [userMenuOpen])

  /**
   * Handle reset to default data
   * Resets all stores (vehicles, wishlist, purchases, cart) back to default state
   * Navigates to homepage and clears cart
   */
  const handleResetToDefault = async () => {
    try {
      // Clear cart first
      clearCart()
      
      // Reset all stores to default data
      await resetToDefaultData()
      
      // Close menu
      setUserMenuOpen(false)
      
      // Navigate to homepage and reload to ensure clean state
      window.location.href = '/'
    } catch (error) {
      console.error('Error resetting to default data:', error)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black text-white shadow-lg">
      <div className="w-full">
        {/* Main Header Strip */}
        <div className=" flex flex-row items-center gap-3 lg:gap-4 px-4 py-2">
          {/* Logo or Text - show logo only if showLogo is true and NO_LOGOS is not set */}
          {shouldShowLogo ? (
            <Link
              to="/"
              search={{ l: undefined }}
              className="flex-shrink-0 lg:mr-4 hover:opacity-80 transition-opacity"
            >
              <img
                src="/images/logo.svg"
                alt={noLogos ? "Vowel Auto Parts" : "Advance Auto Parts"}
                className="h-12 lg:h-16 w-auto"
              />
            </Link>
          ) : (
            <div className="flex-shrink-0 lg:mr-4">
              <h1 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    window.open('https://vowel.to', '_blank', 'noopener,noreferrer')
                  }}
                  className="font-ocr-a text-2xl lg:text-3xl hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  vowel
                </button>
                <span>|</span>
                <Link
                  to="/"
                  search={{ l: undefined }}
                  className="hover:text-yellow-400 transition-colors cursor-pointer"
                >
                  auto parts
                </Link>
              </h1>
            </div>
          )}

          {/* Vehicle Selector */}
          <div className="flex-shrink-0 relative">
            <button
              ref={vehicleButtonRef}
              onClick={openVehicleModal}
              className="bg-yellow-500 text-gray-900 px-2 py-1.5 sm:px-3 lg:px-4 lg:py-2 rounded text-sm lg:text-base flex items-center justify-center gap-1.5 font-semibold hover:bg-yellow-400 transition-colors whitespace-nowrap"
            >
              <Car className="w-4 h-4 sm:hidden" />
              <span className="hidden sm:inline lg:hidden">Select Vehicle</span>
              <span className="hidden lg:inline">{vehicleDisplayName}</span>
              <ChevronDown className="w-4 h-4 hidden lg:block" />
            </button>
            {/* Vehicle Modal attached to button */}
            {vehicle.modalOpen && (
              <VehicleSelectorModal buttonRef={vehicleButtonRef} />
            )}
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <input
                type="text"
                placeholder="What part do you need today?"
                className="w-full px-4 py-2 pl-10 pr-10 rounded text-gray-900 text-sm lg:text-base focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            {/* Location */}
            <div className="hidden xl:flex items-center gap-1.5 text-xs lg:text-sm">
              <MapPin className="w-3 h-3 lg:w-4 lg:h-4" />
              <span className="whitespace-nowrap">2350 3rd St S Jacksonville, FL 32250</span>
            </div>

            {/* Sign In / User Menu */}
            <div ref={userMenuRef} className="hidden lg:block relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1 text-sm hover:text-yellow-400 transition-colors whitespace-nowrap"
                type="button"
              >
                Alex S.
                <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu - rendered outside button hierarchy */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <div
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate({ to: '/wishlist' as any })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setUserMenuOpen(false)
                        navigate({ to: '/wishlist' as any })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Heart className="w-4 h-4" />
                    My Wishlist
                  </div>
                  <div
                    onClick={() => {
                      setUserMenuOpen(false)
                      navigate({ to: '/purchases' as any })
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setUserMenuOpen(false)
                        navigate({ to: '/purchases' as any })
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="w-4 h-4" />
                    Previous Purchases
                  </div>
                  <div className="border-t border-gray-200 my-1" />
                  <div
                    onClick={handleResetToDefault}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleResetToDefault()
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset Demo State
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <button
              onClick={openCartOverlay}
              className="flex items-center gap-1 text-sm hover:text-yellow-400 transition-colors whitespace-nowrap relative"
            >
              <ShoppingCart className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="hidden sm:inline">{cartItemCount}</span>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Shop All Row - White background section below header */}
        <section className="bg-white border-b border-gray-200">
          <nav className="px-4 sm:px-6 lg:px-8">
            <div className="flex py-3 items-center gap-1.5 sm:gap-2 lg:gap-3 text-[10px] sm:text-xs lg:text-sm justify-start overflow-x-auto">
              {['Shop All', 'Replacement Parts', 'Performance Parts', 'Accessories', 'Oil & Fluids', 'Special Offers', 'Speed Perks', 'Advice & How-Tos', 'Project Guides', 'FAQ / Help Desk', 'Store Locator', 'Order Lookup'].map((item, index, array) => {
                const isSpecialOffers = item === 'Special Offers'
                return (
                  <div key={item} className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">
                    <button
                      onClick={() => {
                        navigate({
                          to: '/category' as any,
                          search: { category: undefined, q: undefined, page: 1 } as any,
                        })
                      }}
                      className={`hover:text-yellow-500 transition-colors whitespace-nowrap text-gray-700 text-left ${isSpecialOffers ? 'text-yellow-500 font-semibold' : ''}`}
                    >
                      {item}
                    </button>
                    {index < array.length - 1 && (
                      <span className="text-gray-300">|</span>
                    )}
                  </div>
                )
              })}
            </div>
          </nav>
        </section>
      </div>
    </header>
  )
}

/**
 * Spacer component to account for fixed header height
 * Updated to accommodate larger logo
 */
export function HeaderSpacer() {
  return <div className="h-[85px] lg:h-[125px]"></div>
}
