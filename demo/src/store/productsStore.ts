/**
 * Valtio store for product management
 * Provides CRUD operations for products and maintains seeded mock data
 */

import { proxy } from 'valtio'
import type { Product } from './types'
import seedProductsData from '@/data/products.json'

interface ProductsState {
  products: Product[]
  loading: boolean
  error: string | null
}

/**
 * Seeded product data loaded from JSON
 * Convert readonly arrays to mutable arrays for tags
 */
const seedProducts: Product[] = seedProductsData.map(product => ({
  ...product,
  tags: product.tags ? [...product.tags] : undefined
})) as Product[]

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'find',
  'me',
  'my',
  'please',
  'product',
  'products',
  'search',
  'show',
  'the',
  'to',
  'with',
])

export const CATEGORY_SEARCH_ALIASES: Record<string, string[]> = {
  Electronics: ['electronics', 'electronic', 'computer', 'computers', 'device', 'devices', 'gadget', 'gadgets', 'tech', 'tech gear'],
  Accessories: ['accessories', 'accessory', 'peripheral', 'peripherals'],
  Storage: ['storage'],
}

export const PRODUCT_SEARCH_QUICK_FILTERS = [
  { label: 'Electronics', query: 'electronics' },
  { label: 'Accessories', query: 'accessories' },
  { label: 'Storage', query: 'storage' },
  { label: 'Charging', query: 'charging' },
  { label: 'USB-C', query: 'usb c' },
  { label: 'SSDs', query: 'ssd' },
  { label: 'Wireless', query: 'wireless' },
] as const

const SEARCH_TERM_EQUIVALENTS: Record<string, string[]> = {
  charger: ['charging'],
  chargers: ['charging'],
  smartwatch: ['watch'],
  smartwatches: ['watch'],
}

export const productsStore = proxy<ProductsState>({
  products: [...seedProducts],
  loading: false,
  error: null,
})

/**
 * Get all products
 */
export const getProducts = () => {
  return productsStore.products
}

/**
 * Get product by ID
 */
export const getProductById = (id: string) => {
  return productsStore.products.find(product => product.id === id)
}

/**
 * Search products by query and filters
 */
function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSignificantSearchTerms(query: string): string[] {
  return normalizeSearchText(query)
    .split(' ')
    .filter(term => term && !SEARCH_STOP_WORDS.has(term))
}

function getSearchTokenVariants(token: string): string[] {
  const variants = new Set([token])

  if (token.endsWith('ies') && token.length > 4) {
    variants.add(`${token.slice(0, -3)}y`)
  }

  if (token.endsWith('es') && token.length > 4 && !token.endsWith('sses')) {
    variants.add(token.slice(0, -2))
  }

  if (token.endsWith('s') && token.length > 3 && !token.endsWith('ss')) {
    variants.add(token.slice(0, -1))
  }

  for (const variant of Array.from(variants)) {
    for (const equivalent of SEARCH_TERM_EQUIVALENTS[variant] ?? []) {
      variants.add(equivalent)
    }
  }

  return Array.from(variants)
}

function tokenizeSearchText(value: string): string[] {
  return normalizeSearchText(value)
    .split(' ')
    .filter(Boolean)
}

function getCanonicalCategoryMatch(query: string): string | null {
  const simplifiedQuery = getSignificantSearchTerms(query).join(' ')

  if (!simplifiedQuery) {
    return null
  }

  for (const [category, aliases] of Object.entries(CATEGORY_SEARCH_ALIASES)) {
    const candidates = [category, ...aliases].map(normalizeSearchText)
    if (candidates.includes(simplifiedQuery)) {
      return normalizeSearchText(category)
    }
  }

  return null
}

function buildProductSearchTokenSet(product: Product): Set<string> {
  return new Set(
    [
      product.name,
      product.description,
      product.category,
      ...(product.tags ?? []),
    ]
      .flatMap(tokenizeSearchText)
      .flatMap(getSearchTokenVariants)
  )
}

function getProductSearchDocument(product: Product): string {
  return [
    product.name,
    product.description,
    product.category,
    ...(product.tags ?? []),
  ]
    .map(normalizeSearchText)
    .join(' ')
}

export const searchProducts = (params: {
  query?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  onSale?: boolean
}) => {
  let filtered = [...productsStore.products]

  if (params.query) {
    const normalizedQuery = normalizeSearchText(params.query)
    const significantTerms = getSignificantSearchTerms(params.query)
    const canonicalCategoryMatch = getCanonicalCategoryMatch(params.query)

    if (significantTerms.length > 0 || canonicalCategoryMatch) {
      filtered = filtered.filter(product => {
        const searchDocument = getProductSearchDocument(product)
        const searchTokens = buildProductSearchTokenSet(product)

        return (
          searchDocument.includes(normalizedQuery) ||
          significantTerms.every(term => getSearchTokenVariants(term).some(variant => searchTokens.has(variant))) ||
          (canonicalCategoryMatch !== null && normalizeSearchText(product.category) === canonicalCategoryMatch)
        )
      })
    }
  }

  if (params.minPrice !== undefined) {
    filtered = filtered.filter(product => product.price >= params.minPrice!)
  }

  if (params.maxPrice !== undefined) {
    filtered = filtered.filter(product => product.price <= params.maxPrice!)
  }

  if (params.inStock !== undefined) {
    filtered = filtered.filter(product => product.inStock === params.inStock)
  }

  if (params.onSale !== undefined) {
    filtered = filtered.filter(product => product.onSale === params.onSale)
  }

  return filtered
}

/**
 * Get all unique categories
 */
export const getCategories = () => {
  const categories = new Set(productsStore.products.map(p => p.category))
  return Array.from(categories).sort((a, b) => a.localeCompare(b))
}

/**
 * Create a new product
 */
export const createProduct = (productData: Omit<Product, 'id'>) => {
  const newProduct: Product = {
    ...productData,
    id: String(productsStore.products.length + 1),
  }
  productsStore.products.push(newProduct)
  return newProduct
}

/**
 * Update an existing product
 */
export const updateProduct = (id: string, updates: Partial<Product>) => {
  const productIndex = productsStore.products.findIndex(product => product.id === id)
  if (productIndex !== -1) {
    productsStore.products[productIndex] = {
      ...productsStore.products[productIndex],
      ...updates,
    }
    return productsStore.products[productIndex]
  }
  return null
}

/**
 * Delete a product
 */
export const deleteProduct = (id: string) => {
  const productIndex = productsStore.products.findIndex(product => product.id === id)
  if (productIndex !== -1) {
    productsStore.products.splice(productIndex, 1)
    return true
  }
  return false
}
