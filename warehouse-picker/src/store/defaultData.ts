/**
 * Default data that gets loaded when stores are reset or if no data exists in localStorage
 * This provides initial state for vehicles, wishlist items, and purchase history
 */

import type { Vehicle } from './vehicle'
import type { WishlistItem } from './wishlist'
import type { PreviousPurchase } from './purchases'

/**
 * Calculate date 4 months ago from today, with optional day adjustment
 * Used for purchase dates and service events
 * @param daysOffset - Number of days to add (positive) or subtract (negative) from the calculated date. Defaults to 0.
 * @returns ISO string representation of the date
 */
function getDateFourMonthsAgo(daysOffset: number = 0): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 4)
  // Add or subtract days
  date.setDate(date.getDate() + daysOffset)
  return date.toISOString()
}

/**
 * Default vehicles with service events
 */
export const defaultVehicles: Vehicle[] = [
  {
    type: 'Car/Truck',
    year: '2025',
    make: 'Jeep',
    model: 'Grand Cherokee',
    engine: '3.0L 2998CC V6 DIESEL',
    miles: 37000,
    serviceEvents: [
      {
        date: getDateFourMonthsAgo(-4),
        type: 'DIY Oil Change',
        description: 'Changed engine oil and filter',
        notes: 'Used Mobil 1 Advanced 0W-20 Full Synthetic',
      },
    ],
  },
  {
    type: 'Car/Truck',
    year: '2026',
    make: 'Acura',
    model: 'MDX',
    engine: '3.5L 3471CC V6 FI',
    miles: 3600,
    serviceEvents: [
      {
        date: getDateFourMonthsAgo(4),
        type: 'DIY Oil Change',
        description: 'Changed engine oil and filter',
        notes: 'Used Fram 0W-20 Full Synthetic Motor Oil',
      },
    ],
  },
]

/**
 * Default wishlist items
 * Two items per vehicle that fit each vehicle - mixed product categories
 * Note: Vehicle references will be set to actual vehicle objects when stores are initialized
 */
export const defaultWishlistItems: Omit<WishlistItem, 'vehicle'>[] = [
  // Items for 2025 Jeep Grand Cherokee (index 0)
  {
    itemName: 'Diehard Platinum Agm Battery H7 Group Size 4 Year Warranty 850 Cca 1000 Ca 140 Minute Reserve Capacity H7',
    sku: 'H7-AGM',
    dateAdded: getDateFourMonthsAgo(-12),
  },
  {
    itemName: 'Carquest Premium Gold Brake Pads With Hardware Ceramic Long Life And Quiet Front Gnad1324C',
    sku: 'GNAD1324C',
    dateAdded: getDateFourMonthsAgo(24),
  },
  // Items for 2026 Acura MDX (index 1)
  {
    itemName: 'DieHard Platinum AGMBattery: H6 Group Size, 4 Year Warranty,  760 CCA,  950 CA,  120 Minute Reserve Capacity',
    sku: 'H6-AGM',
    dateAdded: getDateFourMonthsAgo(-4),
  },
  {
    itemName: 'Carquest Premium Gold Brake Pads With Hardware Ceramic Long Life And Quiet Front Gnad1414',
    sku: 'GNAD1414',
    dateAdded: getDateFourMonthsAgo(14),
  },
]

/**
 * Default previous purchases
 * Engine oil for each vehicle purchased 4 months ago
 */
export const defaultPreviousPurchases: PreviousPurchase[] = [
  // Purchase for 2025 Jeep Grand Cherokee (index 0)
  {
    vehicle: defaultVehicles[0],
    itemName: 'Mobil 1 Advanced 0W 20 Full Synthetic Engine Oil Improves Fuel Economy 1 Quart 44968',
    sku: 'OIL-110035',
    datePurchased: getDateFourMonthsAgo(-4),
    notes: 'Used for DIY oil change',
  },
  // Purchase for 2026 Acura MDX (index 1)
  {
    vehicle: defaultVehicles[1],
    itemName: 'Fram 0W 20 Full Synthetic Motor Oil Faster Oil Flow 1 Quart',
    sku: 'OIL-260562',
    datePurchased: getDateFourMonthsAgo(4),
    notes: 'Used for DIY oil change',
  },
]
