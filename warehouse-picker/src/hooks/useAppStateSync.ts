/**
 * Hook that automatically syncs application state to Vowel's dynamic context
 * Uses the useSyncContext hook from @vowel.to/client to automatically update
 * the AI's context whenever stores change.
 */

import { useMemo } from 'react'
import { useSnapshot } from 'valtio'
import { useSyncContext } from '@vowel.to/client/react'
import { cartStore, getCartItemCount, getCartSubtotal, getCartTotal, getDiscountAmount, getTotalDeliveryCost, getTaxAmount, getOrderTotal } from '@/store/cart'
import { vehicleStore } from '@/store/vehicle'
import { wishlistStore } from '@/store/wishlist'
import { purchasesStore } from '@/store/purchases'
import { userStore } from '@/store/user'

/**
 * Hook that syncs all app state stores to Vowel's dynamic context
 * This replaces the manual subscription approach - the hook automatically
 * updates context whenever any of the stores change.
 */
export function useAppStateSync() {
  // Get reactive snapshots of all stores
  const cart = useSnapshot(cartStore)
  const vehicle = useSnapshot(vehicleStore)
  const wishlist = useSnapshot(wishlistStore)
  const purchases = useSnapshot(purchasesStore)
  const user = useSnapshot(userStore)

  // Build context object from current store state
  const context = useMemo(() => {
    // Get selected vehicle from the snapshot (reactive)
    const selectedVehicle = vehicle.selectedVehicleId !== null && vehicle.selectedVehicleId >= 0 && vehicle.selectedVehicleId < vehicle.vehicles.length
      ? vehicle.vehicles[vehicle.selectedVehicleId]
      : null
    return {
      user: user.user ? {
        name: user.user.name,
        email: user.user.email,
      } : null,
      cart: {
        items: cart.items.map(item => ({
          sku: item.sku,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          deliveryMethod: item.deliveryMethod,
          storeLocation: item.storeLocation,
          zipCode: item.zipCode,
        })),
        itemCount: getCartItemCount(),
        subtotal: getCartSubtotal().toFixed(2),
        discountCode: cart.discountCode,
        discountPercent: cart.discountPercent,
        discountAmount: getDiscountAmount().toFixed(2),
        totalDeliveryCost: getTotalDeliveryCost().toFixed(2),
        tax: getTaxAmount().toFixed(2),
        total: getCartTotal().toFixed(2),
        orderTotal: getOrderTotal().toFixed(2),
        overlayOpen: cart.overlayOpen,
      },
      vehicle: {
        selectedVehicle: selectedVehicle ? {
          type: selectedVehicle.type,
          year: selectedVehicle.year,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
          engine: selectedVehicle.engine,
          vin: selectedVehicle.vin,
          licensePlate: selectedVehicle.licensePlate,
          miles: selectedVehicle.miles,
          notes: selectedVehicle.notes,
          serviceEvents: selectedVehicle.serviceEvents,
        } : null,
        selectedVehicleId: vehicle.selectedVehicleId,
        vehicles: vehicle.vehicles.map(v => ({
          type: v.type,
          year: v.year,
          make: v.make,
          model: v.model,
          engine: v.engine,
          vin: v.vin,
          licensePlate: v.licensePlate,
          miles: v.miles,
          notes: v.notes,
          serviceEvents: v.serviceEvents,
        })),
        vehicleCount: vehicle.vehicles.length,
        modalOpen: vehicle.modalOpen,
      },
      wishlist: {
        items: wishlist.wishlistItems.map(item => ({
          vehicle: typeof item.vehicle === 'string' 
            ? item.vehicle 
            : `${item.vehicle.year} ${item.vehicle.make} ${item.vehicle.model}`,
          itemName: item.itemName,
          sku: item.sku,
          dateAdded: item.dateAdded,
          notes: item.notes,
        })),
        itemCount: wishlist.wishlistItems.length,
      },
      purchases: {
        purchases: purchases.previousPurchases.map(purchase => ({
          vehicle: typeof purchase.vehicle === 'string'
            ? purchase.vehicle
            : `${purchase.vehicle.year} ${purchase.vehicle.make} ${purchase.vehicle.model}`,
          itemName: purchase.itemName,
          sku: purchase.sku,
          datePurchased: purchase.datePurchased,
          notes: purchase.notes,
        })),
        purchaseCount: purchases.previousPurchases.length,
      },
    }
  }, [cart, vehicle, wishlist, purchases, user])

  // Sync context to Vowel - automatically updates when context changes
  useSyncContext(context)
}
