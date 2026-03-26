/**
 * Root route component - Layout wrapper for all pages
 * 
 * Important: Do NOT import vowel or VowelProvider here!
 * This would create a circular dependency:
 *   router.ts → routeTree.gen.ts → __root.tsx → vowel.client.ts → router.ts ❌
 * 
 * Instead, VowelProvider is in App.tsx, and routes can access vowel via useVowel() hook
 */

import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { useSnapshot } from 'valtio'
import { authStore, signOut } from '@/store/authStore'
import { cartStore, getCartCount } from '@/store/cartStore'
import { VowelAgent } from '@vowel.to/client/react'

/**
 * Navigation component with user info and cart
 */
function Navigation() {
  const auth = useSnapshot(authStore)
  const cart = useSnapshot(cartStore)
  const cartCount = getCartCount()
  const isAdmin = auth.currentUser?.role === 'admin'

  return (
    <div className="navbar bg-base-200">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
          >
            {isAdmin && (
              <>
                <li className="menu-title">Admin</li>
                <li><Link to="/dashboard">Dashboard</Link></li>
                <li><Link to="/admin/products">Manage Products</Link></li>
                <li><Link to="/users">Users</Link></li>
                <li><Link to="/admin/carts">View Carts</Link></li>
                <li className="menu-title">Shop</li>
              </>
            )}
            <li><Link to="/products">Products</Link></li>
            <li><Link to="/search">Search</Link></li>
          </ul>
        </div>
        <Link to="/" className="btn btn-ghost text-xl">
          <span style={{ fontFamily: 'OCR-A, monospace' }}>vowel</span>
          <span className="mx-1">|</span>
          <span>shop</span>
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          {isAdmin && (
            <li>
              <details>
                <summary>Admin</summary>
                <ul className="p-2 bg-base-100 rounded-t-none">
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/admin/products">Manage Products</Link></li>
                  <li><Link to="/users">Users</Link></li>
                  <li><Link to="/admin/carts">View Carts</Link></li>
                </ul>
              </details>
            </li>
          )}
          <li><Link to="/products">Products</Link></li>
          <li><Link to="/search">Search</Link></li>
        </ul>
      </div>

      <div className="navbar-end gap-2">
        {/* Cart icon - only show for logged in non-admin users */}
        {auth.isAuthenticated && !isAdmin && (
          <Link to="/cart" className="btn btn-ghost btn-circle indicator">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            {cartCount > 0 && (
              <span className="badge badge-sm indicator-item">{cartCount}</span>
            )}
          </Link>
        )}

        {auth.isAuthenticated ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img
                  alt={auth.currentUser?.name}
                  src={auth.currentUser?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li className="menu-title">
                <span>{auth.currentUser?.name}</span>
                {isAdmin && <span className="badge badge-primary badge-xs">Admin</span>}
              </li>
              {isAdmin && (
                <>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                  <li><Link to="/admin/products">Manage Products</Link></li>
                  <li><Link to="/admin/carts">View Carts</Link></li>
                </>
              )}
              <li><a onClick={() => signOut()}>Logout</a></li>
            </ul>
          </div>
        ) : (
          <div className="gap-2">
            <Link to="/signin" className="btn btn-ghost">
              Sign In
            </Link>
            <Link to="/signup" className="btn btn-primary">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Root layout component
 */
function RootComponent() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      {/* Standard Vowel mic button - floats in bottom right corner */}
      <VowelAgent position="bottom-right" />
      
      <TanStackRouterDevtools />
    </div>
  )
}

export const Route = createRootRoute({
  component: RootComponent,
})

