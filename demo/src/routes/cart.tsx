/**
 * Shopping cart page route
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import {
  cartStore,
  getCartWithProducts,
  getCartTotal,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from '@/store/cartStore'
import { authStore } from '@/store/authStore'

/**
 * Shopping cart component showing cart items and checkout
 */
function CartPage() {
  const cart = useSnapshot(cartStore)
  const auth = useSnapshot(authStore)
  const cartItems = getCartWithProducts()
  const total = getCartTotal()
  const isAdmin = auth.currentUser?.role === 'admin'

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    updateCartItemQuantity(productId, quantity)
  }

  const handleRemove = (productId: string) => {
    removeFromCart(productId)
  }

  const handleClearCart = () => {
    clearCart()
  }

  // Not logged in
  if (!auth.isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
        <p className="mb-6 opacity-70">You need to be logged in to view your cart</p>
        <div className="flex gap-2 justify-center">
          <Link to="/signin" className="btn btn-primary">
            Sign In
          </Link>
          <Link to="/signup" className="btn btn-ghost">
            Sign Up
          </Link>
        </div>
      </div>
    )
  }

  // Admin users don't have shopping carts
  if (isAdmin) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👨‍💼</div>
        <h2 className="text-2xl font-bold mb-4">Admin Account</h2>
        <p className="mb-6 opacity-70">
          Administrators don't have shopping carts. 
          <br />
          You can view all users' carts from the admin panel.
        </p>
        <div className="flex gap-2 justify-center">
          <Link to="/admin/carts" className="btn btn-primary">
            View All Carts
          </Link>
          <Link to="/products" className="btn btn-ghost">
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // Empty cart
  if (cartItems.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <p className="mb-6 opacity-70">Add some products to get started!</p>
        <Link to="/products" className="btn btn-primary">
          Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">Shopping Cart</h1>
          <p className="text-lg mt-2">
            {cart.items.length} {cart.items.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleClearCart}>
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map(({ productId, quantity, product }) => {
            if (!product) return null

            return (
              <div key={productId} className="card bg-base-200">
                <div className="card-body">
                  <div className="flex gap-4">
                    <Link to="/product/$id" params={{ id: productId }}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    </Link>

                    <div className="flex-1">
                      <Link
                        to="/product/$id"
                        params={{ id: productId }}
                        className="card-title hover:underline"
                      >
                        {product.name}
                      </Link>
                      <p className="text-sm opacity-70 line-clamp-2">
                        {product.description}
                      </p>
                      <p className="text-xl font-bold mt-2">${product.price}</p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={() => handleRemove(productId)}
                      >
                        ✕
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleUpdateQuantity(productId, quantity - 1)}
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) =>
                            handleUpdateQuantity(productId, parseInt(e.target.value) || 1)
                          }
                          className="input input-sm input-bordered w-16 text-center"
                          min="1"
                        />
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => handleUpdateQuantity(productId, quantity + 1)}
                        >
                          +
                        </button>
                      </div>

                      <p className="text-lg font-bold">
                        ${(product.price * quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card bg-base-200 sticky top-4">
            <div className="card-body">
              <h2 className="card-title">Order Summary</h2>

              <div className="divider"></div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="text-success">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (estimated):</span>
                  <span>${(total * 0.1).toFixed(2)}</span>
                </div>

                <div className="divider"></div>

                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span>${(total * 1.1).toFixed(2)}</span>
                </div>
              </div>

              <button className="btn btn-primary btn-block mt-4">
                Proceed to Checkout
              </button>

              <Link to="/products" className="btn btn-ghost btn-block">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/cart')({
  component: CartPage,
})

