import { createFileRoute, useSearch, Link, useNavigate } from '@tanstack/react-router'
import { useMemo } from 'react'
import { useVowel } from '@vowel.to/client/react'
import { getProducts, type Product } from '@/data/products'
import { AppHeader, HeaderSpacer } from '@/components/AppHeader'
import { addToCart, openCartOverlay } from '@/store/cart'
import { useFeatureFlagEnabled } from '@/hooks/useFeatureFlagEnabled'

/**
 * Home page route with hero banner, categories, and product listings
 * Styled with dark header, yellow/orange accents, and responsive design
 */
export const Route = createFileRoute('/')({
  component: LandingPage,
  validateSearch: (search: Record<string, unknown>) => ({
    l: (search.l as string) || undefined,
  }),
})

/**
 * Main landing page component
 */
function LandingPage() {
  const { l } = useSearch({ from: '/' })
  const navigate = useNavigate()
  const { state, toggleSession } = useVowel()
  const isAgentActive = state.isConnected
  
  // Logo should only show if ?l=1 is NOT present (inverted logic from Header component)
  const showLogo = l !== '1'
  const products = getProducts()

  // Check NO_LOGOS feature flag from PostHog
  const noLogos = useFeatureFlagEnabled('NO_LOGOS')
  const brandName = noLogos ? 'Vowel' : 'Advance'
  const voiceName = noLogos ? 'VowelVoice' : 'AdvanceVoice'

  /**
   * Handle AdvanceVoice button click - start/stop the agent
   */
  const handleAdvanceVoiceClick = () => {
    toggleSession()
  }

  // Get products by category for different sections
  const batteries = useMemo(() => products.filter(p => p.category === 'batteries' && p.images && p.images.length > 0).slice(0, 6), [products])
  const brakePads = useMemo(() => products.filter(p => p.category === 'brakepads' && p.images && p.images.length > 0).slice(0, 6), [products])
  const rotors = useMemo(() => products.filter(p => p.category === 'rotors' && p.images && p.images.length > 0).slice(0, 6), [products])
  const oil = useMemo(() => products.filter(p => p.category === 'oil' && p.images && p.images.length > 0).slice(0, 6), [products])
  const oilFilters = useMemo(() => products.filter(p => p.category === 'oil_filters' && p.images && p.images.length > 0).slice(0, 6), [products])
  const clearance = useMemo(() => products.filter(p => p.category === 'clearance' && p.images && p.images.length > 0).slice(0, 4), [products])

  // Featured product for hero banner (first oil product with image)
  const featuredProduct = useMemo(() => {
    const oilProducts = products.filter(p => p.category === 'oil' && p.images && p.images.length > 0)
    return oilProducts[0] || products.find(p => p.images && p.images.length > 0) || products[0]
  }, [products])

  // Categories for the top categories section - ensure each has a product with image
  // For Oil Change Bundles, use an oil-related product image (oil filters are part of oil change bundles)
  const oilChangeBundlesProduct = useMemo(() => {
    // First try to find an oil product with images
    const allOilProducts = products.filter(p => p.category === 'oil' && p.images && p.images.length > 0)
    if (allOilProducts.length > 0) {
      return allOilProducts[0]
    }
    // Fallback to oil filter (part of oil change bundles)
    const oilFilterProducts = products.filter(p => p.category === 'oil_filters' && p.images && p.images.length > 0)
    if (oilFilterProducts.length > 0) {
      return oilFilterProducts[0]
    }
    // Last resort: any product with images
    return products.find(p => p.images && p.images.length > 0) || null
  }, [products])

  /**
   * Map category display names to category slugs for URL navigation
   */
  const getCategorySlug = (categoryName: string): string => {
    const categoryMap: Record<string, string> = {
      'Batteries': 'batteries',
      'Brake Pads & Shoes': 'brakepads',
      'Rotors & Drums': 'rotors',
      'Oil Change Bundles': 'oil',
      'Oil Filters': 'oil_filters',
      'Save Up to 90%': 'clearance',
    }
    return categoryMap[categoryName] || categoryName.toLowerCase().replace(/\s+/g, '_')
  }

  const categories = [
    { name: 'Batteries', products: batteries, icon: '🔋' },
    { name: 'Brake Pads & Shoes', products: brakePads, icon: '🛑' },
    { name: 'Rotors & Drums', products: rotors, icon: '⚙️' },
    { name: 'Oil Change Bundles', products: oil, icon: '🛢️', displayProduct: oilChangeBundlesProduct },
    { name: 'Oil Filters', products: oilFilters, icon: '🔧' },
    { name: 'Save Up to 90%', products: clearance, icon: '💰', badge: 'CLEARANCE' },
  ]

  // Mix products from different categories for carousels
  const recentlyViewedProducts = useMemo(() => {
    const mixed: Product[] = []
    const categories = ['batteries', 'brakepads', 'rotors', 'oil', 'oil_filters']
    let categoryIndex = 0
    let productIndex = 0
    
    while (mixed.length < 8) {
      const category = categories[categoryIndex % categories.length]
      const categoryProducts = products.filter(
        p => p.category === category && p.images && p.images.length > 0
      )
      
      if (categoryProducts[productIndex]) {
        mixed.push(categoryProducts[productIndex])
      }
      
      categoryIndex++
      if (categoryIndex % categories.length === 0) {
        productIndex++
      }
    }
    
    return mixed.slice(0, 8)
  }, [products])

  const topSellersProducts = useMemo(() => {
    const mixed: Product[] = []
    const categories = ['batteries', 'brakepads', 'rotors', 'oil', 'oil_filters']
    let categoryIndex = 0
    let productIndex = 1 // Start from index 1 to get different products than recently viewed
    
    while (mixed.length < 8) {
      const category = categories[categoryIndex % categories.length]
      const categoryProducts = products.filter(
        p => p.category === category && p.images && p.images.length > 0
      )
      
      if (categoryProducts[productIndex]) {
        mixed.push(categoryProducts[productIndex])
      }
      
      categoryIndex++
      if (categoryIndex % categories.length === 0) {
        productIndex++
      }
    }
    
    return mixed.slice(0, 8)
  }, [products])

  const mayWeSuggestProducts = useMemo(() => {
    const mixed: Product[] = []
    const categories = ['batteries', 'brakepads', 'rotors', 'oil', 'oil_filters']
    let categoryIndex = 0
    let productIndex = 2 // Start from index 2 to get different products
    
    while (mixed.length < 8) {
      const category = categories[categoryIndex % categories.length]
      const categoryProducts = products.filter(
        p => p.category === category && p.images && p.images.length > 0
      )
      
      if (categoryProducts[productIndex]) {
        mixed.push(categoryProducts[productIndex])
      }
      
      categoryIndex++
      if (categoryIndex % categories.length === 0) {
        productIndex++
      }
    }
    
    return mixed.slice(0, 8)
  }, [products])

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showLogo={showLogo} />
      <HeaderSpacer />

      {/* Hero Banner */}
      <section className="bg-black text-white py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl lg:text-5xl font-bold mb-4">
              Turn your voice into horsepower!
              </h2>
              <p className="text-lg lg:text-xl mb-6 text-gray-300">
              Just say it, <b>{brandName} Auto Parts</b> does the rest. 
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-row gap-3">
                  <button
                    onClick={() => {
                      navigate({
                        to: '/category' as any,
                        search: { category: undefined, q: undefined, page: 1 } as any,
                      })
                    }}
                    className="hidden bg-yellow-500 text-gray-900 px-8 py-3 rounded font-bold text-lg hover:bg-yellow-400 transition-colors"
                  >
                    Shop Now
                  </button>
                  <div className="relative inline-block">
                    <button
                      onClick={handleAdvanceVoiceClick}
                      className={`px-8 py-3 rounded font-bold text-lg transition-colors ${
                        isAgentActive
                          ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400 animate-yellow-glow'
                          : 'bg-white text-gray-900 hover:bg-gray-100 animate-glow'
                      }`}
                    >
                    {isAgentActive ? (
                      'Shop using your voice!'
                    ) : (
                      <>
                        <span className="font-light">Try</span> <span className="font-bold">{voiceName}</span> <span className="font-light">| powered by</span> <span className="font-ocr-a">vowel</span>
                      </>
                    )}
                    </button>
                    {!isAgentActive && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full text-xs font-bold z-10">
                        NEW
                      </div>
                    )}
                  </div>
                </div>
                {isAgentActive && (
                  <div className="flex flex-col gap-1.5 text-left text-sm text-gray-300">
                    <div>"What batteries are on sale"</div>
                    <div>"I need some brake rotors"</div>
                    <div>"Change my vehicle selection"</div>
                    <div>"Show me the cart"</div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 relative">
              {featuredProduct && featuredProduct.images && featuredProduct.images[0] && (
                <>
                  {featuredProduct.sku ? (
                    <Link
                      to="/product/$sku"
                      params={{ sku: featuredProduct.sku }}
                      className="w-full max-w-md mx-auto bg-white rounded-lg p-4 cursor-pointer inline-block"
                    >
                      <img
                        src={featuredProduct.images[0]}
                        alt={featuredProduct.name}
                        className="w-full rounded-lg"
                      />
                    </Link>
                  ) : (
                    <div className="w-full max-w-md mx-auto bg-white rounded-lg p-4">
                      <img
                        src={featuredProduct.images[0]}
                        alt={featuredProduct.name}
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Small Promotional Strips */}
      <section className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Save Up To $20 + FREE Oil Filter', desc: '5 Quarts of Synthetic Motor Oil + ANY Oil Filter for FREE', icon: '🔋' },
              { title: 'Auto Batteries', desc: 'Starting at $99.99 with installation', icon: '⚡' },
              { title: 'Brake Service Special', desc: 'Free brake inspection with purchase', icon: '🛑' },
            ].map((promo, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{promo.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{promo.title}</h3>
                    <p className="text-sm text-gray-600">{promo.desc}</p>
                    <span className="text-xs text-gray-500">*</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 uppercase">TOP CATEGORIES</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, idx) => {
              // Use displayProduct if specified (for Oil Change Bundles), otherwise use first product
              const displayProduct = (category as any).displayProduct || category.products?.[0]
              const categoryImage = displayProduct?.images?.[0]
              const categorySlug = getCategorySlug(category.name)
              
              return (
                <Link
                  key={idx}
                  to="/category"
                  // @ts-ignore
                  search={{ category: categorySlug, q: undefined, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: undefined }}
                  className="flex flex-col items-center hover:opacity-80 transition-opacity"
                >
                  <div className="relative w-32 h-32 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mb-3 hover:border-yellow-500 transition-colors cursor-pointer overflow-hidden">
                    {categoryImage ? (
                      <>
                        <img
                          src={categoryImage}
                          alt={category.name}
                          className="w-full h-full rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to icon if image fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                            const parent = target.parentElement
                            if (parent && !parent.querySelector('.fallback-icon')) {
                              const iconSpan = document.createElement('span')
                              iconSpan.className = 'fallback-icon text-4xl'
                              iconSpan.textContent = category.icon
                              parent.appendChild(iconSpan)
                            }
                          }}
                        />
                        {category.badge && (
                          <div className="absolute -top-2 -right-2 bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-1 rounded">
                            {category.badge}
                          </div>
                        )}
                      </>
                    ) : (
                      <span className="text-4xl">{category.icon}</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 text-center">{category.name}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Recently Viewed & More */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 uppercase">RECENTLY VIEWED & MORE</h2>
          <ProductCarousel products={recentlyViewedProducts} />
        </div>
      </section>

      {/* Under The Hood Savings */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 uppercase">UNDER THE HOOD SAVINGS</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: '2 For $12', desc: 'Select oil filters', product: oilFilters[0] },
              { title: 'Save $10 Instantly', desc: 'On select brake pads', product: brakePads[0] },
              { title: 'Chevron Techron: $8.99', desc: 'Fuel system cleaner', product: oilFilters[1] || oilFilters[0] },
              { title: '$10 Gift Card', desc: 'With battery purchase', product: batteries[0] },
            ].map((promo, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                {promo.product?.images?.[0] && (
                  promo.product.sku ? (
                    <Link
                      to="/product/$sku"
                      params={{ sku: promo.product.sku }}
                      className="w-full h-48 bg-white flex items-center justify-center overflow-hidden cursor-pointer"
                    >
                      <img
                        src={promo.product.images[0]}
                        alt={promo.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </Link>
                  ) : (
                    <div className="w-full h-48 bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={promo.product.images[0]}
                        alt={promo.product.name}
                        className="w-full h-full object-contain p-2"
                      />
                    </div>
                  )
                )}
                <div className="p-4">
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{promo.title}</h3>
                  <p className="text-sm text-gray-600">{promo.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Sellers For Your Vehicle */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 uppercase">TOP SELLERS FOR YOUR VEHICLE</h2>
          <ProductCarousel products={topSellersProducts} />
        </div>
      </section>

      {/* May We Suggest */}
      <section className="bg-white py-12 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-700 mb-8 uppercase">MAY WE SUGGEST</h2>
          <ProductCarousel products={mayWeSuggestProducts} />
        </div>
      </section>
    </div>
  )
}

/**
 * Product carousel component for horizontal scrolling product lists
 */
function ProductCarousel({ products }: { products: Product[] }) {
  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4 min-w-max">
        {products.map((product, idx) => (
          <ProductCard key={product.sku || `product-${idx}`} product={product} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual product card component
 */
function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.images?.[0] || ''
  const displayPrice = product.price
    ? (product.sale_discount
        ? `$${(parseFloat(product.price.replace('$', '')) * (1 - product.sale_discount)).toFixed(2)}`
        : product.price)
    : 'Price unavailable'

  /**
   * Handle add to cart button click
   */
  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.sku) {
      addToCart(product, 1, 'store-pickup', undefined, undefined, true)
      openCartOverlay()
    }
  }

  return (
    <div className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && product.sku && (
        <Link
          to="/product/$sku"
          params={{ sku: product.sku }}
          className="w-full h-48 bg-white flex items-center justify-center overflow-hidden cursor-pointer"
        >
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </Link>
      )}
      {imageUrl && !product.sku && (
        <div className="w-full h-48 bg-white flex items-center justify-center overflow-hidden">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xl font-bold text-gray-900">{displayPrice}</span>
          {product.sale_discount && (
            <span className="text-sm text-gray-500 line-through">{product.price}</span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-2">
          <span className="text-yellow-400">★★★★</span>
          <span className="text-sm text-gray-600">(1364)</span>
        </div>
        <h3 className="text-sm font-medium text-gray-900 mb-3 line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>
        <button
          onClick={handleAddToCart}
          className="w-full bg-yellow-500 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
          data-vowel-ignore="true"
        >
          Add
        </button>
      </div>
    </div>
  )
}
