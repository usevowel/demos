import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import productsData from '../../data/auto-parts.json'

/**
 * Product interface matching the JSON structure
 */
interface Product {
  name: string
  price?: string
  images?: string[]
  sku?: string
  category: string
  url: string
}

/**
 * ProductList component displaying auto parts products from JSON data
 */
export function ProductList() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Load products from JSON
    setProducts(productsData.products || [])
    setLoading(false)
  }, [])

  // Filter products based on search query
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.sku && product.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Auto Parts Catalog
        </h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredProducts.length} of {products.length} products
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product, index) => (
          <div
            key={product.sku || `product-${index}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Product Image - Clickable */}
            {product.sku ? (
              <Link
                to="/product/$sku"
                params={{ sku: product.sku }}
                className="aspect-square bg-gray-100 dark:bg-gray-700 relative block cursor-pointer"
              >
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </Link>
            ) : (
              <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                {product.images && product.images.length > 0 ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
            )}

            {/* Product Info */}
            <div className="p-4">
              {product.sku ? (
                <Link
                  to="/product/$sku"
                  params={{ sku: product.sku }}
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block"
                >
                  {product.name}
                </Link>
              ) : (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                  {product.name}
                </h3>
              )}
              <div className="flex items-center justify-between">
                {product.price && (
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {product.price}
                  </span>
                )}
                {product.sku && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    SKU: {product.sku}
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                  {product.category}
                </span>
              </div>
              {product.sku ? (
                <Link
                  to="/product/$sku"
                  params={{ sku: product.sku }}
                  className="mt-3 block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  View Product
                </Link>
              ) : product.url ? (
                <a
                  href={product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  View Product
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No products found matching "{searchQuery}"
          </p>
        </div>
      )}
    </div>
  )
}
