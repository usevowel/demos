/**
 * Product data loader
 * Loads and parses the auto-parts.json file
 */

import autoPartsData from '../../data/auto-parts.json'

/**
 * Product type definition based on auto-parts.json structure
 */
export interface Product {
  name: string
  price?: string
  images?: string[]
  sku?: string
  category: string
  url: string
  product_details?: string
  product_features?: string[]
  specifications?: Record<string, string>
  sale_discount?: number
  /** Vehicle fit mapping: vehicle key (e.g., "2025-Jeep-Grand Cherokee Overland") -> boolean */
  vehicleFit?: Record<string, boolean>
}

/**
 * Get products synchronously from imported JSON data
 */
export function getProducts(): Product[] {
  const data = autoPartsData as unknown as { products: Product[] }
  return data.products || []
}
