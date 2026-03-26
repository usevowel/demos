/**
 * Individual product detail page route
 */

import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useSnapshot } from 'valtio'
import { productsStore, getProductById } from '@/store/productsStore'
import { addToCart } from '@/store/cartStore'
import { authStore } from '@/store/authStore'

/**
 * Product detail component showing detailed product information
 */
function ProductDetailPage() {
  const { id } = Route.useParams()
  const { products } = useSnapshot(productsStore)
  const auth = useSnapshot(authStore)
  const product = getProductById(id)
  const [quantity, setQuantity] = useState(1)
  const isAdmin = auth.currentUser?.role === 'admin'

  if (!product) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <p className="mb-4">The product you're looking for doesn't exist.</p>
        <Link to="/products" className="btn btn-primary">
          Back to Products
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity)
  }

  return (
    <div>
      <div className="mb-6">
        <Link to="/products" className="btn btn-ghost btn-sm">
          ← Back to Products
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="card bg-base-200">
          <figure className="aspect-square relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.onSale && product.discountPercent && (
              <div className="absolute top-4 right-4">
                <span className="badge badge-error badge-lg text-lg px-4 py-3">
                  {product.discountPercent}% OFF
                </span>
              </div>
            )}
            {product.tags && product.tags.length > 0 && (
              <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 max-w-[70%]">
                {product.tags.map((tag) => (
                  <span key={tag} className="badge badge-primary badge-md text-white">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </figure>
        </div>

        {/* Product Details */}
        <div>
          <div className="badge badge-outline mb-2">{product.category}</div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="rating rating-md">
              {[...Array(5)].map((_, i) => (
                <input
                  key={i}
                  type="radio"
                  className="mask mask-star-2 bg-orange-400"
                  checked={Math.floor(product.rating) === i + 1}
                  readOnly
                />
              ))}
            </div>
            <span className="text-lg">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <p className="text-xl mb-6 opacity-80">{product.description}</p>

          <div className="divider"></div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              {product.onSale && product.originalPrice ? (
                <>
                  <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
                  <span className="text-xl line-through opacity-60">${product.originalPrice.toFixed(2)}</span>
                  <span className="text-sm text-error font-semibold mt-1">Save ${(product.originalPrice - product.price).toFixed(2)}</span>
                </>
              ) : (
                <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
              )}
            </div>
            {product.inStock ? (
              <span className="badge badge-success badge-lg">In Stock</span>
            ) : (
              <span className="badge badge-error badge-lg">Out of Stock</span>
            )}
          </div>

          {product.inStock && auth.isAuthenticated && !isAdmin && (
            <>
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <div className="flex gap-2 items-center">
                  <button
                    className="btn btn-outline"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input input-bordered w-20 text-center"
                    min="1"
                  />
                  <button
                    className="btn btn-outline"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                className="btn btn-primary btn-lg w-full mb-4"
                onClick={handleAddToCart}
              >
                Add to Cart - ${(product.price * quantity).toFixed(2)}
                {product.onSale && product.originalPrice && (
                  <span className="ml-2 text-sm opacity-80 line-through">
                    ${(product.originalPrice * quantity).toFixed(2)}
                  </span>
                )}
              </button>
            </>
          )}
          
          {!auth.isAuthenticated && product.inStock && (
            <div className="alert alert-info mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Please sign in to add items to cart</span>
              <Link to="/signin" className="btn btn-sm btn-primary">Sign In</Link>
            </div>
          )}
          
          {isAdmin && product.inStock && (
            <div className="alert mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <span>Admin accounts cannot purchase items. View user carts from the admin panel.</span>
            </div>
          )}

          <div className="card bg-base-200 mt-6">
            <div className="card-body">
              <h3 className="card-title">Product Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="opacity-70">Product ID:</span>
                  <span className="font-mono">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Category:</span>
                  <span>{product.category}</span>
                </div>
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className="opacity-70">Tags:</span>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <span key={tag} className="badge badge-primary badge-sm text-white">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="opacity-70">Availability:</span>
                  <span>{product.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-70">Rating:</span>
                  <span>{product.rating}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const Route = createFileRoute('/product/$id')({
  component: ProductDetailPage,
})

