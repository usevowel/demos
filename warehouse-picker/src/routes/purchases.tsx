import { createFileRoute, useSearch, Link, useNavigate } from '@tanstack/react-router'
import { useState, useMemo, useEffect } from 'react'
import { useSnapshot } from 'valtio'
import { AppHeader, HeaderSpacer } from '@/components/AppHeader'
import { purchasesStore } from '@/store/purchases'
import { vehicleStore } from '@/store/vehicle'
import { getProducts } from '@/data/products'
import { Car, Calendar, Package, ChevronRight } from 'lucide-react'
import { getVehicleKey } from '@/vowel.client'

/**
 * Previous purchases page route
 * Displays purchase history with vehicle filtering
 */
export const Route = createFileRoute('/purchases')({
  component: PurchasesPage,
  validateSearch: (search: Record<string, unknown>) => ({
    vehicleId: search.vehicleId !== undefined ? Number(search.vehicleId) : undefined,
  }),
})

/**
 * Main purchases page component
 * Displays previous purchases with vehicle filtering
 */
function PurchasesPage() {
  const { vehicleId } = useSearch({ from: '/purchases' })
  const navigate = useNavigate()
  const purchases = useSnapshot(purchasesStore)
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
      to: '/purchases',
      search: vehicleIndex !== null ? { vehicleId: vehicleIndex } : { vehicleId: undefined },
    })
  }

  const allProducts = getProducts()

  // Filter purchases by selected vehicle
  const filteredPurchases = useMemo(() => {
    if (selectedVehicleId === null) {
      return purchases.previousPurchases
    }

    return purchases.previousPurchases.filter((purchase) => {
      const vehicle = typeof purchase.vehicle === 'string'
        ? vehicleState.vehicles.find(v => getVehicleKey(v) === purchase.vehicle)
        : purchase.vehicle

      if (!vehicle) return false

      const vehicleIndex = vehicleState.vehicles.findIndex(v => 
        v.year === vehicle.year && 
        v.make === vehicle.make && 
        v.model === vehicle.model
      )

      return vehicleIndex === selectedVehicleId
    })
  }, [purchases.previousPurchases, selectedVehicleId, vehicleState.vehicles])

  // Get product details for each purchase
  const purchasesWithProducts = useMemo(() => {
    return filteredPurchases.map((purchase) => {
      const product = allProducts.find((p) => p.sku === purchase.sku)
      const vehicle = typeof purchase.vehicle === 'string'
        ? vehicleState.vehicles.find(v => getVehicleKey(v) === purchase.vehicle)
        : purchase.vehicle

      return {
        ...purchase,
        product,
        vehicle,
      }
    })
  }, [filteredPurchases, allProducts, vehicleState.vehicles])

  // Sort purchases by date (most recent first)
  const sortedPurchases = useMemo(() => {
    return [...purchasesWithProducts].sort((a, b) => {
      return new Date(b.datePurchased).getTime() - new Date(a.datePurchased).getTime()
    })
  }, [purchasesWithProducts])

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <HeaderSpacer />
      <main className="flex-1">
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Previous Purchases</h1>
              <p className="text-gray-600">View your purchase history</p>
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

            {/* Purchases List */}
            {sortedPurchases.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No purchase history</h2>
                <p className="text-gray-600 mb-4">
                  {selectedVehicleId !== null
                    ? 'No purchases found for this vehicle.'
                    : 'You haven\'t made any purchases yet.'}
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
              <div className="space-y-4">
                {sortedPurchases.map((purchase, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      {/* Product Image */}
                      {purchase.product?.images && purchase.product.images.length > 0 && purchase.product.sku && (
                        <Link
                          to="/product/$sku"
                          params={{ sku: purchase.product.sku }}
                          className="flex-shrink-0"
                        >
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={purchase.product.images[0]}
                              alt={purchase.product.name}
                              className="w-full h-full object-contain p-2"
                            />
                          </div>
                        </Link>
                      )}

                      {/* Purchase Info */}
                      <div className="flex-1 min-w-0">
                        {/* Vehicle Badge */}
                        {purchase.vehicle && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              <Car className="w-3 h-3" />
                              {purchase.vehicle.year} {purchase.vehicle.make} {purchase.vehicle.model}
                            </span>
                          </div>
                        )}

                        {/* Product Name */}
                        {(purchase.product?.sku || purchase.sku) && (
                          <Link
                            to="/product/$sku"
                            params={{ sku: purchase.product?.sku || purchase.sku }}
                            className="block mb-2"
                          >
                            <h3 className="font-semibold text-gray-900 hover:text-yellow-500 transition-colors">
                              {purchase.product?.name || purchase.itemName}
                            </h3>
                          </Link>
                        )}
                        {!(purchase.product?.sku || purchase.sku) && (
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {purchase.product?.name || purchase.itemName}
                          </h3>
                        )}

                        {/* SKU */}
                        <p className="text-sm text-gray-500 mb-2">SKU: {purchase.sku}</p>

                        {/* Price */}
                        {purchase.product?.price && (
                          <p className="text-lg font-bold text-gray-900 mb-3">
                            {purchase.product.price}
                          </p>
                        )}

                        {/* Purchase Date */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Purchased {new Date(purchase.datePurchased).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Store */}
                        {purchase.store && (
                          <p className="text-sm text-gray-600 mb-2">Store: {purchase.store}</p>
                        )}

                        {/* Notes */}
                        {purchase.notes && (
                          <p className="text-sm text-gray-600 italic">{purchase.notes}</p>
                        )}

                        {/* View Product Link */}
                        {(purchase.product?.sku || purchase.sku) && (
                          <div className="mt-4">
                            <Link
                              to="/product/$sku"
                              params={{ sku: purchase.product?.sku || purchase.sku }}
                              className="inline-flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700 font-medium"
                            >
                              View Product
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </div>
                        )}
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
