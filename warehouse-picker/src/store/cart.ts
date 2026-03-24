import { proxy } from 'valtio'
import { persist, LocalStorageStrategy } from 'valtio-persist'
import type { Product } from '@/data/products'
import type { Vehicle } from './vehicle'

/**
 * Delivery method options for cart items
 */
export type DeliveryMethod = 'store-pickup' | 'same-day-delivery' | 'home-delivery'

/**
 * Cart item with product details and delivery method
 */
export interface CartItem {
  /** Product SKU (unique identifier) */
  sku: string
  /** Product data snapshot */
  product: Product
  /** Quantity of this item */
  quantity: number
  /** Selected delivery method for this specific item */
  deliveryMethod: DeliveryMethod
  /** Store location for store pickup (if applicable) */
  storeLocation?: string
  /** Zip code for delivery (if applicable) */
  zipCode?: string
  /** Optional vehicle reference for this item */
  vehicle?: Vehicle | string
}

/**
 * Cart state managed by valtio
 * Tracks all cart items with their individual delivery methods
 */
export interface CartState {
  /** Array of cart items */
  items: CartItem[]
  /** Whether the cart overlay is open */
  overlayOpen: boolean
  /** Applied discount code */
  discountCode: string | null
  /** Discount percentage (0-1) */
  discountPercent: number
  /** Flag indicating if the last add to cart was programmatic (to prevent Vowel from announcing) */
  isProgrammaticAdd: boolean
}

/**
 * Initial cart state
 */
const initialState: CartState = {
  items: [],
  overlayOpen: false,
  discountCode: null,
  discountPercent: 0,
  isProgrammaticAdd: false,
}

/**
 * Initialize cart store with persistence
 * Transient fields (overlayOpen, isProgrammaticAdd) will be reset on load
 */
let cartStoreInit: Promise<CartState> | null = null

async function initCartStore(): Promise<CartState> {
  if (!cartStoreInit) {
    cartStoreInit = persist(initialState, 'auto-parts:cart', {
      storageStrategy: new LocalStorageStrategy(),
    }).then((result) => {
      // Reset transient fields after hydration
      result.store.overlayOpen = false
      result.store.isProgrammaticAdd = false
      return result.store
    })
  }
  return cartStoreInit
}

/**
 * Cart store proxy - reactive state managed by valtio with persistence
 * Initialize as proxy immediately so useSnapshot works correctly
 */
export let cartStore: CartState = proxy(initialState)

// Initialize store (non-blocking) and update the proxy
initCartStore().then((store) => {
  // Update the proxy store properties instead of replacing it
  Object.assign(cartStore, store)
})

/**
 * Ensure cart store is initialized
 * This will initialize the store if it hasn't been initialized yet
 * The initCartStore function handles deduplication internally
 */
export async function ensureCartStoreInitialized(): Promise<void> {
  const store = await initCartStore()
  // Update the proxy store properties if needed
  // Only update if the store reference changed (first initialization)
  if (store !== cartStore) {
    Object.assign(cartStore, store)
  }
}

/**
 * Add a product to the cart with specified delivery method
 * @param product - Product to add
 * @param quantity - Quantity to add (default: 1)
 * @param deliveryMethod - Delivery method for this item
 * @param storeLocation - Store location for pickup (optional)
 * @param zipCode - Zip code for delivery (optional)
 */
export function addToCart(
  product: Product,
  quantity: number = 1,
  deliveryMethod: DeliveryMethod = 'store-pickup',
  storeLocation?: string,
  zipCode?: string,
  isProgrammatic: boolean = false
): void {
  // Mark this as a programmatic add (not from voice command)
  // This prevents Vowel from announcing when automation adapter detects the change
  cartStore.isProgrammaticAdd = isProgrammatic

  const existingItemIndex = cartStore.items.findIndex(
    (item) => item.sku === product.sku && item.deliveryMethod === deliveryMethod
  )

  if (existingItemIndex >= 0) {
    // Update quantity if same product with same delivery method exists
    cartStore.items[existingItemIndex].quantity += quantity
  } else {
    // Add new item
    cartStore.items.push({
      sku: product.sku || '',
      product,
      quantity,
      deliveryMethod,
      storeLocation,
      zipCode,
    })
  }
}

/**
 * Remove an item from the cart by SKU and delivery method
 * @param sku - Product SKU
 * @param deliveryMethod - Delivery method to match
 */
export function removeFromCart(sku: string, deliveryMethod: DeliveryMethod): void {
  const index = cartStore.items.findIndex(
    (item) => item.sku === sku && item.deliveryMethod === deliveryMethod
  )
  if (index >= 0) {
    cartStore.items.splice(index, 1)
  }
}

/**
 * Update quantity of a cart item
 * @param sku - Product SKU
 * @param deliveryMethod - Delivery method to match
 * @param quantity - New quantity (must be > 0)
 */
export function updateCartItemQuantity(
  sku: string,
  deliveryMethod: DeliveryMethod,
  quantity: number
): void {
  if (quantity <= 0) {
    removeFromCart(sku, deliveryMethod)
    return
  }

  const item = cartStore.items.find(
    (item) => item.sku === sku && item.deliveryMethod === deliveryMethod
  )
  if (item) {
    item.quantity = quantity
  }
}

/**
 * Update delivery method for a cart item
 * @param sku - Product SKU
 * @param oldDeliveryMethod - Current delivery method
 * @param newDeliveryMethod - New delivery method
 * @param storeLocation - Store location (if applicable)
 * @param zipCode - Zip code (if applicable)
 */
export function updateCartItemDeliveryMethod(
  sku: string,
  oldDeliveryMethod: DeliveryMethod,
  newDeliveryMethod: DeliveryMethod,
  storeLocation?: string,
  zipCode?: string
): void {
  const item = cartStore.items.find(
    (item) => item.sku === sku && item.deliveryMethod === oldDeliveryMethod
  )
  if (item) {
    // Check if item with new delivery method already exists
    const existingItem = cartStore.items.find(
      (existing) => existing.sku === sku && existing.deliveryMethod === newDeliveryMethod
    )

    if (existingItem) {
      // Merge quantities
      existingItem.quantity += item.quantity
      removeFromCart(sku, oldDeliveryMethod)
    } else {
      // Update delivery method
      item.deliveryMethod = newDeliveryMethod
      if (storeLocation !== undefined) item.storeLocation = storeLocation
      if (zipCode !== undefined) item.zipCode = zipCode
    }
  }
}

/**
 * Clear all items from the cart
 */
export function clearCart(): void {
  cartStore.items = []
}

/**
 * Get total number of items in cart
 */
export function getCartItemCount(): number {
  return cartStore.items.reduce((total, item) => total + item.quantity, 0)
}

/**
 * Get delivery cost for a specific delivery method
 * Note: For home delivery, the cost depends on the overall cart subtotal
 * @param deliveryMethod - Delivery method
 * @param subtotal - Cart subtotal (for home delivery free threshold)
 * @returns Delivery cost per item in dollars
 */
export function getDeliveryCost(
  deliveryMethod: DeliveryMethod,
  subtotal: number = 0
): number {
  switch (deliveryMethod) {
    case 'store-pickup':
      return 0 // FREE
    case 'same-day-delivery':
      return 8.99 // $8.99 per item
    case 'home-delivery':
      // Home delivery is FREE if cart subtotal (before delivery) is >= $35
      // Otherwise $5.99 per item
      return subtotal >= 35 ? 0 : 5.99
    default:
      return 0
  }
}

/**
 * Get total delivery cost for all items in cart
 * Calculates delivery costs based on the cart subtotal (for home delivery free threshold)
 */
export function getTotalDeliveryCost(): number {
  const subtotal = getCartSubtotal()
  return cartStore.items.reduce((total, item) => {
    const deliveryCost = getDeliveryCost(item.deliveryMethod, subtotal)
    return total + deliveryCost * item.quantity
  }, 0)
}

/**
 * Get subtotal price of all items in cart (before discount and delivery)
 */
export function getCartSubtotal(): number {
  return cartStore.items.reduce((total, item) => {
    const price = parseFloat(item.product.price?.replace('$', '') || '0')
    const quantity = item.quantity
    return total + price * quantity
  }, 0)
}

/**
 * Get discount amount
 */
export function getDiscountAmount(): number {
  const subtotal = getCartSubtotal()
  return subtotal * cartStore.discountPercent
}

/**
 * Get total price of all items in cart (after discount, including delivery, before tax)
 */
export function getCartTotal(): number {
  const subtotal = getCartSubtotal()
  const discount = getDiscountAmount()
  const deliveryCost = getTotalDeliveryCost()
  return subtotal - discount + deliveryCost
}

/**
 * Get tax amount (7.5% of cart total)
 */
export function getTaxAmount(): number {
  const total = getCartTotal()
  return total * 0.075 // 7.5% tax
}

/**
 * Get order total (cart total + tax) - this is the final amount the user pays
 */
export function getOrderTotal(): number {
  const total = getCartTotal()
  const tax = getTaxAmount()
  return total + tax
}

/**
 * Apply discount code
 * @param code - Discount code to apply
 * @returns true if code was applied successfully, false otherwise
 */
export function applyDiscountCode(code: string): boolean {
  // Normalize code (uppercase, trim)
  const normalizedCode = code.toUpperCase().trim()
  
  // For demo purposes, accept any code and apply 15% discount
  // In a real app, you would validate against a list of valid codes
  if (normalizedCode.length > 0) {
    cartStore.discountCode = normalizedCode
    cartStore.discountPercent = 0.15 // 15% discount
    return true
  }
  return false
}

/**
 * Remove discount code
 */
export function removeDiscountCode(): void {
  cartStore.discountCode = null
  cartStore.discountPercent = 0
}

/**
 * Toggle cart overlay visibility
 */
export function toggleCartOverlay(): void {
  cartStore.overlayOpen = !cartStore.overlayOpen
}

/**
 * Open cart overlay
 */
export function openCartOverlay(): void {
  cartStore.overlayOpen = true
}

/**
 * Close cart overlay
 */
export function closeCartOverlay(): void {
  cartStore.overlayOpen = false
}
