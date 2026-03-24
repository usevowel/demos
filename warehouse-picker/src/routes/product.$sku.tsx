import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { getProducts } from '@/data/products'
import { AppHeader, HeaderSpacer } from '@/components/AppHeader'
import { ChevronRight, Star, Flag, Truck, Package, CheckCircle2, Info, Share2, Play, AlertCircle, Heart } from 'lucide-react'
import {
  addToCart,
  cartStore,
  updateCartItemDeliveryMethod,
  updateCartItemQuantity,
  type DeliveryMethod,
} from '@/store/cart'
import { vehicleStore, openVehicleModal, getSelectedVehicle } from '@/store/vehicle'
import { wishlistStore, addToWishlist, removeFromWishlist } from '@/store/wishlist'

/**
 * Product detail page route
 * Displays full product information with images, specifications, and purchase options
 */
export const Route = createFileRoute('/product/$sku')({
  component: ProductDetailPage,
  loader: ({ params }) => {
    const products = getProducts()
    const product = products.find(p => p.sku === params.sku)
    if (!product) {
      throw new Error(`Product with SKU ${params.sku} not found`)
    }
    return { product }
  },
})

/**
 * Main product detail page component
 * Displays comprehensive product information matching the design reference
 */
function ProductDetailPage() {
  const { product } = Route.useLoaderData()
  const navigate = useNavigate()
  const cart = useSnapshot(cartStore)
  const vehicleState = useSnapshot(vehicleStore)
  const selectedVehicle = vehicleState.selectedVehicleId !== null 
    ? vehicleState.vehicles[vehicleState.selectedVehicleId] || null
    : null
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod>('store-pickup')

  // Check if product is already in cart and get its current delivery method
  const cartItem = useMemo(() => {
    return cart.items.find((item) => item.sku === product.sku)
  }, [cart.items, product.sku])

  // Initialize delivery method from cart if product is already in cart
  useEffect(() => {
    if (cartItem) {
      setSelectedDeliveryMethod(cartItem.deliveryMethod)
      setQuantity(cartItem.quantity)
    }
  }, [cartItem])

  // Get main image and thumbnails
  const mainImage = product.images?.[selectedImageIndex] || product.images?.[0] || ''
  const thumbnails = product.images || []

  // Calculate pricing
  const regularPrice = product.price || '$0.00'
  const salePrice = product.sale_discount
    ? `$${(parseFloat(regularPrice.replace('$', '')) * (1 - product.sale_discount)).toFixed(2)}`
    : null
  const displayPrice = salePrice || regularPrice
  const hasDiscount = !!salePrice

  // Generate consistent rating based on product SKU/name
  const ratingSeed = product.sku || product.name
  const hash = ratingSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = (hash % 5) + 1 // Rating between 1-5
  const reviewCount = Math.floor(hash % 200) + 1 // Review count between 1-200

  /**
   * Generate vehicle key for fit lookup
   * Format: "year-make-model"
   */
  const getVehicleKey = (vehicle: typeof selectedVehicle): string => {
    if (!vehicle) return ''
    return `${vehicle.year}-${vehicle.make}-${vehicle.model}`
  }

  /**
   * Check if product fits the currently selected vehicle
   * Uses vehicleFit data from product JSON, or generates deterministic fit for new vehicles
   */
  const fitsVehicle = useMemo(() => {
    if (!selectedVehicle) return false
    
    const vehicleKey = getVehicleKey(selectedVehicle)
    
    // Check if we have fit data for this vehicle in the product
    if (product.vehicleFit && vehicleKey in product.vehicleFit) {
      return product.vehicleFit[vehicleKey] === true
    }
    
    // For vehicles not in the default list, generate deterministic fit based on SKU and vehicle
    // This ensures consistent fit status for the same product/vehicle combination
    if (product.sku) {
      const combined = `${product.sku}-${vehicleKey}`
      const fitHash = combined.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      return fitHash % 2 === 0 // 50% chance of fitting
    }
    
    return false
  }, [selectedVehicle, product.vehicleFit, product.sku])

  // Wishlist functionality
  const wishlist = useSnapshot(wishlistStore)
  const selectedVehicleForWishlist = getSelectedVehicle()

  // Check if item is in wishlist for selected vehicle
  const isInWishlist = useMemo(() => {
    if (!selectedVehicleForWishlist || !product.sku) return false
    
    return wishlist.wishlistItems.some((item) => {
      if (item.sku !== product.sku) return false
      
      const itemVehicle = typeof item.vehicle === 'string'
        ? vehicleStore.vehicles.find(v => {
            const vKey = `${v.year}-${v.make}-${v.model}`
            return vKey === item.vehicle
          })
        : item.vehicle
      
      if (!itemVehicle) return false
      
      return (
        itemVehicle.year === selectedVehicleForWishlist.year &&
        itemVehicle.make === selectedVehicleForWishlist.make &&
        itemVehicle.model === selectedVehicleForWishlist.model
      )
    })
  }, [wishlist.wishlistItems, selectedVehicleForWishlist, product.sku])

  // Toggle wishlist item
  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedVehicleForWishlist || !product.sku) return

    if (isInWishlist) {
      // Remove from wishlist
      const itemIndex = wishlist.wishlistItems.findIndex((item) => {
        if (item.sku !== product.sku) return false
        
        const itemVehicle = typeof item.vehicle === 'string'
          ? vehicleStore.vehicles.find(v => {
              const vKey = `${v.year}-${v.make}-${v.model}`
              return vKey === item.vehicle
            })
          : item.vehicle
        
        if (!itemVehicle) return false
        
        return (
          itemVehicle.year === selectedVehicleForWishlist.year &&
          itemVehicle.make === selectedVehicleForWishlist.make &&
          itemVehicle.model === selectedVehicleForWishlist.model
        )
      })
      
      if (itemIndex >= 0) {
        removeFromWishlist(itemIndex)
      }
    } else {
      // Add to wishlist
      addToWishlist({
        vehicle: selectedVehicleForWishlist,
        itemName: product.name,
        sku: product.sku,
        dateAdded: new Date().toISOString(),
      })
    }
  }

  // Mock delivery options
  const storePickupAvailable = true
  const sameDayDeliveryAvailable = Math.random() > 0.3
  const homeDeliveryAvailable = true

  // Extract warranty info from product name
  const warrantyInfo = useMemo(() => {
    if (product.name.includes('4 Year')) return '4 Yr Replacement If Defective'
    if (product.name.includes('3 Year')) return '3 Yr Replacement If Defective'
    if (product.name.includes('1 Year')) return '1 Yr Replacement If Defective'
    return '90 Day Replacement If Defective'
  }, [product.name])

  // Core charge for batteries
  const coreCharge = product.category === 'batteries' ? '$22.00' : null

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showLogo={true} />
      <HeaderSpacer />

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
            <Link to="/" search={{ l: undefined }} className="hover:text-yellow-500">Home</Link>
            <ChevronRight className="w-4 h-4" />
            {/* @ts-ignore */}
            <Link to="/category" search={{ q: product.name.split(':')[0], category: undefined, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: undefined }} className="hover:text-yellow-500">Search results for "{product.name.split(':')[0]}"</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Column - Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="w-full aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden flex items-center justify-center">
              {mainImage ? (
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent && !parent.querySelector('.image-placeholder')) {
                      const placeholder = document.createElement('div')
                      placeholder.className = 'image-placeholder flex flex-col items-center justify-center text-gray-400 p-4 w-full h-full'
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
                <div className="image-placeholder flex flex-col items-center justify-center text-gray-400 p-4 w-full h-full">
                  <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span className="text-xs text-center">No Image Available</span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {thumbnails.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {thumbnails.map((thumb, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 border-2 rounded overflow-hidden transition-all ${
                      selectedImageIndex === index
                        ? 'border-yellow-500 ring-2 ring-yellow-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={thumb}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-contain bg-white"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Info Video Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="text-sm font-semibold">Product Info</span>
                <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Play className="w-4 h-4" />
                  <span>Watch Now Video</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Product Details and Purchase Options */}
          <div className="space-y-6">
            {/* Product Title and Share */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                <button className="flex-shrink-0 text-gray-600 hover:text-gray-900 transition-colors">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Interchangeable Parts */}
              <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                View 4 Interchangeable Parts
              </button>
            </div>

            {/* Ratings */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">({reviewCount} reviews)</span>
            </div>

            {/* Part Number with Wishlist Button */}
            {product.sku && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Part # {product.sku}</span>
                {selectedVehicleForWishlist && (
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

            {/* Warranty */}
            <div>
              <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                {warrantyInfo}
              </button>
            </div>

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{displayPrice}</span>
                {coreCharge && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg text-gray-600">+ {coreCharge} Refundable Core</span>
                    <button className="text-gray-400 hover:text-gray-600">
                      <Info className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {hasDiscount && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through">{regularPrice}</span>
                  <span className="text-sm text-red-600 font-semibold">
                    Save ${(parseFloat(regularPrice.replace('$', '')) * (product.sale_discount || 0)).toFixed(2)}
                  </span>
                </div>
              )}
              <p className="text-sm text-gray-600">Excluded from discounts</p>
            </div>

            {/* Compatibility Messages */}
            {selectedVehicle && (
              <>
                {/* Does Fit Message */}
                {fitsVehicle && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-900">
                        Fits your {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <button 
                        onClick={openVehicleModal}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1"
                      >
                        Change Vehicle
                      </button>
                    </div>
                  </div>
                )}

                {/* Does Not Fit Message */}
                {!fitsVehicle && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Does Not Fit your {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                      </p>
                      <button 
                        onClick={openVehicleModal}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline mt-1"
                      >
                        Change Vehicle
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Delivery Options */}
            <div className="border-t border-gray-200 pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                How Would You Like To Get This Item?
              </h3>

              {/* Store Pickup */}
              <button
                onClick={() => setSelectedDeliveryMethod('store-pickup')}
                className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                  selectedDeliveryMethod === 'store-pickup'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!storePickupAvailable}
              >
                <div className="flex items-start gap-3">
                  <Flag className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Store Pickup (FREE)</span>
                      {storePickupAvailable && selectedDeliveryMethod === 'store-pickup' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    {storePickupAvailable ? (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          Ready in 30 mins at 2350 3rd St S Jacksonville, FL
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle change store
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Change Store
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-red-600">Out of Stock</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Same Day Home Delivery */}
              <button
                onClick={() => setSelectedDeliveryMethod('same-day-delivery')}
                className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                  selectedDeliveryMethod === 'same-day-delivery'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!sameDayDeliveryAvailable}
              >
                <div className="flex items-start gap-3">
                  <Truck className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">Same Day Home Delivery ($8.99)</span>
                      {sameDayDeliveryAvailable && selectedDeliveryMethod === 'same-day-delivery' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    {sameDayDeliveryAvailable ? (
                      <>
                        <p className="text-sm text-gray-600 mb-1">
                          Order By 8pm Zip Code: 32250
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle change zip code
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Change Zip Code
                        </button>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">Not Available in 32250</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Home Delivery */}
              <button
                onClick={() => setSelectedDeliveryMethod('home-delivery')}
                className={`w-full text-left border-2 rounded-lg p-4 transition-all ${
                  selectedDeliveryMethod === 'home-delivery'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={!homeDeliveryAvailable}
              >
                <div className="flex items-start gap-3">
                  <Package className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">
                        Home Delivery (FREE for orders over $35)
                      </span>
                      {homeDeliveryAvailable && selectedDeliveryMethod === 'home-delivery' && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    {homeDeliveryAvailable ? (
                      <p className="text-sm text-gray-600">Standard Delivery Available</p>
                    ) : (
                      <p className="text-sm text-gray-600">Not available for this item</p>
                    )}
                  </div>
                </div>
              </button>

              {/* Curbside Pickup Note */}
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Info className="w-4 h-4" />
                Curbside pickup is available at most stores
              </p>
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 border-t border-gray-200 pt-6">
              {/* Show if product is already in cart */}
              {cartItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-900 font-semibold mb-1">
                    This item is already in your cart
                  </p>
                  <p className="text-xs text-blue-700">
                    Current: {cartItem.quantity} × {cartItem.deliveryMethod === 'store-pickup' ? 'Store Pickup' : cartItem.deliveryMethod === 'same-day-delivery' ? 'Same Day Delivery' : 'Home Delivery'}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Qty:</label>
                <div className="flex items-center border border-gray-300 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  if (cartItem) {
                    // If delivery method changed, update it
                    if (cartItem.deliveryMethod !== selectedDeliveryMethod) {
                      updateCartItemDeliveryMethod(
                        product.sku || '',
                        cartItem.deliveryMethod,
                        selectedDeliveryMethod,
                        selectedDeliveryMethod === 'store-pickup'
                          ? '2350 3rd St S Jacksonville, FL 32250'
                          : undefined,
                        selectedDeliveryMethod !== 'store-pickup' ? '32250' : undefined
                      )
                      // After updating delivery method, update quantity if needed
                      const updatedItem = cartStore.items.find(
                        (item) => item.sku === product.sku && item.deliveryMethod === selectedDeliveryMethod
                      )
                      if (updatedItem && updatedItem.quantity !== quantity) {
                        updateCartItemQuantity(product.sku || '', selectedDeliveryMethod, quantity)
                      }
                    } else {
                      // Same delivery method, just update quantity
                      if (cartItem.quantity !== quantity) {
                        updateCartItemQuantity(product.sku || '', selectedDeliveryMethod, quantity)
                      }
                    }
                  } else {
                    // Add new item to cart
                    addToCart(
                      product,
                      quantity,
                      selectedDeliveryMethod,
                      selectedDeliveryMethod === 'store-pickup'
                        ? '2350 3rd St S Jacksonville, FL 32250'
                        : undefined,
                      selectedDeliveryMethod !== 'store-pickup' ? '32250' : undefined,
                      true
                    )
                  }
                  // Navigate to cart page after adding/updating
                  navigate({ to: '/cart' })
                }}
                className="w-full bg-yellow-500 text-gray-900 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors"
                data-vowel-ignore="true"
              >
                {cartItem ? 'UPDATE CART' : 'ADD TO CART'}
              </button>

              <p className="text-sm text-gray-600">
                Not eligible for extra discounts, coupons, or offers - Speed Perks rewards only.
              </p>
            </div>
          </div>
        </div>

        {/* Product Information Section */}
        <div className="mt-12 space-y-8">
          {/* Product Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              {product.sku && (
                <div className="text-sm text-gray-600">
                  <span className="font-semibold">Part No.</span> {product.sku}
                </div>
              )}
              <div>
                <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                  Warranty Details ({warrantyInfo})
                </button>
              </div>
              {product.product_details && (
                <p className="text-gray-700 leading-relaxed">{product.product_details}</p>
              )}
            </div>
          </div>

          {/* Product Features */}
          {product.product_features && product.product_features.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Product Features</h2>
              <ul className="space-y-2">
                {product.product_features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-medium text-gray-700">{key}:</span>
                    <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
