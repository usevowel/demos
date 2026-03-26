/**
 * Admin Product Management page with CRUD operations (Admin Only)
 */

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import {
  getCategories,
  PRODUCT_SEARCH_QUICK_FILTERS,
  productsStore,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
} from '@/store/productsStore'
import { RequireAdmin } from '@/lib/auth'
import type { Product } from '@/store/types'

interface SearchParams {
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
 * Product form component for create/edit
 */
function ProductForm({
  product,
  onSave,
  onCancel,
}: {
  product?: Product
  onSave: (product: Omit<Product, 'id'>) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>(
    product || {
      name: '',
      description: '',
      price: 0,
      category: '',
      image: '',
      inStock: true,
      rating: 0,
      reviews: 0,
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Product Name *</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Category *</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Price *</span>
          </label>
          <input
            type="number"
            step="0.01"
            className="input input-bordered"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
            required
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Rating (0-5)</span>
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="input input-bordered"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
          />
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Reviews Count</span>
          </label>
          <input
            type="number"
            className="input input-bordered"
            value={formData.reviews}
            onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={formData.inStock}
              onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
            />
            <span className="label-text">In Stock</span>
          </label>
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Image URL *</span>
        </label>
        <input
          type="url"
          className="input input-bordered"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Description *</span>
        </label>
        <textarea
          className="textarea textarea-bordered h-24"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {product ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}

/**
 * Admin Product Management page component
 */
function AdminProductsPage() {
  const navigate = useNavigate()
  const searchParams = Route.useSearch()
  const { products } = useSnapshot(productsStore)
  const categories = getCategories()
  const [isCreating, setIsCreating] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  if (hasInvalidSearchParamsInUrl(searchParams)) {
    replaceCleanSearchParamsInUrl(searchParams)
  }
  
  // Search/filter state
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

  // Filter products based on search params
  const filteredProducts = searchProducts({
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

  const handleCreate = (productData: Omit<Product, 'id'>) => {
    createProduct(productData)
    setIsCreating(false)
  }

  const handleUpdate = (productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
      setEditingProduct(null)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    navigate({ to: '/admin/products', search: buildSearchParams() })
  }

  const handleClearFilters = () => {
    setQuery('')
    setMinPrice('')
    setMaxPrice('')
    setInStockOnly(false)
    setOnSaleOnly(false)
    navigate({ to: '/admin/products', search: {} })
  }

  const handleQuickSearch = (nextQuery: string) => {
    setQuery(nextQuery)
    navigate({ to: '/admin/products', search: buildSearchParams(nextQuery) })
  }

  return (
    <RequireAdmin>
      <div>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Product Management</h1>
            <p className="text-lg mt-2">
              Create, edit, and manage products ({filteredProducts.length} of {products.length} shown)
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreating(true)}
          >
            + Add Product
          </button>
        </div>

        {/* Search and Filter Form */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body">
            <div className="mb-5 space-y-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Category shortcuts</p>
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
                <p className="text-sm font-semibold uppercase tracking-wide opacity-70">Popular shortcuts</p>
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

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Fulltext Search */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Search Products</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name, description, category, or tags..."
                    className="input input-bordered"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <label className="label">
                    <span className="label-text-alt opacity-70">
                      Terms like charging, usb-c, and ssd also work
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
                    step="0.01"
                    placeholder="0.00"
                    className="input input-bordered"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>

                {/* Max Price */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Max Price</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="9999.99"
                    className="input input-bordered"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                {/* Filters Row */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Filters</span>
                  </label>
                  <div className="flex gap-2">
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                      />
                      <span className="label-text text-sm">In Stock</span>
                    </label>
                    <label className="label cursor-pointer justify-start gap-2">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={onSaleOnly}
                        onChange={(e) => setOnSaleOnly(e.target.checked)}
                      />
                      <span className="label-text text-sm">On Sale</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={handleClearFilters}
                >
                  Clear Filters
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Create/Edit Form Modal */}
        {(isCreating || editingProduct) && (
          <div className="card bg-base-200 mb-8">
            <div className="card-body">
              <h2 className="card-title">
                {isCreating ? 'Create New Product' : 'Edit Product'}
              </h2>
              <ProductForm
                product={editingProduct || undefined}
                onSave={isCreating ? handleCreate : handleUpdate}
                onCancel={() => {
                  setIsCreating(false)
                  setEditingProduct(null)
                }}
              />
            </div>
          </div>
        )}

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Tags</th>
                <th>Price</th>
                <th>Sale</th>
                <th>Stock</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="avatar">
                      <div className="w-12 h-12 rounded">
                        <img src={product.image} alt={product.name} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="font-bold">{product.name}</div>
                    <div className="text-sm opacity-70 line-clamp-1">
                      {product.description}
                    </div>
                  </td>
                  <td>
                    {product.tags && product.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag) => (
                          <span key={tag} className="badge badge-primary badge-sm text-white">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm opacity-50">No tags</span>
                    )}
                  </td>
                  <td className="font-bold">${product.price}</td>
                  <td>
                    {product.onSale && product.discountPercent ? (
                      <span className="badge badge-warning text-xs">
                        {product.discountPercent}%
                      </span>
                    ) : (
                      <span className="text-xs opacity-50">—</span>
                    )}
                  </td>
                  <td>
                    {product.inStock ? (
                      <span className="badge badge-success text-xs whitespace-nowrap">In Stock</span>
                    ) : (
                      <span className="badge badge-error text-xs whitespace-nowrap">Out</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span>⭐ {product.rating}</span>
                      <span className="text-xs opacity-70">({product.reviews})</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setEditingProduct({
                          ...product,
                          tags: product.tags ? [...product.tags] : undefined
                        })}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error"
                        onClick={() => handleDelete(product.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RequireAdmin>
  )
}

export const Route = createFileRoute('/admin/products')({
  component: AdminProductsPage,
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
