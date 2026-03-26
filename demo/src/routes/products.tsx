/**
 * Products catalog page route
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { productsStore } from '@/store/productsStore'
import { addToCart } from '@/store/cartStore'
import { authStore } from '@/store/authStore'

/**
 * Products catalog component showing all available products
 */
function ProductsPage() {
  const navigate = useNavigate()
  const { products } = useSnapshot(productsStore)
  const auth = useSnapshot(authStore)
  const isAdmin = auth.currentUser?.role === 'admin'

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addToCart(productId, 1)
  }

  const handleSignInClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    navigate({ to: '/signin' })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Products</h1>
        <p className="text-lg mt-2">
          Browse our complete product catalog
        </p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            to="/product/$id"
            params={{ id: product.id }}
            className="card bg-base-200 hover:shadow-xl transition-shadow"
          >
            <figure className="aspect-square relative">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.onSale && product.discountPercent && (
                <div className="absolute top-2 right-2">
                  <span className="badge badge-error badge-lg">
                    {product.discountPercent}% OFF
                  </span>
                </div>
              )}
              {product.tags && product.tags.length > 0 && (
                <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[70%]">
                  {product.tags.map((tag) => (
                    <span key={tag} className="badge badge-primary badge-sm text-white">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </figure>
            <div className="card-body">
              <h3 className="card-title text-lg">{product.name}</h3>
              <p className="text-sm opacity-70 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center gap-2 my-2">
                <div className="rating rating-sm">
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
                <span className="text-sm opacity-70">({product.reviews})</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  {product.onSale && product.originalPrice ? (
                    <>
                      <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                      <span className="text-sm line-through opacity-60">${product.originalPrice.toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                  )}
                </div>
                {!product.inStock && (
                  <span className="badge badge-error">Out of Stock</span>
                )}
              </div>

              <div className="card-actions justify-end mt-2">
                {auth.isAuthenticated && !isAdmin ? (
                  <button
                    className="btn btn-primary btn-sm w-full"
                    onClick={(e) => handleAddToCart(product.id, e)}
                    disabled={!product.inStock}
                  >
                    {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                  </button>
                ) : !auth.isAuthenticated ? (
                  <button
                    className="btn btn-ghost btn-sm w-full"
                    onClick={handleSignInClick}
                  >
                    Sign in to purchase
                  </button>
                ) : (
                  <div className="badge badge-ghost w-full">Admin View</div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

export const Route = createFileRoute('/products')({
  component: ProductsPage,
})

