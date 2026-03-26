/**
 * Valtio store for shopping cart management
 * Provides cart operations and persists cart state per user
 */

import { proxy } from 'valtio'
import type { CartItem, UserCart } from './types'
import { getProductById, getProducts } from './productsStore'
import { authStore } from './authStore'
import { getUsers } from './usersStore'

interface CartState {
  // Current user's cart (for backwards compatibility)
  items: CartItem[]
  // All users' carts (for admin view)
  userCarts: UserCart[]
}

export const cartStore = proxy<CartState>({
  items: [],
  userCarts: [],
})

/**
 * Initialize carts with items for demo purposes
 * Distributes products evenly across non-admin users with realistic quantities
 */
function initializeDemoCarts() {
  const users = getUsers()
  const products = getProducts()
  
  // Filter to only non-admin users (admins don't have carts)
  const nonAdminUsers = users.filter(user => user.role !== 'admin')
  
  if (nonAdminUsers.length === 0 || products.length === 0) {
    return
  }
  
  // Filter to only in-stock products
  const inStockProducts = products.filter(p => p.inStock)
  
  if (inStockProducts.length === 0) {
    return
  }
  
  // Distribute products evenly across users using round-robin
  // Each user gets 4-6 products with different sets
  const carts: UserCart[] = nonAdminUsers.map((user, userIndex) => {
    const items: CartItem[] = []
    
    // Each user gets 4-6 products (randomized for variety)
    const productsPerUser = 4 + Math.floor(Math.random() * 3) // 4, 5, or 6 products
    
    // Distribute products in round-robin fashion, starting at different offsets per user
    const startOffset = Math.floor((inStockProducts.length / nonAdminUsers.length) * userIndex)
    const usedProductIds = new Set<string>()
    
    for (let i = 0; i < productsPerUser && items.length < productsPerUser; i++) {
      // Calculate product index with round-robin distribution
      const baseIndex = (startOffset + i * nonAdminUsers.length) % inStockProducts.length
      let productIndex = baseIndex
      let attempts = 0
      
      // Find a product we haven't used yet (with fallback to avoid infinite loop)
      while (usedProductIds.has(inStockProducts[productIndex].id) && attempts < inStockProducts.length) {
        productIndex = (productIndex + 1) % inStockProducts.length
        attempts++
      }
      
      const product = inStockProducts[productIndex]
      usedProductIds.add(product.id)
      
      // Random quantity between 1 and 3
      const quantity = Math.floor(Math.random() * 3) + 1
      items.push({
        productId: product.id,
        quantity,
      })
    }
    
    return {
      userId: user.id,
      items,
      updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
    }
  })
  
  cartStore.userCarts = carts
  console.log(`🛒 Initialized ${carts.length} demo carts with items`)
  carts.forEach(cart => {
    console.log(`  User ${cart.userId}: ${cart.items.length} items`)
  })
}

// Initialize carts when store is created
initializeDemoCarts()

/**
 * Get current user's cart from userCarts or legacy items
 * Admins don't have their own cart
 */
const getCurrentUserCart = (): CartItem[] => {
  const currentUserId = authStore.currentUser?.id
  const isAdmin = authStore.currentUser?.role === 'admin'
  
  // Admins don't have shopping carts
  if (isAdmin) return []
  
  if (!currentUserId) return cartStore.items

  const userCart = cartStore.userCarts.find(uc => uc.userId === currentUserId)
  return userCart ? userCart.items : []
}

/**
 * Update current user's cart in userCarts
 * Admins cannot modify their own cart (they don't have one)
 */
const updateCurrentUserCart = (items: CartItem[]) => {
  const currentUserId = authStore.currentUser?.id
  const isAdmin = authStore.currentUser?.role === 'admin'
  
  // Admins don't have shopping carts
  if (isAdmin) return
  
  if (!currentUserId) {
    cartStore.items = items
    return
  }

  const userCartIndex = cartStore.userCarts.findIndex(uc => uc.userId === currentUserId)
  if (userCartIndex !== -1) {
    cartStore.userCarts[userCartIndex].items = items
    cartStore.userCarts[userCartIndex].updatedAt = new Date()
  } else {
    cartStore.userCarts.push({
      userId: currentUserId,
      items,
      updatedAt: new Date(),
    })
  }
  
  // Keep legacy items in sync
  cartStore.items = items
}

/**
 * Get all items in current user's cart
 */
export const getCartItems = () => {
  return getCurrentUserCart()
}

/**
 * Get all users' carts (admin only)
 */
export const getAllUserCarts = () => {
  return cartStore.userCarts
}

/**
 * Get cart items with full product details
 */
export const getCartWithProducts = () => {
  const items = getCurrentUserCart()
  return items.map(item => ({
    ...item,
    product: getProductById(item.productId),
  })).filter(item => item.product !== undefined)
}

/**
 * Get total number of items in cart
 */
export const getCartCount = () => {
  const items = getCurrentUserCart()
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

/**
 * Get cart total price
 */
export const getCartTotal = () => {
  const items = getCurrentUserCart()
  return items.reduce((sum, item) => {
    const product = getProductById(item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)
}

/**
 * Get cart for specific user (admin only)
 */
export const getUserCart = (userId: string) => {
  const userCart = cartStore.userCarts.find(uc => uc.userId === userId)
  return userCart ? userCart.items : []
}

/**
 * Get cart with products for specific user (admin only)
 */
export const getUserCartWithProducts = (userId: string) => {
  const items = getUserCart(userId)
  return items.map(item => ({
    ...item,
    product: getProductById(item.productId),
  })).filter(item => item.product !== undefined)
}

/**
 * Get cart total for specific user (admin only)
 */
export const getUserCartTotal = (userId: string) => {
  const items = getUserCart(userId)
  return items.reduce((sum, item) => {
    const product = getProductById(item.productId)
    return sum + (product ? product.price * item.quantity : 0)
  }, 0)
}

/**
 * Add item to cart or increase quantity if already exists
 */
export const addToCart = (productId: string, quantity: number = 1) => {
  const items = [...getCurrentUserCart()]
  const existingItem = items.find(item => item.productId === productId)
  
  if (existingItem) {
    existingItem.quantity += quantity
  } else {
    items.push({ productId, quantity })
  }
  
  updateCurrentUserCart(items)
}

/**
 * Update item quantity in cart
 */
export const updateCartItemQuantity = (productId: string, quantity: number) => {
  if (quantity <= 0) {
    removeFromCart(productId)
    return
  }
  
  const items = [...getCurrentUserCart()]
  const item = items.find(item => item.productId === productId)
  
  if (item) {
    item.quantity = quantity
    updateCurrentUserCart(items)
  }
}

/**
 * Remove item from cart
 */
export const removeFromCart = (productId: string) => {
  const items = getCurrentUserCart().filter(item => item.productId !== productId)
  updateCurrentUserCart(items)
}

/**
 * Clear all items from cart
 */
export const clearCart = () => {
  updateCurrentUserCart([])
}

