/**
 * Search page route with filters and results
 */

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { getCategories, PRODUCT_SEARCH_QUICK_FILTERS, searchProducts } from '@/store/productsStore'
import { addToCart } from '@/store/cartStore'
import { authStore } from '@/store/authStore'

/**
 * URL search parameters schema
 */
type SearchParams = {
  q?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return undefined
  }

  const parsedValue = Number.parseFloat(trimmedValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
}

function hasInvalidSearchParamsInUrl(searchParams: SearchParams): boolean {
  const urlParams = new URLSearchParams(window.location.search)

  const rawQuery = urlParams.get('q')
  if (rawQuery !== null && !rawQuery.trim() && searchParams.q === undefined) {
    return true
  }

  for (const key of ['minPrice', 'maxPrice'] as const) {
    const rawValue = urlParams.get(key)
    if (rawValue !== null && parseOptionalNumber(rawValue) === undefined && searchParams[key] === undefined) {
      return true
    }
  }

  for (const key of ['inStock', 'onSale'] as const) {
    const rawValue = urlParams.get(key)
    if (rawValue !== null && !['true', 'false', '1', '0'].includes(rawValue) && searchParams[key] === undefined) {
      return true
    }
  }

  return false
}

function replaceCleanSearchParamsInUrl(searchParams: SearchParams): void {
  const cleanUrlParams = new URLSearchParams()

  if (searchParams.q) {
    cleanUrlParams.set('q', searchParams.q)
  }

  if (searchParams.minPrice !== undefined) {
    cleanUrlParams.set('minPrice', String(searchParams.minPrice))
  }

  if (searchParams.maxPrice !== undefined) {
    cleanUrlParams.set('maxPrice', String(searchParams.maxPrice))
  }

  if (searchParams.inStock !== undefined) {
    cleanUrlParams.set('inStock', String(searchParams.inStock))
  }

  if (searchParams.onSale !== undefined) {
    cleanUrlParams.set('onSale', String(searchParams.onSale))
  }

  const nextUrl = cleanUrlParams.toString()
    ? `${window.location.pathname}?${cleanUrlParams.toString()}`
    : window.location.pathname

  window.history.replaceState(window.history.state, '', nextUrl)
}

/**
 * Search page component with filters and product results
 */
function SearchPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const auth = useSnapshot(authStore)
  const isAdmin = auth.currentUser?.role === 'admin'
  const categories = getCategories()

  if (hasInvalidSearchParamsInUrl(searchParams)) {
    replaceCleanSearchParamsInUrl(searchParams)
  }

  const [query, setQuery] = useState(searchParams.q || '')
  const [minPrice, setMinPrice] = useState(searchParams.minPrice?.toString() || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.maxPrice?.toString() || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.inStock || false)
  const [onSaleOnly, setOnSaleOnly] = useState(searchParams.onSale || false)

  // Sync form state when URL search params change (e.g., from voice navigation)
  useEffect(() => {
    setQuery(searchParams.q || '')
    setMinPrice(searchParams.minPrice?.toString() || '')
    setMaxPrice(searchParams.maxPrice?.toString() || '')
    setInStockOnly(searchParams.inStock || false)
    setOnSaleOnly(searchParams.onSale || false)
  }, [searchParams.q, searchParams.minPrice, searchParams.maxPrice, searchParams.inStock, searchParams.onSale])

  // Search results based on filters
  const results = searchProducts({
    query: searchParams.q,
    minPrice: searchParams.minPrice,
    maxPrice: searchParams.maxPrice,
    inStock: searchParams.inStock,
    onSale: searchParams.onSale,
  })

  const buildSearchParams = (nextQuery = query): SearchParams => {
    const params: SearchParams = {}
    if (nextQuery) params.q = nextQuery
    const parsedMinPrice = parseOptionalNumber(minPrice)
    const parsedMaxPrice = parseOptionalNumber(maxPrice)
    if (parsedMinPrice !== undefined) params.minPrice = parsedMinPrice
    if (parsedMaxPrice !== undefined) params.maxPrice = parsedMaxPrice
    if (inStockOnly) params.inStock = true
    if (onSaleOnly) params.onSale = true

    return params
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    navigate({ to: '/search', search: buildSearchParams() })
  }

  const handleClearFilters = () => {
    setQuery('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setOnSaleOnly(false)
    navigate({ to: '/search', search: {} })
  }

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

  const handleQuickSearch = (nextQuery: string) => {
    setQuery(nextQuery)
    navigate({ to: '/search', search: buildSearchParams(nextQuery) })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Search Products</h1>
        <p className="text-lg mt-2">
          Find products with advanced filters
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card bg-base-200 mb-8">
        <div className="card-body">
          <div className="mb-5 space-y-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Browse categories</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`btn btn-sm ${query.toLowerCase() === category.toLowerCase() ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => handleQuickSearch(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Popular searches</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRODUCT_SEARCH_QUICK_FILTERS.map((filter) => (
                  <button
                    key={filter.query}
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => handleQuickSearch(filter.query)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={handleSearch}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search Query */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Search</span>
                </label>
                <input
                  type="text"
                  placeholder="Search products, categories, or tags..."
                  className="input input-bordered"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt opacity-70">
                    Try electronics, accessories, storage, charging, usb-c, or ssd
                  </span>
                </label>
              </div>

              {/* Min Price */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Min Price</span>
                </label>
                <input
                  type="number"
                  placeholder="0"
                  className="input input-bordered"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Max Price */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Max Price</span>
                </label>
                <input
                  type="number"
                  placeholder="1000"
                  className="input input-bordered"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* In Stock Only */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                  />
                  <span className="label-text">In Stock Only</span>
                </label>
              </div>

              {/* On Sale Only */}
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-error"
                    checked={onSaleOnly}
                    onChange={(e) => setOnSaleOnly(e.target.checked)}
                  />
                  <span className="label-text font-semibold text-error">On Sale Only</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button type="submit" className="btn btn-primary">
                Search
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold">
          {results.length} {results.length === 1 ? 'Result' : 'Results'}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((product) => (
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

      {results.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-bold mb-2">No products found</h3>
          <p className="opacity-70">Try adjusting your search filters or start with Electronics, Accessories, or Storage.</p>
        </div>
      )}
    </div>
  )
}

export const Route = createFileRoute('/search')({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    // Parse search params - URL params are always strings, so we need to convert them
    const result: SearchParams = {};
    
    if (search.q && typeof search.q === 'string') {
      result.q = search.q;
    }
    
    // Parse numbers from strings
    if (search.minPrice !== undefined && search.minPrice !== null) {
      const minPrice = typeof search.minPrice === 'string' 
        ? parseFloat(search.minPrice) 
        : Number(search.minPrice);
      if (!isNaN(minPrice)) {
        result.minPrice = minPrice;
      }
    }
    
    if (search.maxPrice !== undefined && search.maxPrice !== null) {
      const maxPrice = typeof search.maxPrice === 'string' 
        ? parseFloat(search.maxPrice) 
        : Number(search.maxPrice);
      if (!isNaN(maxPrice)) {
        result.maxPrice = maxPrice;
      }
    }
    
    // Parse boolean from string
    if (search.inStock !== undefined && search.inStock !== null) {
      if (typeof search.inStock === 'string') {
        result.inStock = search.inStock === 'true' || search.inStock === '1';
      } else if (typeof search.inStock === 'boolean') {
        result.inStock = search.inStock;
      }
    }
    
    if (search.onSale !== undefined && search.onSale !== null) {
      if (typeof search.onSale === 'string') {
        result.onSale = search.onSale === 'true' || search.onSale === '1';
      } else if (typeof search.onSale === 'boolean') {
        result.onSale = search.onSale;
      }
    }
    
    return result;
  },
})
