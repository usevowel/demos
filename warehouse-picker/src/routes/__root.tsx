import { createRootRoute, Outlet, useLocation } from '@tanstack/react-router'
import { Header } from '@/components/Header'
import { CartOverlay } from '@/components/CartOverlay'

/**
 * Root route component with main layout
 * 
 * Note: VowelAgent is rendered in main.tsx at the app level, not here.
 * This ensures it has access to the VowelProvider context.
 */
export const Route = createRootRoute({
  component: () => {
    const location = useLocation()
    // Hide header on pages that use AppHeader (landing/home, category, product detail, cart)
    const isLandingPage = location.pathname === '/' || location.pathname === '/landing'
    const isCategoryPage = location.pathname === '/category'
    const isProductPage = location.pathname.startsWith('/product/')
    const isCartPage = location.pathname === '/cart'
    
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {!isLandingPage && !isCategoryPage && !isProductPage && !isCartPage && <Header />}
        <main className="flex-1">
          <Outlet />
        </main>
        {/* Cart Overlay - available on all pages */}
        <CartOverlay />
      </div>
    )
  },
})
