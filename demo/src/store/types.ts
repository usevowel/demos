/**
 * Type definitions for the demo app's domain models
 */

/**
 * User account in the system
 */
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'user'
  createdAt: Date
  lastLogin?: Date
}

/**
 * Product in the e-commerce catalog
 */
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  inStock: boolean
  rating: number
  reviews: number
  onSale?: boolean
  discountPercent?: number
  originalPrice?: number
  tags?: string[]
}

/**
 * Item in the shopping cart
 */
export interface CartItem {
  productId: string
  quantity: number
}

/**
 * User's shopping cart
 */
export interface UserCart {
  userId: string
  items: CartItem[]
  updatedAt: Date
}

/**
 * Authentication state
 */
export interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
}
