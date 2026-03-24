import { createFileRoute, useSearch, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { getProducts, type Product } from '@/data/products'
import { AppHeader, HeaderSpacer } from '@/components/AppHeader'
import { ChevronRight, ChevronDown, Star, Flag, Truck, Package, Heart } from 'lucide-react'
import { vehicleStore, getSelectedVehicle } from '@/store/vehicle'
import { wishlistStore, addToWishlist, removeFromWishlist } from '@/store/wishlist'
import { checkProductFitsVehicle, getVehicleKey } from '@/vowel.client'

/**
 * Category/search results page route
 * Supports category filtering and search query parameters
 */
export const Route = createFileRoute('/category')({
  component: CategoryPage,
  validateSearch: (search: Record<string, unknown>) => ({
    category: (search.category as string) || undefined,
    q: (search.q as string) || undefined,
    page: Number(search.page) || 1,
    minPrice: search.minPrice !== undefined ? Number(search.minPrice) : undefined,
    maxPrice: search.maxPrice !== undefined ? Number(search.maxPrice) : undefined,
    fitsVehicle: search.fitsVehicle !== undefined ? search.fitsVehicle === 'true' || search.fitsVehicle === true : undefined,
  }),
})

/**
 * Main category/search results page component
 * Displays filtered products with sidebar filters, product grid, and pagination
 */
function CategoryPage() {
  const { category, q, page = 1, minPrice, maxPrice, fitsVehicle } = useSearch({ from: '/category' })
  const navigate = useNavigate()
  const vehicleState = useSnapshot(vehicleStore)
  // Get selected vehicle reactively - will update when vehicleState.selectedVehicleId changes
  const selectedVehicle = useMemo(() => {
    if (vehicleState.selectedVehicleId === null) return null
    return vehicleState.vehicles[vehicleState.selectedVehicleId] || null
  }, [vehicleState.selectedVehicleId, vehicleState.vehicles])
  
  // Filter states
  // Use URL param fitsVehicle if provided, otherwise default to true
  const [searchWithVehicle, setSearchWithVehicle] = useState(fitsVehicle !== undefined ? fitsVehicle : true)
  
  // Sync searchWithVehicle with URL param when it changes
  useEffect(() => {
    if (fitsVehicle !== undefined) {
      setSearchWithVehicle(fitsVehicle)
    }
  }, [fitsVehicle])
  const [inStockAtStore, setInStockAtStore] = useState(false)
  
  // Reset to page 1 when vehicle changes (since results count may change)
  useEffect(() => {
    if (page > 1 && searchWithVehicle && vehicleState.selectedVehicleId !== null) {
      navigate({
        to: '/category',
        search: { category, q, page: 1, minPrice, maxPrice, fitsVehicle },
        replace: true,
      })
    }
  }, [vehicleState.selectedVehicleId, searchWithVehicle, navigate, category, q, page, minPrice, maxPrice, fitsVehicle]) // Reset page when vehicle changes
  const [shipToHome, setShipToHome] = useState(false)
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [selectedPriceRanges, setSelectedPriceRanges] = useState<string[]>([])
  const [selectedRatings, setSelectedRatings] = useState<number[]>([])
  const [sortBy, setSortBy] = useState('best-match')

  const allProducts = getProducts()

  // Filter products based on category/search query
  const filteredProducts = useMemo(() => {
    let products = allProducts

    // Filter by category
    if (category) {
      products = products.filter(p => 
        p.category.toLowerCase() === category.toLowerCase() ||
        p.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Filter by search query
    if (q) {
      const query = q.toLowerCase()
      products = products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
      )
    }

    // Filter by vehicle fit if searchWithVehicle is enabled and a vehicle is selected
    // Also respect fitsVehicle URL param if provided
    const shouldFilterByVehicle = fitsVehicle !== undefined ? fitsVehicle : searchWithVehicle
    if (shouldFilterByVehicle && selectedVehicle) {
      products = products.filter(p => checkProductFitsVehicle(p, selectedVehicle))
    } else if (fitsVehicle === false && selectedVehicle) {
      // Explicitly filter out products that fit when fitsVehicle is false
      products = products.filter(p => !checkProductFitsVehicle(p, selectedVehicle))
    }

    // Apply price filter from URL params (takes precedence over sidebar filters)
    if (minPrice !== undefined || maxPrice !== undefined) {
      products = products.filter(p => {
        const price = parseFloat(p.price?.replace('$', '') || '0')
        if (minPrice !== undefined && price < minPrice) return false
        if (maxPrice !== undefined && price > maxPrice) return false
        return true
      })
    } else if (selectedPriceRanges.length > 0) {
      // Fall back to sidebar price range filters if URL params not provided
      products = products.filter(p => {
        const price = parseFloat(p.price?.replace('$', '') || '0')
        return selectedPriceRanges.some(range => {
          if (range === '10-24.99') return price >= 10 && price < 25
          if (range === '25-49.99') return price >= 25 && price < 50
          if (range === '50-99.99') return price >= 50 && price < 100
          if (range === '100-up') return price >= 100
          return false
        })
      })
    }

    // Apply additional filters
    if (selectedBrands.length > 0) {
      products = products.filter(p => {
        const brand = extractBrand(p.name)
        return selectedBrands.includes(brand)
      })
    }

    // Filter by ratings
    if (selectedRatings.length > 0) {
      products = products.filter(p => {
        // Generate a consistent rating based on product SKU/name for filtering
        // This ensures the same product always has the same rating
        const ratingSeed = p.sku || p.name
        const hash = ratingSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        const productRating = (hash % 5) + 1 // Rating between 1-5
        
        // Check if product rating matches any selected rating
        return selectedRatings.includes(productRating)
      })
    }

    // Sort products
    if (sortBy === 'price-low') {
      products = [...products].sort((a, b) => {
        const priceA = parseFloat(a.price?.replace('$', '') || '0')
        const priceB = parseFloat(b.price?.replace('$', '') || '0')
        return priceA - priceB
      })
    } else if (sortBy === 'price-high') {
      products = [...products].sort((a, b) => {
        const priceA = parseFloat(a.price?.replace('$', '') || '0')
        const priceB = parseFloat(b.price?.replace('$', '') || '0')
        return priceB - priceA
      })
    } else if (sortBy === 'name') {
      products = [...products].sort((a, b) => a.name.localeCompare(b.name))
    }

    return products
  }, [allProducts, category, q, searchWithVehicle, fitsVehicle, vehicleState.selectedVehicleId, selectedVehicle, selectedBrands, selectedPriceRanges, selectedRatings, sortBy, minPrice, maxPrice])

  // Pagination
  const itemsPerPage = 12
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const currentPage = Math.min(page, totalPages) || 1
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage)

  // Extract unique brands from products
  const brands = useMemo(() => {
    const brandSet = new Set<string>()
    filteredProducts.forEach(p => {
      const brand = extractBrand(p.name)
      if (brand) brandSet.add(brand)
    })
    return Array.from(brandSet).sort()
  }, [filteredProducts])

  // Count products by brand
  const brandCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredProducts.forEach(p => {
      const brand = extractBrand(p.name)
      if (brand) {
        counts[brand] = (counts[brand] || 0) + 1
      }
    })
    return counts
  }, [filteredProducts])

  // Count products by price range
  const priceRangeCounts = useMemo(() => {
    const ranges = {
      '10-24.99': 0,
      '25-49.99': 0,
      '50-99.99': 0,
      '100-up': 0,
    }
    filteredProducts.forEach(p => {
      const price = parseFloat(p.price?.replace('$', '') || '0')
      if (price >= 10 && price < 25) ranges['10-24.99']++
      else if (price >= 25 && price < 50) ranges['25-49.99']++
      else if (price >= 50 && price < 100) ranges['50-99.99']++
      else if (price >= 100) ranges['100-up']++
    })
    return ranges
  }, [filteredProducts])

  // Get category name for display
  const categoryName = category 
    ? category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ')
    : q 
    ? `Search Results for "${q}"`
    : 'All Products'

  // Category description
  const categoryDescription = category === 'batteries' 
    ? 'Car batteries are essential for starting your vehicle and powering electrical systems. Choose from top brands like OPTIMA and DieHard for reliable performance and long-lasting power.'
    : 'Browse our selection of quality auto parts and accessories.'

  const handleBrandToggle = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    )
  }

  const handlePriceRangeToggle = (range: string) => {
    setSelectedPriceRanges(prev =>
      prev.includes(range) ? prev.filter(r => r !== range) : [...prev, range]
    )
  }

  const handleRatingToggle = (rating: number) => {
    setSelectedRatings(prev =>
      prev.includes(rating) ? prev.filter(r => r !== rating) : [...prev, rating]
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showLogo={true} />
      <HeaderSpacer />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link to="/" search={{ l: undefined }} className="hover:text-yellow-500">Home</Link>
            <ChevronRight className="w-4 h-4" />
            {category && (
              <>
                <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
            <span className="text-gray-900 font-medium">{categoryName}</span>
          </nav>
        </div>
      </div>

      {/* Category Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{categoryName}</h1>
          {categoryDescription && (
            <p className="text-gray-600 mb-2">
              {categoryDescription}
              {category === 'batteries' && (
                <a href="#" className="text-blue-600 hover:underline ml-1">Read More</a>
              )}
            </p>
          )}
          <p className="text-lg font-semibold text-gray-900">
            {filteredProducts.length} Results
            {searchWithVehicle && selectedVehicle && (
              <span className="text-sm font-normal text-gray-600 ml-2">
                (filtered for {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="space-y-6">
              {/* Search with Vehicle Toggle */}
              <FilterSection title="SEARCH WITH VEHICLE">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">On / Off</span>
                  <button
                    onClick={() => setSearchWithVehicle(!searchWithVehicle)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      searchWithVehicle ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        searchWithVehicle ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </FilterSection>

              {/* Availability */}
              <FilterSection title="AVAILABILITY">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockAtStore}
                    onChange={(e) => setInStockAtStore(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">In Stock at My Store</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shipToHome}
                    onChange={(e) => setShipToHome(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">Ship to Home</span>
                </label>
              </FilterSection>

              {/* Show Products */}
              <FilterSection title="SHOW PRODUCTS">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    readOnly
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    General Use Parts & Products ({filteredProducts.length})
                  </span>
                </label>
              </FilterSection>

              {/* Category */}
              {category && (
                <FilterSection title="CATEGORY">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      readOnly
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {category.replace(/_/g, ' ')} ({filteredProducts.length})
                    </span>
                  </label>
                </FilterSection>
              )}

              {/* Brand */}
              {brands.length > 0 && (
                <FilterSection title="BRAND">
                  <div className="space-y-2">
                    {brands.slice(0, 10).map(brand => (
                      <label key={brand} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => handleBrandToggle(brand)}
                          className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          {brand} ({brandCounts[brand] || 0})
                        </span>
                      </label>
                    ))}
                    {brands.length > 10 && (
                      <button className="text-sm text-blue-600 hover:underline">
                        Show More
                      </button>
                    )}
                  </div>
                </FilterSection>
              )}

              {/* Price */}
              <FilterSection title="PRICE">
                <div className="space-y-2">
                  {[
                    { range: '10-24.99', label: '$10-$24.99' },
                    { range: '25-49.99', label: '$25-$49.99' },
                    { range: '50-99.99', label: '$50-$99.99' },
                    { range: '100-up', label: '$100 and up' },
                  ].map(({ range, label }) => (
                    <label key={range} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPriceRanges.includes(range)}
                        onChange={() => handlePriceRangeToggle(range)}
                        className="w-4 h-4 rounded"
                      />
                      <span className="text-sm text-gray-700">
                        {label} ({priceRangeCounts[range as keyof typeof priceRangeCounts] || 0})
                      </span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Product Ratings */}
              <FilterSection title="PRODUCT RATINGS">
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <label key={rating} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedRatings.includes(rating)}
                        onChange={() => handleRatingToggle(rating)}
                        className="w-4 h-4 rounded"
                      />
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-700">
                        {rating} {rating === 1 ? 'star' : 'stars'} ({Math.floor(Math.random() * 5)})
                      </span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      Not Yet Rated ({Math.floor(filteredProducts.length * 0.9)})
                    </span>
                  </label>
                </div>
              </FilterSection>

              {/* Related Parts */}
              <FilterSection title="RELATED PARTS">
                <div className="space-y-1">
                  {['Battery Hold Down', 'Battery Tray Retainer', 'Battery Terminal', 'Battery Cable'].map(part => (
                    <a
                      key={part}
                      href="#"
                      className="block text-sm text-blue-600 hover:underline"
                    >
                      {part}
                    </a>
                  ))}
                  <button className="text-sm text-blue-600 hover:underline">
                    Show More
                  </button>
                </div>
              </FilterSection>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            {/* Promotional Banner */}
            {category === 'batteries' && (
              <div className="bg-blue-600 text-white p-6 rounded-lg mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-1">FREE BATTERY TESTING & INSTALLATION*</h3>
                  <p className="text-sm">Get your battery tested and installed by our experts</p>
                </div>
                <button className="bg-white text-blue-600 px-6 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
                  FIND A STORE
                </button>
              </div>
            )}

            {/* Sort Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="best-match">Best Match</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8 items-stretch">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.sku || product.name} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                category={category}
                q={q}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Filter section component for sidebar
 */
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="border-b border-gray-200 pb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full mb-3"
      >
        <h3 className="text-sm font-bold text-gray-900 uppercase">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-gray-600 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  )
}

/**
 * Product card component with detailed information
 */
function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || ''
  const regularPrice = product.price || '$0.00'
  const salePrice = product.sale_discount
    ? `$${(parseFloat(regularPrice.replace('$', '')) * (1 - product.sale_discount)).toFixed(2)}`
    : null
  
  const displayPrice = salePrice || regularPrice
  const hasDiscount = !!salePrice

  // Mock data for fulfillment options
  const storePickupAvailable = Math.random() > 0.3
  const sameDayDeliveryAvailable = Math.random() > 0.5
  const homeDeliveryAvailable = true

  // Generate consistent rating based on product SKU/name (same logic as filter)
  const ratingSeed = product.sku || product.name
  const hash = ratingSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = (hash % 5) + 1 // Rating between 1-5
  const reviewCount = Math.floor(Math.random() * 100)

  // Wishlist functionality
  const wishlist = useSnapshot(wishlistStore)
  const selectedVehicle = getSelectedVehicle()

  // Check if item is in wishlist for selected vehicle
  const isInWishlist = useMemo(() => {
    if (!selectedVehicle || !product.sku) return false
    
    return wishlist.wishlistItems.some((item) => {
      if (item.sku !== product.sku) return false
      
      const itemVehicle = typeof item.vehicle === 'string'
        ? vehicleStore.vehicles.find(v => getVehicleKey(v) === item.vehicle)
        : item.vehicle
      
      if (!itemVehicle) return false
      
      return (
        itemVehicle.year === selectedVehicle.year &&
        itemVehicle.make === selectedVehicle.make &&
        itemVehicle.model === selectedVehicle.model
      )
    })
  }, [wishlist.wishlistItems, selectedVehicle, product.sku])

  // Toggle wishlist item
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedVehicle || !product.sku) return

    if (isInWishlist) {
      // Remove from wishlist
      const itemIndex = wishlist.wishlistItems.findIndex((item) => {
        if (item.sku !== product.sku) return false
        
        const itemVehicle = typeof item.vehicle === 'string'
          ? vehicleStore.vehicles.find(v => getVehicleKey(v) === item.vehicle)
          : item.vehicle
        
        if (!itemVehicle) return false
        
        return (
          itemVehicle.year === selectedVehicle.year &&
          itemVehicle.make === selectedVehicle.make &&
          itemVehicle.model === selectedVehicle.model
        )
      })
      
      if (itemIndex >= 0) {
        removeFromWishlist(itemIndex)
      }
    } else {
      // Add to wishlist
      addToWishlist({
        vehicle: selectedVehicle,
        itemName: product.name,
        sku: product.sku,
        dateAdded: new Date().toISOString(),
      })
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full">
      {/* Product Image - Clickable */}
      <Link
        to="/product/$sku"
        params={{ sku: product.sku! }}
        className="w-full h-48 bg-white flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              // Hide image and show placeholder on error
              const target = e.currentTarget
              target.style.display = 'none'
              const parent = target.parentElement
              if (parent && !parent.querySelector('.image-placeholder')) {
                const placeholder = document.createElement('div')
                placeholder.className = 'image-placeholder flex flex-col items-center justify-center text-gray-400 p-4'
                placeholder.innerHTML = `
                  <svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span class="text-xs text-center">No Image Available</span>
                `
                parent.appendChild(placeholder)
              }
            }}
          />
        ) : (
          <div className="image-placeholder flex flex-col items-center justify-center text-gray-400 p-4">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="text-xs text-center">No Image Available</span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {/* Price */}
        <div className="mb-2">
          {hasDiscount ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-gray-900">{displayPrice}</span>
              <span className="text-sm text-gray-500 line-through">{regularPrice}</span>
            </div>
          ) : (
            <span className="text-2xl font-bold text-gray-900">{displayPrice}</span>
          )}
          {product.category === 'batteries' && (
            <div className="text-sm text-gray-600 mt-1">
              + $10.00 Refundable Core
            </div>
          )}
        </div>

        {/* Product Name - Clickable */}
        <Link
          to="/product/$sku"
          params={{ sku: product.sku! }}
          className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] hover:text-yellow-500 transition-colors"
        >
          {product.name}
        </Link>

        {/* Part Number with Wishlist Button */}
        {product.sku && (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs text-gray-600">Part # {product.sku}</p>
            {selectedVehicle && (
              <button
                onClick={toggleWishlist}
                className={`flex-shrink-0 transition-colors ${
                  isInWishlist
                    ? 'text-red-500 hover:text-red-600'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-4 h-4 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Discount Status */}
        {hasDiscount && (
          <p className="text-xs text-gray-600 mb-2">Excluded from discounts</p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mb-3">
          {reviewCount > 0 ? (
            <>
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">({reviewCount} reviews)</span>
            </>
          ) : (
            <span className="text-xs text-gray-600">No Reviews</span>
          )}
        </div>

        {/* Warranty */}
        {product.name.toLowerCase().includes('warranty') && (
          <p className="text-xs text-gray-600 mb-3">
            {product.name.includes('4 Year') ? '4 Yr Replacement If Defective' :
             product.name.includes('3 Year') ? '3 Yr Replacement If Defective' :
             product.name.includes('1 Year') ? '1 Yr Replacement If Defective' :
             '90 Day Replacement If Defective'}
          </p>
        )}

        {/* Fulfillment Options */}
        <div className="border-t border-gray-200 pt-3 mb-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">
            How Would You Like To Get This Item?
          </h4>
          
          {/* Store Pickup */}
          <div className="flex items-start gap-2 mb-2">
            <Flag className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">Store Pickup</div>
              {storePickupAvailable ? (
                <>
                  <div className="text-xs text-green-600">Ready in 30 mins - Free</div>
                  <div className="text-xs text-gray-600">2350 3rd St S Jacksonville, FL 32250</div>
                  <button className="text-xs text-blue-600 hover:underline">Change Store</button>
                </>
              ) : (
                <div className="text-xs text-red-600">Out of Stock</div>
              )}
            </div>
          </div>

          {/* Same Day Home Delivery */}
          <div className="flex items-start gap-2 mb-2">
            <Truck className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">Same Day Home Delivery</div>
              {sameDayDeliveryAvailable ? (
                <>
                  <div className="text-xs text-gray-600">$8.99 • Order by 8pm</div>
                  <div className="text-xs text-gray-600">ZIP Code: 32250</div>
                  <button className="text-xs text-blue-600 hover:underline">Change</button>
                </>
              ) : (
                <div className="text-xs text-gray-600">Not Available in 32250</div>
              )}
            </div>
          </div>

          {/* Home Delivery */}
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-900">
                Home Delivery - Free over $35
              </div>
              {homeDeliveryAvailable ? (
                <div className="text-xs text-gray-600">Standard Delivery Available</div>
              ) : (
                <div className="text-xs text-gray-600">Not available for this item</div>
              )}
            </div>
          </div>
        </div>

        {/* Add to Cart Button - Pinned to bottom */}
        <Link
          to="/product/$sku"
          params={{ sku: product.sku! }}
          className="w-full bg-yellow-500 text-gray-900 py-2.5 rounded font-semibold hover:bg-yellow-400 transition-colors mt-auto text-center block"
        >
          VIEW DETAILS
        </Link>
      </div>
    </div>
  )
}

/**
 * Pagination component
 */
function Pagination({
  currentPage,
  totalPages,
  category,
  q,
}: {
  currentPage: number
  totalPages: number
  category?: string
  q?: string
}) {
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    params.set('page', page.toString())
    return `/category?${params.toString()}`
  }

  const pages = []
  const maxVisible = 7
  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {currentPage > 1 && (
        <Link
          to={getPageUrl(currentPage - 1)}
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-colors"
        >
          Previous
        </Link>
      )}

      {startPage > 1 && (
        <>
          <Link
            to={getPageUrl(1)}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            1
          </Link>
          {startPage > 2 && <span className="px-2 text-gray-800">...</span>}
        </>
      )}

      {pages.map(page => (
        <Link
          key={page}
          to={getPageUrl(page)}
          className={`px-3 py-2 border rounded text-sm transition-colors ${
            page === currentPage
              ? 'bg-yellow-500 text-gray-900 border-yellow-500 font-semibold'
              : 'border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400'
          }`}
        >
          {page}
        </Link>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span className="px-2 text-gray-800">...</span>}
          <Link
            to={getPageUrl(totalPages)}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-colors"
          >
            {totalPages}
          </Link>
        </>
      )}

      {currentPage < totalPages && (
        <Link
          to={getPageUrl(currentPage + 1)}
          className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 hover:bg-gray-100 hover:border-gray-400 transition-colors"
        >
          Next
        </Link>
      )}
    </div>
  )
}

/**
 * Extract brand name from product name
 */
function extractBrand(name: string): string {
  const brandPatterns = [
    'DieHard',
    'Diehard',
    'Carquest',
    'OPTIMA',
    'Optima',
    'Braille',
    'ARP',
    'Mobil',
    'FRAM',
    'Bosch',
    'Duralast',
  ]

  for (const brand of brandPatterns) {
    if (name.includes(brand)) {
      return brand === 'Diehard' ? 'DieHard' : brand
    }
  }

  // Default to first word if no brand found
  return name.split(' ')[0]
}
