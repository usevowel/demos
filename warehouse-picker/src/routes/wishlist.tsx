import { createFileRoute, useSearch, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { AppHeader, HeaderSpacer } from '@/components/AppHeader'
import { wishlistStore, removeFromWishlist } from '@/store/wishlist'
import { vehicleStore } from '@/store/vehicle'
import { getProducts } from '@/data/products'
import { X, Heart, Car, ChevronRight } from 'lucide-react'
import { getVehicleKey } from '@/vowel.client'

/**
 * Wishlist page route
 * Displays wishlist items with vehicle filtering
 */
export const Route = createFileRoute('/wishlist')({
  component: WishlistPage,
  validateSearch: (search: Record<string, unknown>) => ({
    vehicleId: search.vehicleId !== undefined ? Number(search.vehicleId) : undefined,
  }),
})

/**
 * Main wishlist page component
 * Displays wishlist items with vehicle filtering
 */
function WishlistPage() {
  const { vehicleId } = useSearch({ from: '/wishlist' })
  const navigate = useNavigate()
  const wishlist = useSnapshot(wishlistStore)
  const vehicleState = useSnapshot(vehicleStore)
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(
    vehicleId !== undefined ? vehicleId : null
  )

  // Sync URL param with state when URL changes
  useEffect(() => {
    if (vehicleId !== undefined) {
      setSelectedVehicleId(vehicleId)
    } else {
      setSelectedVehicleId(null)
    }
  }, [vehicleId])

  // Handler to update both state and URL when filter button is clicked
  const handleVehicleFilter = (vehicleIndex: number | null) => {
    setSelectedVehicleId(vehicleIndex)
    navigate({
      to: '/wishlist',
      search: vehicleIndex !== null ? { vehicleId: vehicleIndex } : { vehicleId: undefined },
    })
  }

  const allProducts = getProducts()

  // Filter wishlist items by selected vehicle
  const filteredItems = useMemo(() => {
    if (selectedVehicleId === null) {
      return wishlist.wishlistItems
    }

    return wishlist.wishlistItems.filter((item) => {
      const vehicle = typeof item.vehicle === 'string' 
        ? vehicleState.vehicles.find(v => getVehicleKey(v) === item.vehicle)
        : item.vehicle

      if (!vehicle) return false

      const vehicleIndex = vehicleState.vehicles.findIndex(v => 
        v.year === vehicle.year && 
        v.make === vehicle.make && 
        v.model === vehicle.model
      )

      return vehicleIndex === selectedVehicleId
    })
  }, [wishlist.wishlistItems, selectedVehicleId, vehicleState.vehicles])

  // Get product details for each wishlist item
  const itemsWithProducts = useMemo(() => {
    return filteredItems.map((item) => {
      const product = allProducts.find((p) => p.sku === item.sku)
      const vehicle = typeof item.vehicle === 'string'
        ? vehicleState.vehicles.find(v => getVehicleKey(v) === item.vehicle)
        : item.vehicle

      return {
        ...item,
        product,
        vehicle,
      }
    })
  }, [filteredItems, allProducts, vehicleState.vehicles])

  const handleRemove = (filteredIndex: number) => {
    const itemToRemove = itemsWithProducts[filteredIndex]
    if (!itemToRemove) return

    const itemVehicleKey = itemToRemove.vehicle 
      ? (typeof itemToRemove.vehicle === 'string' 
          ? itemToRemove.vehicle 
          : getVehicleKey(itemToRemove.vehicle))
      : null

    const originalIndex = wishlist.wishlistItems.findIndex((item) => {
      const vehicleKey = item.vehicle 
        ? (typeof item.vehicle === 'string' ? item.vehicle : getVehicleKey(item.vehicle))
        : null
      return item.sku === itemToRemove.sku && vehicleKey === itemVehicleKey
    })

    if (originalIndex >= 0) {
      removeFromWishlist(originalIndex)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <HeaderSpacer />
      <main className="flex-1">
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
              <p className="text-gray-600">Save items you want to purchase later</p>
            </div>

            {/* Vehicle Filter */}
            {vehicleState.vehicles.length > 0 && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Vehicle
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVehicleFilter(null)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedVehicleId === null
                        ? 'bg-yellow-500 text-gray-900'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >
                    All Vehicles
                  </button>
                  {vehicleState.vehicles.map((vehicle, index) => (
                    <button
                      key={index}
                      onClick={() => handleVehicleFilter(index)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                        selectedVehicleId === index
                          ? 'bg-yellow-500 text-gray-900'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Wishlist Items */}
            {itemsWithProducts.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                <p className="text-gray-600 mb-4">
                  {selectedVehicleId !== null
                    ? 'No items saved for this vehicle.'
                    : 'Start adding items to your wishlist to save them for later.'}
                </p>
                <Link
                  to="/category"
                  search={{ category: undefined, q: undefined, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: undefined }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-gray-900 rounded-md font-semibold hover:bg-yellow-400 transition-colors"
                >
                  Browse Products
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemsWithProducts.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    {/* Product Image */}
                    {item.product?.images && item.product.images.length > 0 && item.product.sku && (
                      <Link to="/product/$sku" params={{ sku: item.product.sku }}>
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-contain p-4"
                          />
                        </div>
                      </Link>
                    )}

                    {/* Product Info */}
                    <div className="p-4">
                      {/* Vehicle Badge */}
                      {item.vehicle && (
                        <div className="mb-2">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            <Car className="w-3 h-3" />
                            {item.vehicle.year} {item.vehicle.make} {item.vehicle.model}
                          </span>
                        </div>
                      )}

                      {/* Product Name */}
                      {(item.product?.sku || item.sku) ? (
                        <Link
                          to="/product/$sku"
                          params={{ sku: item.product?.sku || item.sku }}
                          className="block mb-2"
                        >
                          <h3 className="font-semibold text-gray-900 hover:text-yellow-500 transition-colors line-clamp-2">
                            {item.product?.name || item.itemName}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                          {item.product?.name || item.itemName}
                        </h3>
                      )}

                      {/* SKU */}
                      <p className="text-sm text-gray-500 mb-2">SKU: {item.sku}</p>

                      {/* Price */}
                      {item.product?.price && (
                        <p className="text-lg font-bold text-gray-900 mb-3">
                          {item.product.price}
                        </p>
                      )}

                      {/* Date Added */}
                      <p className="text-xs text-gray-500 mb-4">
                        Added {new Date(item.dateAdded).toLocaleDateString()}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {(item.product?.sku || item.sku) ? (
                          <Link
                            to="/product/$sku"
                            params={{ sku: item.product?.sku || item.sku }}
                            className="flex-1 px-4 py-2 bg-yellow-500 text-gray-900 rounded-md font-semibold hover:bg-yellow-400 transition-colors text-center text-sm"
                          >
                            View Product
                          </Link>
                        ) : (
                          <div className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-md font-semibold text-center text-sm">
                            View Product
                          </div>
                        )}
                        <button
                          onClick={() => handleRemove(index)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Remove from wishlist"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
