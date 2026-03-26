/**
 * Dashboard page route (Admin Only)
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { authStore } from '@/store/authStore'
import { productsStore } from '@/store/productsStore'
import { usersStore } from '@/store/usersStore'
import { cartStore, getCartTotal } from '@/store/cartStore'
import { RequireAdmin } from '@/lib/auth'

/**
 * Dashboard component showing overview and key metrics (Admin Only)
 */
function DashboardPage() {
  const auth = useSnapshot(authStore)
  const products = useSnapshot(productsStore)
  const users = useSnapshot(usersStore)
  const cart = useSnapshot(cartStore)
  
  const totalProducts = products.products.length
  const inStockProducts = products.products.filter(p => p.inStock).length
  const totalUsers = users.users.length
  const cartTotal = getCartTotal()

  return (
    <RequireAdmin>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Admin Dashboard</h1>
          <p className="text-lg mt-2">
            Welcome back, {auth.currentUser?.name || 'Guest'}! 👋
          </p>
        </div>

      {/* Stats Overview */}
      <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="stat-title">Total Products</div>
          <div className="stat-value text-primary">{totalProducts}</div>
          <div className="stat-desc">{inStockProducts} in stock</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </div>
          <div className="stat-title">Users</div>
          <div className="stat-value text-secondary">{totalUsers}</div>
          <div className="stat-desc">Registered users</div>
        </div>

        <div className="stat">
          <div className="stat-figure text-success">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block w-8 h-8 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
          </div>
          <div className="stat-title">Cart Value</div>
          <div className="stat-value text-success">${cartTotal.toFixed(2)}</div>
          <div className="stat-desc">{cart.items.length} items</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/products" className="card bg-primary text-primary-content hover:scale-105 transition-transform">
          <div className="card-body">
            <h3 className="card-title">✏️ Manage Products</h3>
            <p>CRUD operations for products</p>
          </div>
        </Link>

        <Link to="/admin/carts" className="card bg-secondary text-secondary-content hover:scale-105 transition-transform">
          <div className="card-body">
            <h3 className="card-title">🛒 View Carts</h3>
            <p>Monitor all user carts</p>
          </div>
        </Link>

        <Link to="/users" className="card bg-base-200 hover:bg-base-300 transition-colors">
          <div className="card-body">
            <h3 className="card-title">👥 Users</h3>
            <p>Manage user accounts</p>
          </div>
        </Link>

        <Link to="/products" className="card bg-base-200 hover:bg-base-300 transition-colors">
          <div className="card-body">
            <h3 className="card-title">🛍️ Products</h3>
            <p>Browse product catalog</p>
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Recent Activity</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="badge badge-success">New</span>
              <span>10 new products added this week</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-info">Update</span>
              <span>3 users registered today</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-warning">Alert</span>
              <span>2 products low in stock</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </RequireAdmin>
  )
}

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
})

