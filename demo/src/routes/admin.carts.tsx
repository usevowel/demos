/**
 * Admin Cart Viewer page - View all users' shopping carts (Admin Only)
 */

import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useSnapshot } from 'valtio'
import { usersStore } from '@/store/usersStore'
import {
  cartStore,
  getAllUserCarts,
  getUserCartWithProducts,
  getUserCartTotal,
} from '@/store/cartStore'
import { RequireAdmin } from '@/lib/auth'

/**
 * Admin Cart Viewer component
 */
function AdminCartsPage() {
  const { users } = useSnapshot(usersStore)
  const cart = useSnapshot(cartStore)
  const [selectedUserId, setSelectedUserId] = useState<string>('')

  const allUserCarts = getAllUserCarts()
  const usersWithCarts = users.filter(user => 
    allUserCarts.some(uc => uc.userId === user.id)
  )

  const selectedUserCart = selectedUserId
    ? getUserCartWithProducts(selectedUserId)
    : []
  const selectedUserTotal = selectedUserId ? getUserCartTotal(selectedUserId) : 0
  const selectedUser = users.find(u => u.id === selectedUserId)

  return (
    <RequireAdmin>
      <div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Cart Viewer</h1>
          <p className="text-lg mt-2">
            View all users' shopping carts and analyze cart activity
          </p>
        </div>

        {/* Stats Overview */}
        <div className="stats stats-vertical lg:stats-horizontal shadow w-full mb-8">
          <div className="stat">
            <div className="stat-title">Total Carts</div>
            <div className="stat-value">{allUserCarts.length}</div>
            <div className="stat-desc">Active shopping carts</div>
          </div>

          <div className="stat">
            <div className="stat-title">Users with Items</div>
            <div className="stat-value">{usersWithCarts.length}</div>
            <div className="stat-desc">
              Out of {users.length} total users
            </div>
          </div>

          <div className="stat">
            <div className="stat-title">Total Items</div>
            <div className="stat-value">
              {allUserCarts.reduce(
                (sum, uc) => sum + uc.items.reduce((s, item) => s + item.quantity, 0),
                0
              )}
            </div>
            <div className="stat-desc">Across all carts</div>
          </div>

          <div className="stat">
            <div className="stat-title">Potential Revenue</div>
            <div className="stat-value text-success">
              $
              {users
                .reduce((sum, user) => sum + getUserCartTotal(user.id), 0)
                .toFixed(2)}
            </div>
            <div className="stat-desc">If all carts checkout</div>
          </div>
        </div>

        {/* User Selection Dropdown */}
        <div className="card bg-base-200 mb-8">
          <div className="card-body">
            <h2 className="card-title">Select User to View Cart</h2>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Choose a user</span>
              </label>
              <select
                className="select select-bordered w-full max-w-md"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">-- Select a user --</option>
                {users.map((user) => {
                  const cartItemCount = getUserCartWithProducts(user.id).reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )
                  const cartTotal = getUserCartTotal(user.id)
                  return (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                      {cartItemCount > 0 && ` - ${cartItemCount} items ($${cartTotal.toFixed(2)})`}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>
        </div>

        {/* Selected User's Cart */}
        {selectedUserId && selectedUser && (
          <div className="card bg-base-200">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="card-title">
                    {selectedUser.name}'s Cart
                  </h2>
                  <p className="text-sm opacity-70">{selectedUser.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-70">Cart Total</div>
                  <div className="text-3xl font-bold text-success">
                    ${selectedUserTotal.toFixed(2)}
                  </div>
                </div>
              </div>

              {selectedUserCart.length === 0 ? (
                <div className="text-center py-8 opacity-70">
                  <div className="text-4xl mb-2">🛒</div>
                  <p>This user's cart is empty</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedUserCart.map(({ productId, quantity, product }) => {
                        if (!product) return null
                        return (
                          <tr key={productId}>
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="avatar">
                                  <div className="w-12 h-12 rounded">
                                    <img src={product.image} alt={product.name} />
                                  </div>
                                </div>
                                <div>
                                  <div className="font-bold">{product.name}</div>
                                  <div className="text-sm opacity-70">
                                    {product.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="font-semibold">${product.price}</td>
                            <td>
                              <span className="badge badge-lg">{quantity}</span>
                            </td>
                            <td className="font-bold">
                              ${(product.price * quantity).toFixed(2)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th colSpan={3} className="text-right">
                          Total:
                        </th>
                        <th className="text-success text-lg">
                          ${selectedUserTotal.toFixed(2)}
                        </th>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Carts Overview */}
        {!selectedUserId && allUserCarts.length > 0 && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">All Active Carts</h2>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Items</th>
                      <th>Cart Total</th>
                      <th>Last Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUserCarts.map((userCart) => {
                      const user = users.find(u => u.id === userCart.userId)
                      if (!user) return null
                      const total = getUserCartTotal(userCart.userId)
                      const itemCount = userCart.items.reduce(
                        (sum, item) => sum + item.quantity,
                        0
                      )
                      return (
                        <tr key={userCart.userId}>
                          <td>
                            <div>
                              <div className="font-bold">{user.name}</div>
                              <div className="text-sm opacity-70">{user.email}</div>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-lg">{itemCount}</span>
                          </td>
                          <td className="font-bold text-success">
                            ${total.toFixed(2)}
                          </td>
                          <td className="text-sm opacity-70">
                            {new Date(userCart.updatedAt).toLocaleString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => setSelectedUserId(userCart.userId)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAdmin>
  )
}

export const Route = createFileRoute('/admin/carts')({
  component: AdminCartsPage,
})
