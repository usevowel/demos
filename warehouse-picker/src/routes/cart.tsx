import { createFileRoute, Link } from '@tanstack/react-router'
import { useSnapshot } from 'valtio'
import { useState, useMemo } from 'react'
import { useFeatureFlagEnabled } from '@/hooks/useFeatureFlagEnabled'
import {
  AppHeader,
  HeaderSpacer,
} from '@/components/AppHeader'
import {
  cartStore,
  removeFromCart,
  updateCartItemQuantity,
  updateCartItemDeliveryMethod,
  getCartTotal,
  getCartSubtotal,
  getDiscountAmount,
  getTotalDeliveryCost,
  applyDiscountCode,
  removeDiscountCode,
  addToCart,
  type DeliveryMethod,
} from '@/store/cart'
import { getProducts, type Product } from '@/data/products'
import {
  X,
  Plus,
  Minus,
  Flag,
  Truck,
  Package,
  CheckCircle2,
  ChevronDown,
  Star,
} from 'lucide-react'

/**
 * Cart page route
 * Displays full cart with all items and their delivery methods
 */
export const Route = createFileRoute('/cart')({
  component: CartPage,
})

/**
 * Delivery method option configuration
 */
interface DeliveryOption {
  value: DeliveryMethod
  label: string
  icon: typeof Flag
  description: string
  cost: string
  available: boolean
}

/**
 * Get delivery method display info
 */
function getDeliveryMethodInfo(method: DeliveryMethod) {
  switch (method) {
    case 'store-pickup':
      return {
        label: 'Store Pickup',
        icon: Flag,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-300',
      }
    case 'same-day-delivery':
      return {
        label: 'Same Day Delivery',
        icon: Truck,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
      }
    case 'home-delivery':
      return {
        label: 'Home Delivery',
        icon: Package,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
      }
  }
}

/**
 * Delivery method selector component
 */
function DeliveryMethodSelector({
  currentMethod,
  onSelect,
}: {
  currentMethod: DeliveryMethod
  onSelect: (method: DeliveryMethod) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const options: DeliveryOption[] = [
    {
      value: 'store-pickup',
      label: 'Store Pickup',
      icon: Flag,
      description: 'Ready in 30 mins at 2350 3rd St S Jacksonville, FL',
      cost: 'FREE',
      available: true,
    },
    {
      value: 'same-day-delivery',
      label: 'Same Day Home Delivery',
      icon: Truck,
      description: 'Order By 8pm Zip Code: 32250',
      cost: '$8.99',
      available: true,
    },
    {
      value: 'home-delivery',
      label: 'Home Delivery',
      icon: Package,
      description: 'Standard Delivery Available',
      cost: 'FREE for orders over $35',
      available: true,
    },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
      >
        Change Delivery Method
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4 space-y-3">
            {options.map((option) => {
              const OptionIcon = option.icon
              const isSelected = option.value === currentMethod

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    onSelect(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left p-3 border-2 rounded-lg transition-all ${
                    isSelected
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <OptionIcon className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-gray-900">
                          {option.label} ({option.cost})
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Generate consistent rating and review count based on product SKU/name
 */
function getProductRating(product: Product) {
  const ratingSeed = product.sku || product.name
  const hash = ratingSeed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const rating = (hash % 5) + 1 // Rating between 1-5
  const reviewCount = Math.floor(hash % 200) + 1 // Review count between 1-200
  return { rating, reviewCount }
}

/**
 * Main cart page component
 */
function CartPage() {
  const cart = useSnapshot(cartStore)
  const [discountInput, setDiscountInput] = useState('')
  const subtotal = getCartSubtotal()
  const discountAmount = getDiscountAmount()
  const deliveryCost = getTotalDeliveryCost()
  const total = getCartTotal()
  const tax = total * 0.075 // 7.5% tax
  const orderTotal = total + tax

  // Check NO_LOGOS feature flag from PostHog
  const noLogos = useFeatureFlagEnabled('NO_LOGOS')
  const brandName = noLogos ? 'VOWEL' : 'ADVANCE'
  const brandNameFull = noLogos ? 'Vowel Auto Parts' : 'Advance Auto Parts'

  const handleApplyDiscount = () => {
    if (discountInput.trim()) {
      const success = applyDiscountCode(discountInput)
      if (success) {
        setDiscountInput('')
      }
    }
  }

  const handleRemoveDiscount = () => {
    removeDiscountCode()
    setDiscountInput('')
  }

  // Get recommended products from JSON (exclude products already in cart, alternate categories)
  const allProducts = getProducts()
  const cartSkus = new Set(cart.items.map((item) => item.sku))
  const recommendedProducts = useMemo(() => {
    // Filter out products already in cart
    const availableProducts = allProducts.filter(
      (product) => product.sku && !cartSkus.has(product.sku)
    )

    // Group products by category
    const productsByCategory = new Map<string, Product[]>()
    availableProducts.forEach((product) => {
      const category = product.category || 'other'
      if (!productsByCategory.has(category)) {
        productsByCategory.set(category, [])
      }
      productsByCategory.get(category)!.push(product)
    })

    // Get unique categories and alternate between them
    const categories = Array.from(productsByCategory.keys())
    const selectedProducts: Product[] = []
    const maxProducts = 4

    // Alternate between categories to ensure variety
    for (let i = 0; i < maxProducts && selectedProducts.length < maxProducts; i++) {
      const categoryIndex = i % categories.length
      const category = categories[categoryIndex]
      const categoryProducts = productsByCategory.get(category) || []
      
      // Get a product from this category that we haven't selected yet
      const productIndex = Math.floor(i / categories.length)
      if (categoryProducts[productIndex]) {
        selectedProducts.push(categoryProducts[productIndex])
      }
    }

    // If we don't have enough products from alternating, fill with any remaining products
    if (selectedProducts.length < maxProducts) {
      const remainingProducts = availableProducts.filter(
        (p) => !selectedProducts.some((sp) => sp.sku === p.sku)
      )
      selectedProducts.push(...remainingProducts.slice(0, maxProducts - selectedProducts.length))
    }

    return selectedProducts.slice(0, maxProducts)
  }, [allProducts, cartSkus])

  return (
    <div className="min-h-screen bg-white">
      <AppHeader showLogo={true} />
      <HeaderSpacer />

      {/* PayPal Banner */}
      {cart.items.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 py-2">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-blue-900 text-center">
              Pay in 4 interest-free payments of ${(orderTotal / 4).toFixed(2)} via{' '}
              <a href="#" className="font-semibold hover:underline">
                PayPal
              </a>
              .{' '}
              <a href="#" className="text-blue-600 hover:underline">
                Learn more
              </a>
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cart.items.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">CART EMPTY</h1>
            <p className="text-lg text-gray-600 mb-2">
              JOIN OVER 20+ MILLION Satisfied Customers
            </p>
            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-xl font-bold">{brandName} AUTO PARTS</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm text-gray-600">5 Stars at Google Trusted Stores</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {['Help Desk', "FAQ's", 'In-Store Pickup', 'Payment Methods'].map((link) => (
                <a
                  key={link}
                  href="#"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {link}
                </a>
              ))}
            </div>

            {/* You May Also Need Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">YOU MAY ALSO NEED</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 justify-center">
                {recommendedProducts.map((product) => {
                  const { rating, reviewCount } = getProductRating(product)
                  const price = parseFloat(product.price?.replace('$', '') || '0')
                  const productImage = product.images?.[0]

                  return (
                    <div
                      key={product.sku || product.name}
                      className="flex-shrink-0 w-64 border border-gray-200 rounded-lg p-4 bg-white flex flex-col"
                    >
                      {/* Product Image */}
                      {product.sku ? (
                        <Link
                          to="/product/$sku"
                          params={{ sku: product.sku }}
                          className="w-full h-32 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden cursor-pointer"
                        >
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent && !parent.querySelector('.image-placeholder')) {
                                  const placeholder = document.createElement('div')
                                  placeholder.className =
                                    'image-placeholder flex items-center justify-center w-full h-full'
                                  placeholder.innerHTML = `
                                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  `
                                  parent.appendChild(placeholder)
                                }
                              }}
                            />
                          ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                          )}
                        </Link>
                      ) : (
                        <div className="w-full h-32 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={product.name}
                              className="w-full h-full object-contain p-2"
                              onError={(e) => {
                                const target = e.currentTarget
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent && !parent.querySelector('.image-placeholder')) {
                                  const placeholder = document.createElement('div')
                                  placeholder.className =
                                    'image-placeholder flex items-center justify-center w-full h-full'
                                  placeholder.innerHTML = `
                                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                    </svg>
                                  `
                                  parent.appendChild(placeholder)
                                }
                              }}
                            />
                          ) : (
                            <Package className="w-12 h-12 text-gray-400" />
                          )}
                        </div>
                      )}

                      {/* Product Info - grows to fill space */}
                      <div className="flex-1 flex flex-col">
                        <p className="text-lg font-bold text-gray-900 mb-1">${price.toFixed(2)}</p>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-600">({reviewCount})</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2 flex-1">
                          {product.name}
                        </p>

                        {/* Add Button - pinned to bottom */}
                        <button
                          onClick={() => {
                            addToCart(product, 1, 'store-pickup', '2350 3rd St S Jacksonville, FL 32250', undefined, true)
                          }}
                          className="w-full bg-yellow-500 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1 mt-auto"
                          data-vowel-ignore="true"
                        >
                          <Plus className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Be The First To Know About Deals And Promotions.
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Plus, create an account to receive $5 off of $20 or more.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter Email"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button className="bg-yellow-500 text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors">
                  SIGN UP
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Full Cart State */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Your Cart ({cart.items.length} {cart.items.length === 1 ? 'Item' : 'Items'})
              </h1>

              {/* Cart Items */}
              <div className="space-y-4">
                {cart.items.map((item, index) => {
                  const deliveryInfo = getDeliveryMethodInfo(item.deliveryMethod)
                  const DeliveryIcon = deliveryInfo.icon
                  const price = parseFloat(item.product.price?.replace('$', '') || '0')

                  return (
                    <div
                      key={`${item.sku}-${item.deliveryMethod}-${index}`}
                      className="border border-gray-200 rounded-lg p-6 bg-white"
                    >
                      {/* Delivery Method Banner */}
                      <div
                        className={`${deliveryInfo.bgColor} ${deliveryInfo.borderColor} border rounded-lg p-4 mb-4`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DeliveryIcon className={`w-5 h-5 ${deliveryInfo.color}`} />
                            <div>
                              <p className={`font-semibold ${deliveryInfo.color}`}>
                                {deliveryInfo.label.toUpperCase()} -{' '}
                                {item.deliveryMethod === 'store-pickup'
                                  ? 'FREE'
                                  : item.deliveryMethod === 'same-day-delivery'
                                    ? '$8.99'
                                    : 'FREE'}
                              </p>
                              {item.deliveryMethod === 'store-pickup' && (
                                <p className="text-sm text-gray-600">
                                  Pick Up At {brandNameFull} Store 9299
                                </p>
                              )}
                              {item.deliveryMethod === 'store-pickup' && (
                                <p className="text-sm text-gray-600">
                                  2350 3rd St S, Jacksonville
                                </p>
                              )}
                            </div>
                          </div>
                          {item.deliveryMethod === 'store-pickup' && (
                            <p className="text-sm font-semibold text-gray-900">
                              Ready in 30 mins
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4 mt-3">
                          <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                            STORE INFO
                          </button>
                        </div>
                      </div>

                      {/* Product Details */}
                      <div className="flex gap-4">
                        {/* Product Image */}
                        {item.product.images?.[0] ? (
                          item.product.sku ? (
                            <Link
                              to="/product/$sku"
                              params={{ sku: item.product.sku }}
                              className="w-32 h-32 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden cursor-pointer"
                            >
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-contain p-2"
                              />
                            </Link>
                          ) : (
                            <div className="w-32 h-32 bg-white border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-contain p-2"
                              />
                            </div>
                          )
                        ) : (
                          <div className="w-32 h-32 bg-white border border-gray-200 rounded flex items-center justify-center">
                            <Package className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        {/* Product Info */}
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {item.product.name}
                          </h3>
                          <p className="text-lg font-bold text-gray-900 mb-1">
                            ${price.toFixed(2)}
                          </p>
                          {item.product.sku && (
                            <p className="text-sm text-gray-600 mb-2">
                              Part # {item.product.sku}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-600">
                              Exact Fit for your 2025 Jeep Grand Cherokee Overland
                            </span>
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-4 mb-4">
                            <label className="text-sm font-medium text-gray-700">Qty:</label>
                            <div className="flex items-center border border-gray-300 rounded">
                              <button
                                onClick={() =>
                                  updateCartItemQuantity(
                                    item.sku,
                                    item.deliveryMethod,
                                    item.quantity - 1
                                  )
                                }
                                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="px-4 py-2 text-gray-900 font-medium min-w-[3rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartItemQuantity(
                                    item.sku,
                                    item.deliveryMethod,
                                    item.quantity + 1
                                  )
                                }
                                className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Remove Link */}
                          <button
                            onClick={() => removeFromCart(item.sku, item.deliveryMethod)}
                            className="text-sm text-red-600 hover:text-red-700 hover:underline flex items-center gap-1 mb-4"
                          >
                            <X className="w-4 h-4" />
                            Remove
                          </button>

                          {/* Change Delivery Method */}
                          <div className="flex gap-4 pt-4 border-t border-gray-200">
                            <DeliveryMethodSelector
                              currentMethod={item.deliveryMethod}
                              onSelect={(newMethod) => {
                                updateCartItemDeliveryMethod(
                                  item.sku,
                                  item.deliveryMethod,
                                  newMethod,
                                  newMethod === 'store-pickup'
                                    ? '2350 3rd St S, Jacksonville, FL 32250'
                                    : undefined,
                                  newMethod !== 'store-pickup' ? '32250' : undefined
                                )
                              }}
                            />
                            {item.deliveryMethod === 'store-pickup' && (
                              <button className="text-sm text-blue-600 hover:text-blue-700 hover:underline">
                                Change Store
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Customers Also Purchased */}
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  CUSTOMERS ALSO PURCHASED
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {recommendedProducts.map((product) => {
                    const { rating, reviewCount } = getProductRating(product)
                    const price = parseFloat(product.price?.replace('$', '') || '0')
                    const productImage = product.images?.[0]

                    return (
                      <div
                        key={product.sku || product.name}
                        className="flex-shrink-0 w-64 border border-gray-200 rounded-lg p-4 bg-white flex flex-col"
                      >
                        {/* Product Image */}
                        {product.sku ? (
                          <Link
                            to="/product/$sku"
                            params={{ sku: product.sku }}
                            className="w-full h-32 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden cursor-pointer"
                          >
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent && !parent.querySelector('.image-placeholder')) {
                                    const placeholder = document.createElement('div')
                                    placeholder.className =
                                      'image-placeholder flex items-center justify-center w-full h-full'
                                    placeholder.innerHTML = `
                                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    `
                                    parent.appendChild(placeholder)
                                  }
                                }}
                              />
                            ) : (
                              <Package className="w-12 h-12 text-gray-400" />
                            )}
                          </Link>
                        ) : (
                          <div className="w-full h-32 bg-white border border-gray-200 rounded mb-3 flex items-center justify-center overflow-hidden">
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={product.name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                  const target = e.currentTarget
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent && !parent.querySelector('.image-placeholder')) {
                                    const placeholder = document.createElement('div')
                                    placeholder.className =
                                      'image-placeholder flex items-center justify-center w-full h-full'
                                    placeholder.innerHTML = `
                                      <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    `
                                    parent.appendChild(placeholder)
                                  }
                                }}
                              />
                            ) : (
                              <Package className="w-12 h-12 text-gray-400" />
                            )}
                          </div>
                        )}

                        {/* Product Info - grows to fill space */}
                        <div className="flex-1 flex flex-col">
                          <p className="text-lg font-bold text-gray-900 mb-1">${price.toFixed(2)}</p>
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                            <span className="text-xs text-gray-600">({reviewCount})</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 line-clamp-2 flex-1">
                            {product.name}
                          </p>

                          {/* Add Button - pinned to bottom */}
                          <button
                            onClick={() => {
                              addToCart(product, 1, 'store-pickup', '2350 3rd St S Jacksonville, FL 32250', undefined, true)
                            }}
                            className="w-full bg-yellow-500 text-gray-900 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors flex items-center justify-center gap-1 mt-auto"
                            data-vowel-ignore="true"
                          >
                            <Plus className="w-4 h-4" />
                            Add
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-[125px] space-y-6">
                {/* Speed Perks Rewards
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="font-bold text-gray-900 mb-2">Save With Speed Perks Rewards</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Become a Speed Perks member and get $5 off $20 on your first purchase.
                  </p>
                  <button className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition-colors">
                    Sign In To Earn Points
                  </button>
                </div> */}

                {/* Discount Code */}
                <div className="min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ENTER CODE
                  </label>
                  {cart.discountCode ? (
                    /* Applied Discount Code */
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-semibold text-green-900">
                            Code Applied:
                          </span>
                          <span className="text-sm font-bold text-green-700 truncate">
                            {cart.discountCode}
                          </span>
                        </div>
                        <button
                          onClick={handleRemoveDiscount}
                          className="flex-shrink-0 text-red-600 hover:text-red-700 transition-colors"
                          title="Remove discount"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-xs text-green-700">
                        {Math.round(cart.discountPercent * 100)}% discount applied
                      </div>
                    </div>
                  ) : (
                    /* Discount Code Input */
                    <div className="flex gap-2 min-w-0">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyDiscount()
                          }
                        }}
                        className="flex-1 min-w-0 px-4 py-2 bg-white border border-gray-300 rounded text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        placeholder="Enter code"
                      />
                      <button
                        onClick={handleApplyDiscount}
                        disabled={!discountInput.trim()}
                        className="flex-shrink-0 bg-gray-200 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        Apply
                      </button>
                    </div>
                  )}
                </div>

                {/* View Toggle */}
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button className="flex-1 bg-yellow-500 text-gray-900 py-2 text-sm font-semibold">
                    Quick View
                  </button>
                  <button className="flex-1 bg-white text-gray-700 py-2 text-sm font-semibold hover:bg-gray-50">
                    Detailed View
                  </button>
                </div>

                {/* Order Summary */}
                <div className="space-y-3 border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Items Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {cart.discountCode && discountAmount > 0 && (
                    <div className="flex justify-between items-center gap-2 text-green-700 min-w-0">
                      <span className="flex items-center gap-1 min-w-0 truncate">
                        Discount ({cart.discountCode}):
                      </span>
                      <span className="font-semibold flex-shrink-0">-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {deliveryCost > 0 && (
                    <div className="flex justify-between text-gray-700">
                      <span>Delivery:</span>
                      <span>${deliveryCost.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-700">
                    <span>Tax:</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>ORDER TOTAL:</span>
                    <span>${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Buttons */}
                <div className="space-y-3">
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                    <span className="text-lg font-bold">PayPal</span>
                  </button>
                  <button className="w-full bg-yellow-500 text-gray-900 py-4 rounded-lg font-bold text-lg hover:bg-yellow-400 transition-colors">
                    CHECKOUT NOW
                  </button>
                </div>

                {/* Need Help */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Need Help? See our{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 hover:underline">
                      Help Desk
                    </a>{' '}
                    site or call us:
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mb-1">1-877-238-2623</p>
                  <p className="text-xs text-gray-600">Sunday - Saturday: 8:30 AM - 5:30 PM ET</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
