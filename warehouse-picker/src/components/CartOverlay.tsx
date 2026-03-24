import { useSnapshot } from 'valtio'
import { Link } from '@tanstack/react-router'
import { X, ShoppingCart, Package, Truck, Flag } from 'lucide-react'
import {
  cartStore,
  closeCartOverlay,
  getCartTotal,
  type DeliveryMethod,
} from '@/store/cart'

/**
 * Get delivery method display info
 */
function getDeliveryMethodInfo(method: DeliveryMethod) {
  switch (method) {
    case 'store-pickup':
      return { label: 'Store Pickup', icon: Flag, color: 'text-gray-600' }
    case 'same-day-delivery':
      return { label: 'Same Day Delivery', icon: Truck, color: 'text-blue-600' }
    case 'home-delivery':
      return { label: 'Home Delivery', icon: Package, color: 'text-green-600' }
  }
}

/**
 * Cart overlay component - displays mini cart dropdown
 * Shows cart items with their delivery methods and provides quick actions
 */
export function CartOverlay() {
  const cart = useSnapshot(cartStore)
  const total = getCartTotal()

  if (!cart.overlayOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={closeCartOverlay}
      />

      {/* Overlay Panel */}
      <div className="fixed top-[85px] lg:top-[125px] right-0 w-full sm:w-96 bg-white shadow-2xl z-50 max-h-[calc(100vh-85px)] lg:max-h-[calc(100vh-125px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
          <button
            onClick={closeCartOverlay}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Banner */}
        {total < 35 && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-600 font-semibold">
              Free shipping above $35.00!
            </p>
          </div>
        )}

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-lg font-semibold text-gray-900 mb-2">Cart is empty!</p>
              <p className="text-sm text-gray-600 mb-6">Add Something to the Cart</p>
              <Link
                to="/category"
                // @ts-ignore
                search={{ q: undefined, category: undefined, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: undefined }}
                onClick={closeCartOverlay}
                className="bg-yellow-500 text-gray-900 px-6 py-2 rounded font-semibold hover:bg-yellow-400 transition-colors"
              >
                Shop Special Deals
              </Link>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {cart.items.map((item, index) => {
                const deliveryInfo = getDeliveryMethodInfo(item.deliveryMethod)
                const DeliveryIcon = deliveryInfo.icon
                const price = parseFloat(item.product.price?.replace('$', '') || '0')
                const itemTotal = price * item.quantity

                return (
                  <div
                    key={`${item.sku}-${item.deliveryMethod}-${index}`}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    {/* Product Info */}
                    <div className="flex gap-3">
                      {item.product.images?.[0] && (
                        item.product.sku ? (
                          <Link
                            to="/product/$sku"
                            params={{ sku: item.product.sku }}
                            onClick={closeCartOverlay}
                            className="w-16 h-16 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer flex-shrink-0"
                          >
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </Link>
                        ) : (
                          <div className="w-16 h-16 bg-white rounded border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        )
                      )}
                      <div className="flex-1 min-w-0">
                        {item.product.sku ? (
                          <Link
                            to="/product/$sku"
                            params={{ sku: item.product.sku }}
                            onClick={closeCartOverlay}
                            className="text-sm font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors block"
                          >
                            {item.product.name}
                          </Link>
                        ) : (
                          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">
                            {item.product.name}
                          </h3>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          Qty: {item.quantity} × ${price.toFixed(2)}
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          ${itemTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Method */}
                    <div className="flex items-center gap-2 text-xs">
                      <DeliveryIcon className={`w-4 h-4 ${deliveryInfo.color}`} />
                      <span className={`font-medium ${deliveryInfo.color}`}>
                        {deliveryInfo.label}
                      </span>
                    </div>

                    {/* View Cart Link */}
                    <Link
                      to="/cart"
                      onClick={closeCartOverlay}
                      className="block text-sm text-blue-600 hover:text-blue-700 hover:underline text-center pt-2 border-t border-gray-200"
                    >
                      View Cart
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer with Total and Checkout */}
        {cart.items.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Subtotal:</span>
              <span className="text-lg font-bold text-gray-900">
                ${total.toFixed(2)}
              </span>
            </div>
            <Link
              to="/cart"
              onClick={closeCartOverlay}
              className="block w-full bg-yellow-500 text-gray-900 py-3 rounded-lg font-bold text-center hover:bg-yellow-400 transition-colors"
            >
              CHECKOUT NOW
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
