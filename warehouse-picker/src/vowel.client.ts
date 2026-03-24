import { Vowel, createTanStackAdapters } from '@vowel.to/client'
import { router } from './router'
import { 
  addToCart as addToCartStore, 
  removeFromCart, 
  updateCartItemQuantity, 
  updateCartItemDeliveryMethod,
  applyDiscountCode,
  removeDiscountCode,
  clearCart,
  openCartOverlay,
  closeCartOverlay,
  getCartItemCount,
  getCartSubtotal,
  getCartTotal,
  getDiscountAmount,
  getTotalDeliveryCost,
  getTaxAmount,
  getOrderTotal,
  cartStore,
  type DeliveryMethod
} from './store/cart'
import {
  openVehicleModal,
  closeVehicleModal,
  setSelectedVehicleById,
  // addVehicle,
  getSelectedVehicle,
  vehicleStore,
  // type Vehiclrese,
  type VehicleType,
  type ServiceEvent
} from './store/vehicle'
import { wishlistStore, addToWishlist, removeFromWishlist } from './store/wishlist'
import { purchasesStore } from './store/purchases'
import { getProducts, type Product } from './data/products'

/**
 * Toggle to use alternative voice providers.
 * When enabled, can connect to alternative voice APIs.
 * When disabled (default), uses vowel.to's hosted voice service.
 */
const USE_ALTERNATIVE_PROVIDER = false

/**
 * VAD Configuration - Domain-Based Detection
 * Automatically detects which VAD mode to use based on the domain:
 * - Domains ending with '-svr.vowel.to' → server-side VAD (for older devices)
 * - Standard domains → client-side VAD (default)
 * 
 * This allows the same codebase to serve both variants:
 * - sales-autoparts-demo.vowel.to → client-side VAD
 * - sales-autoparts-demo-svr.vowel.to → server-side VAD
 */
// const USE_SERVER_VAD = typeof window !== 'undefined' && window.location.hostname.endsWith('-svr.vowel.to')
const USE_SERVER_VAD = true;

/**
 * Generate vehicle key for fit lookup
 * Format: "year-make-model"
 */
export function getVehicleKey(vehicle: {
  year: string
  make: string
  model: string
} | null): string {
  if (!vehicle) return ''
  return `${vehicle.year}-${vehicle.make}-${vehicle.model}`
}

/**
 * Helper function to check if a product fits a vehicle
 * Uses vehicleFit data from product JSON, or generates deterministic fit for new vehicles
 */
export function checkProductFitsVehicle(product: Product, vehicle: {
  type: VehicleType
  year: string
  make: string
  model: string
  engine: string
  vin?: string
  licensePlate?: string
  miles?: number
  notes?: string
  serviceEvents?: readonly ServiceEvent[] | ServiceEvent[]
} | null): boolean {
  if (!vehicle) return false
  
  const vehicleKey = getVehicleKey(vehicle)
  
  // Check if we have fit data for this vehicle in the product
  if (product.vehicleFit) {
    // First try exact match
    if (vehicleKey in product.vehicleFit) {
      const fits = product.vehicleFit[vehicleKey] === true
      if (import.meta.env.DEV) {
        console.log(`[Vehicle Fit] Exact match for "${vehicleKey}": ${fits}`, {
          product: product.sku || product.name,
          vehicleKey,
          vehicleFit: product.vehicleFit[vehicleKey],
        })
      }
      return fits
    }
    
    // Try case-insensitive match as fallback
    const matchingKey = Object.keys(product.vehicleFit).find(
      key => key.toLowerCase() === vehicleKey.toLowerCase()
    )
    if (matchingKey) {
      const fits = product.vehicleFit[matchingKey] === true
      if (import.meta.env.DEV) {
        console.log(`[Vehicle Fit] Case-insensitive match for "${vehicleKey}" -> "${matchingKey}": ${fits}`, {
          product: product.sku || product.name,
          vehicleKey,
          matchingKey,
          vehicleFit: product.vehicleFit[matchingKey],
        })
      }
      return fits
    }
  }
  
  // For vehicles not in the default list, generate deterministic fit based on SKU and vehicle
  // This ensures consistent fit status for the same product/vehicle combination
  if (product.sku) {
    const combined = `${product.sku}-${vehicleKey}`
    const fitHash = combined.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const fits = fitHash % 2 === 0 // 50% chance of fitting
    if (import.meta.env.DEV) {
      console.log(`[Vehicle Fit] Deterministic hash for "${vehicleKey}": ${fits}`, {
        product: product.sku || product.name,
        vehicleKey,
        combined,
        fitHash,
      })
    }
    return fits
  }
  
  if (import.meta.env.DEV) {
    console.log(`[Vehicle Fit] No fit data and no SKU for "${vehicleKey}": false`, {
      product: product.name,
      vehicleKey,
      hasVehicleFit: !!product.vehicleFit,
      hasSku: !!product.sku,
    })
  }
  return false
}

/**
 * Create TanStack Router adapters for navigation and automation
 * These enable voice-controlled navigation and page interaction
 */
// @ts-ignore
const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router: router as any, // Type assertion needed due to React type version conflicts
  enableAutomation: true, // Enable voice-controlled page interaction
})


/**
 * Get App ID from environment variable
 * Set VITE_VOWEL_APP_ID in your .env file
 */
const appId = (import.meta.env as { VITE_VOWEL_APP_ID?: string }).VITE_VOWEL_APP_ID || ''

if (!appId) {
  console.warn(
    '⚠️ VOWEL_APP_ID not found. Please set VITE_VOWEL_APP_ID in your .env file. Voice features will be disabled.'
  )
}

/**
 * Vowel client instance configured for auto parts demo
 * 
 * Features:
 * - Voice-controlled navigation between pages
 * - Voice-controlled page interaction (click, search, etc.)
 * - Comprehensive custom actions for product search, filtering, cart management, and vehicle management
 */
export const vowel = appId
  ? new Vowel({
      appId: appId,

      // System instructions for the AI agent
      instructions: `You are a helpful assistant for an auto parts e-commerce website (Auto Parts Warehouse).

## CRITICAL: Always Refer to Context for Information
**⚠️ IMPORTANT**: Before answering ANY question or performing ANY action, ALWAYS check the <context> section for current information. Never rely on memory or assumptions. The context contains the most up-to-date state of the application.

**When to use context:**
- User asks "what's in my cart?" → Check context.cart
- User asks "what vehicle is selected?" → Check context.vehicle.selectedVehicle
- User asks "show my wishlist" → Check context.wishlist
- User asks about purchases → Check context.purchases
- User asks about their name or account → Check context.user
- User wants to add to cart → Check context.cart first to see what's already there
- User asks about vehicle compatibility → Check context.vehicle.selectedVehicle first
- ANY question about current state → Check context first

**The context is always accurate and up-to-date** - it's automatically refreshed whenever the user makes changes. The user may make changes between conversation turns, so always check the context instead of conversation history. Trust the context as your single source of truth.

## Current Application State:
The current state of the application (user, cart, vehicle, wishlist, purchases) is automatically provided in the <context> section. You always have access to the latest state - no need to call any actions to read it. The context is automatically updated whenever the user makes changes (adds items to cart, selects vehicles, etc.).

## State Management:
- **User state**: Always available in context.user - includes user name (context.user.name) and email (context.user.email)
- **Cart state**: Always available in context.cart - includes items, quantities, totals, discount codes, delivery methods
- **Vehicle state**: Always available in context.vehicle - includes selected vehicle (context.vehicle.selectedVehicle) and all vehicles (context.vehicle.vehicles)
  - Check vehicle count: context.vehicle.vehicleCount
  - List all vehicles: context.vehicle.vehicles (array of vehicle objects)
  - Selected vehicle: context.vehicle.selectedVehicle
- **Wishlist**: Always available in context.wishlist - includes all saved items with associated vehicles
- **Purchases**: Always available in context.purchases - includes purchase history with associated vehicles

You MUST reference this state directly when responding to users. For example:
- "Welcome back, {context.user.name}" or "Hello {context.user.name}"
- "Your cart has {context.cart.itemCount} items" or "Your cart contains {context.cart.items.length} items"
- "Your selected vehicle is {context.vehicle.selectedVehicle.year} {context.vehicle.selectedVehicle.make} {context.vehicle.selectedVehicle.model}"
- "You have {context.vehicle.vehicleCount} registered vehicles" or "You have {context.vehicle.vehicles.length} vehicles"
- To list all vehicles: "Your registered vehicles are: {context.vehicle.vehicles[0].year} {context.vehicle.vehicles[0].make} {context.vehicle.vehicles[0].model}, {context.vehicle.vehicles[1].year} {context.vehicle.vehicles[1].make} {context.vehicle.vehicles[1].model}"
- "You have {context.wishlist.itemCount} items in your wishlist"
- "You have {context.purchases.purchaseCount} previous purchases"

The context is always up-to-date - whenever the user adds items, changes vehicles, or makes any changes, the context is automatically refreshed. You can trust the context as the source of truth.

## Language Guidelines:
- **Tool Calls**: All tool calls (searchProducts, filterProductsByCategory, addToCart, etc.) and their parameters MUST be in English, regardless of what language the user is speaking
- **User Responses**: Respond to the user in whatever language they are speaking. Match their language naturally and fluently
- **Examples**: 
  - If user says "buscar baterías" (Spanish), call searchProducts with query="batteries" (English), but respond "Buscando baterías" (Spanish)
  - If user says "rechercher des produits" (French), call searchProducts with query="products" (English), but respond "Recherche de produits en cours" (French)

## Response Guidelines:
- **Keep responses extremely concise**: Always respond with exactly three sentences maximum. Be terse and to the point.
- **Limit result reading**: When search results contain many options (e.g., 20 batteries), only read the first three results. Do not read all options.
- **Prioritize clarity**: If information is extensive, summarize the most important points rather than listing everything.
- **Number reading**: When reading numbers aloud that are NOT currency, phone numbers, or product SKUs, read them as words using thousands and hundreds. Examples:
  - 36000 → "thirty-six thousand" (not "thirty-six-zero-zero-zero" or "thirty-six thousand zero")
  - 37000 → "thirty-seven thousand"
  - 3600 → "three thousand six hundred" (not "three-six-zero-zero")
  - 125 → "one hundred twenty-five"
  - DO read currency as numbers: "$259.99" → "two hundred fifty-nine dollars and ninety-nine cents"
  - DO read SKUs as individual characters/numbers: "H6-AGM" → "H six A G M" or "H six dash A G M"
  - DO read phone numbers digit by digit: "32250" as phone → "three-two-two-five-zero"

## Availability Guidelines:
- **Steer users to available options**: If a user asks for something that is not available (e.g., a different vehicle, a product that doesn't exist, a brand not in inventory, a category not offered, a delivery option not available), politely redirect them to what is available. Never mention that this is a demo or that values are hard-coded. Instead, simply state that only certain options are available and guide them to those options.
- **Vehicle availability**: Check context.vehicle.vehicles to see what vehicles the user has registered. If a user asks about a different vehicle that's not in their registered list, redirect them to search for parts for their registered vehicles. Example: "I can help you find parts for your registered vehicles. Would you like to search for parts for your {context.vehicle.vehicles[0].year} {context.vehicle.vehicles[0].make} {context.vehicle.vehicles[0].model}?"
- **Product availability**: If a user asks for a product, brand, or category that isn't available, redirect them to what is available. Example: "That product isn't currently available. Would you like to see what we have in stock instead?"
- **Delivery availability**: If a user asks for a delivery option that isn't available, redirect them to the available delivery methods (store-pickup, same-day-delivery, home-delivery).

## Available Application Stores:
The application maintains state in several stores that are automatically provided in the <context> section:
- **cart**: Shopping cart with items, quantities, delivery methods, discount codes, and totals (context.cart)
- **vehicle**: Vehicle information including selected vehicle, all vehicles, vehicle details (context.vehicle)
- **wishlist**: Saved wishlist items with associated vehicles, item names, SKUs, dates added, and notes (context.wishlist)
- **purchases**: Previous purchase history with items, associated vehicles, purchase dates, and notes (context.purchases)

## Available Routes:
- Home (/): Landing page with product categories, featured products, and product listings. Use /?l=1 to show logo.
- Category/Search (/category): Product catalog with filtering. Use query params: ?category=batteries, ?q=search-term, ?page=1
- Product Details (/product/:sku): View detailed product information, specifications, and purchase options
- Cart (/cart): Shopping cart page with order summary and checkout options

## Available Tools:

### Products:
- searchProducts: Search for products by name, SKU, or category. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page with search results. Parameters: query (search term).
- viewProduct: Navigate to a product detail page. Use this when user asks about a specific product from search results. Parameters: productId (product SKU or product name).
- filterProductsByCategory: Filter products by category. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page with category filter applied. Parameters: category (batteries, brakepads, rotors, oil, oil_filters, clearance). Accepts variations like "battery" for "batteries".
- filterProductsByBrand: Filter products by brand name. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page showing products from that brand. Parameters: brand (e.g., DieHard, OPTIMA, Carquest, Bosch).
- filterProductsByMinPrice: Filter products by minimum price. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page. Parameters: minPrice (number).
- filterProductsByMaxPrice: Filter products by maximum price. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page. Parameters: maxPrice (number).
- filterProductsByPriceRange: Filter products by price range. Automatically filters by vehicle compatibility if a vehicle is selected. Navigates to category page. Parameters: minPrice (number), maxPrice (number). Both parameters are required.

### Cart Management:
- addToCart: Add a product to cart. Parameters: productId (SKU), quantity (number), deliveryMethod (store-pickup|same-day-delivery|home-delivery). Both quantity and deliveryMethod are required.
- removeFromCart: Remove an item from cart. Parameters: productId (SKU), deliveryMethod (store-pickup|same-day-delivery|home-delivery).
- updateCartItemQuantity: Update quantity of a cart item. Parameters: productId (SKU), deliveryMethod (store-pickup|same-day-delivery|home-delivery), quantity (number).
- updateCartItemDeliveryMethod: Change delivery method for a cart item. Parameters: productId (SKU), oldDeliveryMethod, newDeliveryMethod (store-pickup|same-day-delivery|home-delivery).
- applyDiscountCode: Apply a discount code to the cart. Parameters: code (string).
- removeDiscountCode: Remove the applied discount code from cart.
- clearCart: Remove all items from the shopping cart.
- getCartSummary: Show cart contents. Navigates to cart page to display cart summary.
- openCartOverlay: Open the cart overlay sidebar.
- closeCartOverlay: Close the cart overlay sidebar.

### Vehicle Management:
- openVehicleSelector: Open the vehicle selector modal.
- closeVehicleSelector: Close the vehicle selector modal.
- selectVehicle: Select a vehicle by index. Parameters: vehicleId (number, 0-based index).

### Wishlist Management:
- addToWishlist: Add a product to the wishlist for the currently selected vehicle. **Check context.vehicle.selectedVehicle to verify a vehicle is selected, and context.wishlist to see current wishlist state.** Parameters: productId (string, product SKU or name).
- removeFromWishlist: Remove a product from the wishlist by SKU. Removes the item for the currently selected vehicle. **Check context.wishlist to see current wishlist contents.** Parameters: productId (string, product SKU).
- viewWishlist: Navigate to the wishlist page to view all saved wishlist items. Shows the main wishlist with no vehicle filtering. Parameters: none.

### Purchase History:
- viewPurchases: Navigate to the previous purchases page to view purchase history. Parameters: none.

## How to Use:
**IMPORTANT: Default to "show me" paradigm - navigate to pages to show information rather than just describing it.**

**CRITICAL WORKFLOW**: The current application state is always available in the <context> section. Reference context.cart, context.vehicle, context.wishlist, and context.purchases directly - no need to call any actions to read state. The context is automatically updated whenever the user makes changes.

- To navigate: Say "go to home", "show products", "go to cart", "show category batteries", "open product [SKU]"
- To search: Say "search for [query]" (e.g., "search for battery", "find H6-AGM battery") - navigates to category page with results
- To view product details: When user asks about a product from search results, use viewProduct to navigate to the product detail page. Say "show me [product name]", "open [product name]", "view [product name]", or "tell me more about [product name]"
- To filter by category: Say "show batteries", "show me batteries", "filter by batteries", "show brake pads" - navigates to category page with filter applied
- To filter by brand/price: Say "filter by brand DieHard", "show products under $50" - navigates to category page
- To add to cart: Say "add [product name] to cart", "add product [SKU] to cart with quantity 2" - **Check context.cart to see current cart state, then add items**
- To manage cart: Say "remove [product] from cart", "update quantity to 3", "change delivery to home delivery", "apply discount code SAVE15" - **Check context.cart to see current cart contents**
- To view cart: Say "open cart", "show my cart", "what's in my cart" - **Reference context.cart to read current state, then navigate to cart page**
- To manage vehicle: Say "open vehicle selector", "select vehicle 1" - **Check context.vehicle to see current vehicle state**
- To check compatibility: Say "does [product] fit my vehicle", "what products fit my vehicle" - **All product searches and filters automatically filter by vehicle compatibility when a vehicle is selected. Use viewProduct to check compatibility for a specific product, or use searchProducts/filterProductsByCategory to see compatible products.**
- To check delivery: Say "what delivery options are available for [product]", "show delivery methods" - use viewProduct to see delivery options on product detail page
- To manage wishlist: Say "add [product] to wishlist", "save [product] to favorites", "remove [product] from wishlist" - **Check context.vehicle.selectedVehicle to verify a vehicle is selected, and context.wishlist to see current wishlist state, then use addToWishlist or removeFromWishlist**
- To view wishlist: Say "show my wishlist", "open wishlist", "view favorites" - use viewWishlist to navigate to wishlist page (shows all wishlist items with no vehicle filtering)
- To view purchases: Say "show my purchases", "show purchase history", "view previous purchases" - use viewPurchases to navigate to purchases page
- To check app state: Say "what's in my cart", "what vehicle is selected", "show my wishlist", "show previous purchases" - **Reference context.cart, context.vehicle, context.wishlist, and context.purchases directly - the context is always up-to-date**

## Delivery Methods:
- store-pickup: FREE, ready in 30 mins at store location
- same-day-delivery: $8.99 per item, order by 8pm
- home-delivery: FREE for orders over $35, otherwise $5.99 per item

## Product Categories:
- batteries: Car batteries and related products
- brakepads: Brake pads and shoes
- rotors: Rotors and drums
- oil: Motor oil and oil change bundles
- oil_filters: Oil filters
- clearance: Clearance items with discounts

Help users navigate the website, search for products, manage their cart, and select vehicles. Be concise, professional, and helpful. 

**CRITICAL: Default to "show me" paradigm - always navigate to pages to show information rather than just describing it.**
- When users ask about products, navigate to product detail pages
- When users ask about cart contents, navigate to cart page
- When users ask about delivery options or compatibility, use viewProduct to navigate to product detail page where both are displayed
- When users ask about products that fit their vehicle, navigate to category page

When users ask about products from search results (e.g., "tell me more about that battery", "show me the DieHard battery", "what about the H6-AGM"), use viewProduct to navigate to the product detail page.`
      })(),

      // Dual adapter architecture
      // navigationAdapter, // Handles voice navigation
      // automationAdapter, // Handles voice-controlled page interaction

      // Border glow - Shows glowing border when AI is active
      borderGlow: {
        enabled: true,
        color: 'rgba(255, 193, 7, 0.5)', // Branded yellow/amber with opacity
        intensity: 30,
        pulse: true
      },

      floatingCursor: {
        enabled: false
      },

      // Caption system - Real-time speech captions displayed as floating toast notifications
      // @ts-ignore - Internal feature, may not be fully typed
      _caption: {
        enabled: true,
        position: 'top-center',
        maxWidth: '600px',
        showRole: true,
        showOnMobile: false,
      },

      // Voice configuration
      voiceConfig: USE_ALTERNATIVE_PROVIDER
        ? {
            // Alternative provider configuration (for advanced users)
            provider: 'custom',
            language: 'en-US',
            initialGreetingPrompt: `Welcome the user! Check context.user for the user's name to personalize the greeting.

            CRITICAL: Check context.vehicle.vehicleCount to see if they have registered vehicles.
            - If context.vehicle.vehicleCount > 0: List ALL their vehicles and ask if you can help them find parts.
            - If context.vehicle.vehicleCount === 0: Ask them if they would like to register a vehicle.`,
          }
        : {
            // Default: vowel.to hosted voice service
            provider: 'vowel-prime',
            voice: 'Alex',
            language: 'en-US',
            initialGreetingPrompt: `Welcome the user! Check context.user for the user's name to personalize the greeting.

            CRITICAL: Check context.vehicle.vehicleCount to see if they have registered vehicles.
            - If context.vehicle.vehicleCount > 0: List ALL their vehicles and ask if you can help them find parts.
            - If context.vehicle.vehicleCount === 0: Ask them if they would like to register a vehicle.`,

            // Turn detection: Configure based on USE_SERVER_VAD constant
            ...(USE_SERVER_VAD ? {
              turnDetection: {
                mode: 'server_vad' as const,
                serverVAD: {
                  threshold: 0.5,
                  prefixPaddingMs: 350,
                  silenceDurationMs: 550,
                  interruptResponse: true
                }
              },
              // Provider configuration: Use AssemblyAI ASR with integrated VAD
              providerConfig: {
                stt: {
                  provider: 'assemblyai' as const,
                  assemblyai: {
                    sampleRate: 24000,
                    encoding: 'pcm_s16le',
                    wordBoost: [
                      // Add domain-specific terms for better recognition
                      'battery',
                      'brake',
                      'rotor',
                      'oil filter',
                      'SKU',
                      'H6-AGM',
                      'DieHard',
                      'OPTIMA',
                      'Carquest',
                      'Bosch'
                    ]
                  }
                }
              },
            } : {}),
          },

      // Callbacks for speaking state tracking
      onUserSpeakingChange: (_isSpeaking) => {
        // Logging disabled to reduce console noise
      },
      onAIThinkingChange: (_isThinking) => {
        // Logging disabled to reduce console noise
      },
      onAISpeakingChange: (_isSpeaking) => {
        // Logging disabled to reduce console noise
      },
    })
  : null

/**
 * Register all custom actions for product search, filtering, cart management, and vehicle management
 * ⚠️ CRITICAL: All actions MUST be registered BEFORE startSession()!
 */
if (vowel) {
  // ============================================
  // PRODUCT SEARCH & FILTERING ACTIONS
  // ============================================

  /**
   * Search for products by name, SKU, or category
   * Navigates to the category/search page with the search query
   * Automatically filters by vehicle compatibility if a vehicle is selected
   */
  vowel.registerAction(
    'searchProducts',
    {
      description: 'Search for auto parts products by name, SKU, or category',
      parameters: {
        query: {
          type: 'string',
          description: 'Search query (product name, SKU, or category)',
        },
      },
    },
    async ({ query }) => {
      const products = getProducts()
      const searchTerm = query.toLowerCase()
      const vehicle = getSelectedVehicle()
      
      // First filter by search query
      let filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm) ||
          (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
          product.category.toLowerCase().includes(searchTerm)
      )

      // Then filter by vehicle compatibility if a vehicle is selected
      // This ensures search results respect the selected vehicle
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }

      // Navigate to category page with search query
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { category: undefined, q: query, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: vehicle ? true : undefined },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        products: filtered.slice(0, 10).map(p => ({
          name: p.name,
          sku: p.sku,
          price: p.price,
          category: p.category,
        })),
        message: `Found ${filtered.length} product(s) matching "${query}"${vehicleInfo}. Showing search results.`,
      }
    }
  )

  /**
   * Navigate to a product detail page
   * Finds product by SKU or name and navigates to the product detail page
   * Use this when user asks about a specific product from search results
   */
  vowel.registerAction(
    'viewProduct',
    {
      description: 'Navigate to a product detail page. Use this when user asks about a specific product from search results.',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU or product name to view',
        },
      },
    },
    async ({ productId }) => {
      const products = getProducts()
      
      // Try to find by SKU first (exact match, case-insensitive)
      let product = products.find((p) => p.sku && p.sku.toLowerCase() === productId.toLowerCase())
      
      if (!product) {
        // Search by name (case-insensitive partial match)
        const searchTerm = productId.toLowerCase()
        const matches = products.filter((p) => 
          p.name.toLowerCase().includes(searchTerm)
        )
        
        if (matches.length === 0) {
          return {
            success: false,
            error: `Product "${productId}" not found. Please provide a product SKU or name.`,
          }
        }
        
        if (matches.length > 1) {
          // If multiple matches, try to find the best match (exact name match first)
          const exactMatch = matches.find(p => p.name.toLowerCase() === searchTerm)
          if (exactMatch) {
            product = exactMatch
          } else {
            // Return error with suggestions
            return {
              success: false,
              error: `Multiple products found matching "${productId}". Please be more specific or use a product SKU.`,
              suggestions: matches.slice(0, 5).map(p => ({
                name: p.name,
                sku: p.sku,
              })),
            }
          }
        } else {
          product = matches[0]
        }
      }

      if (!product || !product.sku) {
        return {
          success: false,
          error: `Product "${productId}" found but does not have a SKU. Cannot navigate to product page.`,
        }
      }

      // Navigate to product detail page
      router.navigate({
        to: '/product/$sku',
        params: { sku: product.sku },
      })

      return {
        success: true,
        product: {
          name: product.name,
          sku: product.sku,
          price: product.price,
          category: product.category,
        },
        message: `Navigating to ${product.name} detail page.`,
      }
    }
  )

  /**
   * Filter products by category
   * Navigates to the category page with the category filter applied
   * Automatically filters by vehicle compatibility if a vehicle is selected
   */
  vowel.registerAction(
    'filterProductsByCategory',
    {
      description: 'Filter products by category',
      parameters: {
        category: {
          type: 'string',
          description: 'Product category: batteries, brakepads, rotors, oil, oil_filters, or clearance',
        },
      },
    },
    async ({ category }) => {
      const products = getProducts()
      const categoryLower = category.toLowerCase()
      const vehicle = getSelectedVehicle()
      
      // Normalize category name (handle variations like "battery" -> "batteries")
      const categoryMap: Record<string, string> = {
        'battery': 'batteries',
        'batteries': 'batteries',
        'brakepad': 'brakepads',
        'brakepads': 'brakepads',
        'brake pad': 'brakepads',
        'brake pads': 'brakepads',
        'rotor': 'rotors',
        'rotors': 'rotors',
        'oil': 'oil',
        'oil filter': 'oil_filters',
        'oil filters': 'oil_filters',
        'oil_filters': 'oil_filters',
        'clearance': 'clearance',
      }
      
      const normalizedCategory = categoryMap[categoryLower] || categoryLower
      
      // First filter by category
      let filtered = products.filter(
        (product) => product.category.toLowerCase() === normalizedCategory
      )

      // Then filter by vehicle compatibility if a vehicle is selected
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }

      // Navigate to category page with category filter
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { category: normalizedCategory, q: undefined, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: vehicle ? true : undefined },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        category: normalizedCategory,
        products: filtered.slice(0, 10).map(p => ({
          name: p.name,
          sku: p.sku,
          price: p.price,
        })),
        message: `Found ${filtered.length} product(s) in category "${normalizedCategory}"${vehicleInfo}. Showing filtered results.`,
      }
    }
  )

  /**
   * Filter products by brand
   * Navigates to category page with brand search query
   * Automatically filters by vehicle compatibility if a vehicle is selected
   */
  vowel.registerAction(
    'filterProductsByBrand',
    {
      description: 'Filter products by brand name. Navigates to category page showing products from that brand.',
      parameters: {
        brand: {
          type: 'string',
          description: 'Brand name (e.g., DieHard, OPTIMA, Carquest, Bosch, FRAM, Mobil)',
        },
      },
    },
    async ({ brand }) => {
      const products = getProducts()
      const brandLower = brand.toLowerCase()
      const vehicle = getSelectedVehicle()
      
      // First filter by brand
      let filtered = products.filter((product) => {
        const productName = product.name.toLowerCase()
        return productName.includes(brandLower)
      })

      // Then filter by vehicle compatibility if a vehicle is selected
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }

      // Navigate to category page with brand search query
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { category: undefined, q: brand, page: 1, minPrice: undefined, maxPrice: undefined, fitsVehicle: vehicle ? true : undefined },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        brand: brand,
        message: `Found ${filtered.length} product(s) from brand "${brand}"${vehicleInfo}. Showing results.`,
      }
    }
  )

  /**
   * Filter products by minimum price
   * Navigates to category page with minimum price filter applied via URL params
   */
  vowel.registerAction(
    'filterProductsByMinPrice',
    {
      description: 'Filter products by minimum price. Navigates to category page with minimum price filter applied.',
      parameters: {
        minPrice: {
          type: 'number',
          description: 'Minimum price in dollars',
        },
      },
    },
    async ({ minPrice }) => {
      const products = getProducts()
      const vehicle = getSelectedVehicle()
      
      // Apply vehicle filter if vehicle is selected
      let filtered = products
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }
      
      // Apply price filter
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price?.replace('$', '') || '0')
        return price >= minPrice
      })

      // Navigate to category page with price filter params
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { 
          category: undefined, 
          q: undefined, 
          page: 1,
          minPrice: minPrice,
          maxPrice: undefined,
          fitsVehicle: vehicle ? true : undefined,
        },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        minPrice,
        message: `Found ${filtered.length} product(s) with price $${minPrice} or higher${vehicleInfo}. Showing filtered results.`,
      }
    }
  )

  /**
   * Filter products by maximum price
   * Navigates to category page with maximum price filter applied via URL params
   */
  vowel.registerAction(
    'filterProductsByMaxPrice',
    {
      description: 'Filter products by maximum price. Navigates to category page with maximum price filter applied.',
      parameters: {
        maxPrice: {
          type: 'number',
          description: 'Maximum price in dollars',
        },
      },
    },
    async ({ maxPrice }) => {
      const products = getProducts()
      const vehicle = getSelectedVehicle()
      
      // Apply vehicle filter if vehicle is selected
      let filtered = products
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }
      
      // Apply price filter
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price?.replace('$', '') || '0')
        return price <= maxPrice
      })

      // Navigate to category page with price filter params
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { 
          category: undefined, 
          q: undefined, 
          page: 1,
          minPrice: undefined,
          maxPrice: maxPrice,
          fitsVehicle: vehicle ? true : undefined,
        },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        maxPrice,
        message: `Found ${filtered.length} product(s) with price up to $${maxPrice}${vehicleInfo}. Showing filtered results.`,
      }
    }
  )

  /**
   * Filter products by price range
   * Navigates to category page with price range filter applied via URL params
   * Both minPrice and maxPrice are required
   */
  vowel.registerAction(
    'filterProductsByPriceRange',
    {
      description: 'Filter products by price range. Navigates to category page with price range filter applied. Both minimum and maximum prices are required.',
      parameters: {
        minPrice: {
          type: 'number',
          description: 'Minimum price in dollars',
        },
        maxPrice: {
          type: 'number',
          description: 'Maximum price in dollars',
        },
      },
    },
    async ({ minPrice, maxPrice }) => {
      const products = getProducts()
      const vehicle = getSelectedVehicle()
      
      // Apply vehicle filter if vehicle is selected
      let filtered = products
      if (vehicle) {
        filtered = filtered.filter(p => checkProductFitsVehicle(p, vehicle))
      }
      
      // Apply price filter
      filtered = filtered.filter((product) => {
        const price = parseFloat(product.price?.replace('$', '') || '0')
        return price >= minPrice && price <= maxPrice
      })

      // Navigate to category page with price filter params
      // Always filter by vehicle compatibility if a vehicle is selected
      router.navigate({
        to: '/category',
        search: { 
          category: undefined, 
          q: undefined, 
          page: 1,
          minPrice: minPrice,
          maxPrice: maxPrice,
          fitsVehicle: vehicle ? true : undefined,
        },
      })

      const vehicleInfo = vehicle 
        ? ` (filtered for ${vehicle.year} ${vehicle.make} ${vehicle.model})`
        : ''

      return {
        success: true,
        count: filtered.length,
        minPrice,
        maxPrice,
        message: `Found ${filtered.length} product(s) in price range $${minPrice} - $${maxPrice}${vehicleInfo}. Showing filtered results.`,
      }
    }
  )

  // ============================================
  // CART MANAGEMENT ACTIONS
  // ============================================

  /**
   * Add a product to the shopping cart
   * Note: This action is designed to be called via voice commands.
   * When buttons are clicked manually, they call addToCartStore directly to avoid duplicate announcements.
   */
  vowel.registerAction(
    'addToCart',
    {
      description: 'Add a product to the shopping cart',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU',
        },
        quantity: {
          type: 'number',
          description: 'Quantity to add',
        },
        deliveryMethod: {
          type: 'string',
          description: 'Delivery method: store-pickup, same-day-delivery, or home-delivery',
        },
      },
    },
    async ({ productId, quantity, deliveryMethod }) => {
      const products = getProducts()
      const product = products.find((p) => p.sku === productId)

      if (!product) {
        return {
          success: false,
          error: `Product with SKU "${productId}" not found`,
        }
      }

      // Validate delivery method
      const validDeliveryMethods: DeliveryMethod[] = ['store-pickup', 'same-day-delivery', 'home-delivery']
      const delivery = validDeliveryMethods.includes(deliveryMethod as DeliveryMethod) 
        ? (deliveryMethod as DeliveryMethod)
        : 'store-pickup'

      // Check if item already exists in cart to avoid duplicate announcements
      const existingItem = cartStore.items.find(
        (item) => item.sku === productId && item.deliveryMethod === delivery
      )

      // Add to cart store (not programmatic, since this is from voice command)
      addToCartStore(
        product,
        quantity,
        delivery,
        delivery === 'store-pickup' ? '2350 3rd St S Jacksonville, FL 32250' : undefined,
        delivery !== 'store-pickup' ? '32250' : undefined,
        false // Not programmatic - this is from voice command
      )

      // Check if this was just added programmatically
      // If a button was clicked, addToCartStore was called programmatically and set isProgrammaticAdd
      // Then Vowel's automation adapter detects the click and calls this action
      // We check the flag to detect this scenario
      const wasJustAddedProgrammatically = cartStore.isProgrammaticAdd

      // Reset the flag after checking
      cartStore.isProgrammaticAdd = false

      // If this was just added programmatically, return success but don't announce
      // This prevents Vowel from speaking when automation adapter detects button clicks
      if (wasJustAddedProgrammatically) {
        return {
          success: true,
          product: {
            name: product.name,
            sku: product.sku || productId,
            price: product.price || 'N/A',
          },
          quantity: existingItem ? existingItem.quantity + quantity : quantity,
          deliveryMethod: delivery,
          // Return empty message to prevent Vowel from speaking
          message: '',
        }
      }

      // Only announce if this is a new item or quantity changed significantly
      // This prevents duplicate announcements when automation adapter detects button clicks
      const isNewItem = !existingItem
      const finalQuantity = existingItem ? existingItem.quantity + quantity : quantity

      return {
        success: true,
        product: {
          name: product.name,
          sku: product.sku || productId,
          price: product.price || 'N/A',
        },
        quantity: finalQuantity,
        deliveryMethod: delivery,
        message: isNewItem 
          ? `Added ${quantity} × ${product.name} to cart (${delivery.replace(/-/g, ' ')})`
          : `Updated cart: ${finalQuantity} × ${product.name} (${delivery.replace(/-/g, ' ')})`,
      }
    }
  )

  /**
   * Remove an item from the cart
   */
  vowel.registerAction(
    'removeFromCart',
    {
      description: 'Remove an item from the shopping cart',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU',
        },
        deliveryMethod: {
          type: 'string',
          description: 'Delivery method: store-pickup, same-day-delivery, or home-delivery',
        },
      },
    },
    async ({ productId, deliveryMethod }) => {
      const validDeliveryMethods: DeliveryMethod[] = ['store-pickup', 'same-day-delivery', 'home-delivery']
      const delivery = validDeliveryMethods.includes(deliveryMethod as DeliveryMethod) 
        ? (deliveryMethod as DeliveryMethod)
        : 'store-pickup'

      removeFromCart(productId, delivery)

      return {
        success: true,
        message: `Removed product ${productId} from cart`,
      }
    }
  )

  /**
   * Update quantity of a cart item
   */
  vowel.registerAction(
    'updateCartItemQuantity',
    {
      description: 'Update the quantity of an item in the cart',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU',
        },
        deliveryMethod: {
          type: 'string',
          description: 'Delivery method: store-pickup, same-day-delivery, or home-delivery',
        },
        quantity: {
          type: 'number',
          description: 'New quantity (must be greater than 0)',
        },
      },
    },
    async ({ productId, deliveryMethod, quantity }) => {
      const validDeliveryMethods: DeliveryMethod[] = ['store-pickup', 'same-day-delivery', 'home-delivery']
      const delivery = validDeliveryMethods.includes(deliveryMethod as DeliveryMethod) 
        ? (deliveryMethod as DeliveryMethod)
        : 'store-pickup'

      if (quantity <= 0) {
        return {
          success: false,
          error: 'Quantity must be greater than 0',
        }
      }

      updateCartItemQuantity(productId, delivery, quantity)

      return {
        success: true,
        message: `Updated quantity to ${quantity} for product ${productId}`,
      }
    }
  )

  /**
   * Update delivery method for a cart item
   */
  vowel.registerAction(
    'updateCartItemDeliveryMethod',
    {
      description: 'Change the delivery method for a cart item',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU',
        },
        oldDeliveryMethod: {
          type: 'string',
          description: 'Current delivery method: store-pickup, same-day-delivery, or home-delivery',
        },
        newDeliveryMethod: {
          type: 'string',
          description: 'New delivery method: store-pickup, same-day-delivery, or home-delivery',
        },
      },
    },
    async ({ productId, oldDeliveryMethod, newDeliveryMethod }) => {
      const validDeliveryMethods: DeliveryMethod[] = ['store-pickup', 'same-day-delivery', 'home-delivery']
      const oldDelivery = validDeliveryMethods.includes(oldDeliveryMethod as DeliveryMethod) 
        ? (oldDeliveryMethod as DeliveryMethod)
        : 'store-pickup'
      const newDelivery = validDeliveryMethods.includes(newDeliveryMethod as DeliveryMethod) 
        ? (newDeliveryMethod as DeliveryMethod)
        : 'store-pickup'

      updateCartItemDeliveryMethod(
        productId,
        oldDelivery,
        newDelivery,
        newDelivery === 'store-pickup' ? '2350 3rd St S Jacksonville, FL 32250' : undefined,
        newDelivery !== 'store-pickup' ? '32250' : undefined
      )

      return {
        success: true,
        message: `Changed delivery method from ${oldDelivery.replace(/-/g, ' ')} to ${newDelivery.replace(/-/g, ' ')} for product ${productId}`,
      }
    }
  )

  /**
   * Apply a discount code to the cart
   */
  vowel.registerAction(
    'applyDiscountCode',
    {
      description: 'Apply a discount code to the shopping cart',
      parameters: {
        code: {
          type: 'string',
          description: 'Discount code to apply',
        },
      },
    },
    async ({ code }) => {
      const success = applyDiscountCode(code)

      if (success) {
        const discountAmount = getDiscountAmount()
        const discountPercent = cartStore.discountPercent * 100
        const orderTotal = getOrderTotal()
        
        return {
          success: true,
          code: code.toUpperCase(),
          discountAmount: discountAmount.toFixed(2),
          discountPercent: discountPercent.toFixed(0),
          orderTotal: orderTotal.toFixed(2),
          message: `Applied discount code "${code.toUpperCase()}" - ${discountPercent}% off, saving $${discountAmount.toFixed(2)}. Order total: $${orderTotal.toFixed(2)} (includes tax).`,
        }
      } else {
        return {
          success: false,
          error: `Failed to apply discount code "${code}"`,
        }
      }
    }
  )

  /**
   * Remove the applied discount code from cart
   */
  vowel.registerAction(
    'removeDiscountCode',
    {
      description: 'Remove the applied discount code from the cart',
      parameters: {},
    },
    async () => {
      removeDiscountCode()
      return {
        success: true,
        message: 'Removed discount code from cart',
      }
    }
  )

  /**
   * Get cart summary - navigates to cart page to show cart contents
   * Returns detailed cart information including totals and discounts
   */
  vowel.registerAction(
    'getCartSummary',
    {
      description: 'Show cart contents. Navigates to cart page to display cart summary. Returns detailed cart information including totals, discounts, and delivery costs.',
      parameters: {},
    },
    async () => {
      const itemCount = getCartItemCount()
      const subtotal = getCartSubtotal()
      const discountAmount = getDiscountAmount()
      const deliveryCost = getTotalDeliveryCost()
      const tax = getTaxAmount()
      const orderTotal = getOrderTotal()
      
      // Navigate to cart page
      router.navigate({
        to: '/cart',
      })

      // Build detailed message - if discount applied, don't mention subtotal, just show discount and final order total (includes tax)
      let message = itemCount > 0 
        ? `Cart has ${itemCount} item(s).`
        : `Cart is empty.`
      
      if (cartStore.discountCode) {
        const discountPercent = (cartStore.discountPercent * 100).toFixed(0)
        message += ` Discount code "${cartStore.discountCode}" applied (${discountPercent}% off).`
      } else if (itemCount > 0) {
        message += ` Subtotal: $${subtotal.toFixed(2)}.`
      }
      
      if (deliveryCost > 0) {
        message += ` Delivery cost: $${deliveryCost.toFixed(2)}.`
      }
      
      if (itemCount > 0) {
        message += ` Order total: $${orderTotal.toFixed(2)} (includes tax). Showing cart page.`
      } else {
        message += ` Showing cart page.`
      }

      return {
        success: true,
        itemCount,
        subtotal: subtotal.toFixed(2),
        discountCode: cartStore.discountCode,
        discountAmount: discountAmount.toFixed(2),
        deliveryCost: deliveryCost.toFixed(2),
        tax: tax.toFixed(2),
        total: getCartTotal().toFixed(2),
        orderTotal: orderTotal.toFixed(2),
        message,
      }
    }
  )

  /**
   * Open cart overlay
   */
  vowel.registerAction(
    'openCartOverlay',
    {
      description: 'Open the cart overlay sidebar',
      parameters: {},
    },
    async () => {
      openCartOverlay()
      return {
        success: true,
        message: 'Opened cart overlay',
      }
    }
  )

  /**
   * Close cart overlay
   */
  vowel.registerAction(
    'closeCartOverlay',
    {
      description: 'Close the cart overlay sidebar',
      parameters: {},
    },
    async () => {
      closeCartOverlay()
      return {
        success: true,
        message: 'Closed cart overlay',
      }
    }
  )

  /**
   * Clear all items from the cart
   */
  vowel.registerAction(
    'clearCart',
    {
      description: 'Remove all items from the shopping cart',
      parameters: {},
    },
    async () => {
      const itemCount = getCartItemCount()
      clearCart()
      return {
        success: true,
        itemCount,
        message: itemCount > 0 
          ? `Cleared ${itemCount} item(s) from cart`
          : 'Cart is already empty',
      }
    }
  )

  // ============================================
  // VEHICLE MANAGEMENT ACTIONS
  // ============================================

  /**
   * Open vehicle selector modal
   */
  vowel.registerAction(
    'openVehicleSelector',
    {
      description: 'Open the vehicle selector modal',
      parameters: {},
    },
    async () => {
      openVehicleModal()
      return {
        success: true,
        message: 'Opened vehicle selector',
      }
    }
  )

  /**
   * Close vehicle selector modal
   */
  vowel.registerAction(
    'closeVehicleSelector',
    {
      description: 'Close the vehicle selector modal',
      parameters: {},
    },
    async () => {
      closeVehicleModal()
      return {
        success: true,
        message: 'Closed vehicle selector',
      }
    }
  )

  /**
   * Select a vehicle by index
   * Note: This action is designed to be called via voice commands.
   * When buttons are clicked manually, they call setSelectedVehicleById directly to avoid duplicate announcements.
   */
  vowel.registerAction(
    'selectVehicle',
    {
      description: 'Select a vehicle by its index (0-based)',
      parameters: {
        vehicleId: {
          type: 'number',
          description: 'Vehicle index (0-based, e.g., 0 for first vehicle, 1 for second)',
        },
      },
    },
    async ({ vehicleId }) => {
      if (vehicleId < 0 || vehicleId >= vehicleStore.vehicles.length) {
        return {
          success: false,
          error: `Vehicle index ${vehicleId} is out of range. Available vehicles: 0-${vehicleStore.vehicles.length - 1}`,
        }
      }

      // Check if this vehicle was just selected programmatically (within last 200ms)
      // If a button was clicked, setSelectedVehicleById was called programmatically and set lastProgrammaticSelect
      // Then Vowel's automation adapter detects the click and calls this action
      // We check if lastProgrammaticSelect was set very recently to detect this scenario
      const wasJustSelectedProgrammatically = vehicleStore.lastProgrammaticSelect 
        && (Date.now() - vehicleStore.lastProgrammaticSelect) < 200

      // Check if this is already the selected vehicle
      const isAlreadySelected = vehicleStore.selectedVehicleId === vehicleId

      // Set selected vehicle (not programmatic, since this is from voice command)
      setSelectedVehicleById(vehicleId, false)
      const vehicle = vehicleStore.vehicles[vehicleId]

      // Close the vehicle selector modal when a different vehicle is selected
      // Close regardless of programmatic vs voice command - if programmatic, button already closes it,
      // but calling closeVehicleModal again is harmless (idempotent)
      if (!isAlreadySelected) {
        closeVehicleModal()
      }

      // If this was just selected programmatically, return success but don't announce
      // This prevents Vowel from speaking when automation adapter detects button clicks
      if (wasJustSelectedProgrammatically) {
        return {
          success: true,
          vehicle: {
            type: vehicle.type,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            engine: vehicle.engine,
          },
          // Return empty message to prevent Vowel from speaking
          message: '',
        }
      }

      // If already selected, return a shorter message
      if (isAlreadySelected) {
        return {
          success: true,
          vehicle: {
            type: vehicle.type,
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            engine: vehicle.engine,
          },
          message: `Vehicle already selected: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        }
      }

      return {
        success: true,
        vehicle: {
          type: vehicle.type,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          engine: vehicle.engine,
        },
        message: `Selected vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      }
    }
  )

  /**
   * Add a new vehicle
   * TEMPORARILY DISABLED
   */
  // vowel.registerAction(
  //   'addVehicle',
  //   {
  //     description: 'Add a new vehicle to the vehicle list',
  //     parameters: {
  //       type: {
  //         type: 'string',
  //         description: 'Vehicle type: Car/Truck, Motorcycle, ATV/UTV, RV, or Boat',
  //       },
  //       year: {
  //         type: 'string',
  //         description: 'Vehicle year (e.g., "2025")',
  //       },
  //       make: {
  //         type: 'string',
  //         description: 'Vehicle make/manufacturer (e.g., "Jeep", "Ford")',
  //       },
  //       model: {
  //         type: 'string',
  //         description: 'Vehicle model (e.g., "Grand Cherokee", "F-150")',
  //       },
  //       engine: {
  //         type: 'string',
  //         description: 'Engine specification (use empty string "" if not provided)',
  //       },
  //       vin: {
  //         type: 'string',
  //         description: 'VIN number (use empty string "" if not provided)',
  //       },
  //       licensePlate: {
  //         type: 'string',
  //         description: 'License plate number (use empty string "" if not provided)',
  //       },
  //     },
  //   },
  //   async ({ type, year, make, model, engine, vin, licensePlate }) => {
  //     const validTypes: VehicleType[] = ['Car/Truck', 'Motorcycle', 'ATV/UTV', 'RV', 'Boat']
  //     const vehicleType = validTypes.includes(type as VehicleType) ? (type as VehicleType) : 'Car/Truck'

  //     const vehicle: Vehicle = {
  //       type: vehicleType,
  //       year,
  //       make,
  //       model,
  //       engine: engine || '',
  //       vin: vin || undefined,
  //       licensePlate: licensePlate || undefined,
  //     }

  //     const index = addVehicle(vehicle)

  //     return {
  //       success: true,
  //       vehicle: {
  //         type: vehicle.type,
  //         year: vehicle.year,
  //         make: vehicle.make,
  //         model: vehicle.model,
  //         engine: vehicle.engine,
  //       },
  //       index,
  //       message: `Added vehicle: ${year} ${make} ${model}`,
  //     }
  //   }
  // )



  // ============================================
  // WISHLIST MANAGEMENT ACTIONS
  // ============================================

  /**
   * Add an item to the wishlist for the currently selected vehicle
   */
  vowel.registerAction(
    'addToWishlist',
    {
      description: 'Add a product to the wishlist for the currently selected vehicle. If no vehicle is selected, returns an error.',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU or product name to add to wishlist',
        },
      },
    },
    async ({ productId }) => {
      const selectedVehicle = getSelectedVehicle()
      
      if (!selectedVehicle) {
        return {
          success: false,
          error: 'No vehicle is currently selected. Please select a vehicle first before adding items to wishlist.',
        }
      }

      // Find product by SKU or name
      const products = getProducts()
      const product = products.find(
        (p) => p.sku?.toLowerCase() === productId.toLowerCase() || 
               p.name.toLowerCase().includes(productId.toLowerCase())
      )

      if (!product) {
        return {
          success: false,
          error: `Product "${productId}" not found. Please use a valid product SKU or name.`,
        }
      }

      if (!product.sku) {
        return {
          success: false,
          error: `Product "${product.name}" does not have a SKU and cannot be added to wishlist.`,
        }
      }

      // Check if item is already in wishlist for this vehicle
      const isAlreadyInWishlist = wishlistStore.wishlistItems.some((item) => {
        if (item.sku !== product.sku) return false
        
        const itemVehicle = typeof item.vehicle === 'string'
          ? vehicleStore.vehicles.find(v => getVehicleKey(v) === item.vehicle)
          : item.vehicle
        
        if (!itemVehicle) return false
        
        return (
          itemVehicle.year === selectedVehicle.year &&
          itemVehicle.make === selectedVehicle.make &&
          itemVehicle.model === selectedVehicle.model
        )
      })

      if (isAlreadyInWishlist) {
        return {
          success: false,
          error: `Product "${product.name}" is already in your wishlist for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}.`,
        }
      }

      // Add to wishlist
      addToWishlist({
        vehicle: selectedVehicle,
        itemName: product.name,
        sku: product.sku,
        dateAdded: new Date().toISOString(),
      })

      return {
        success: true,
        product: {
          name: product.name,
          sku: product.sku,
        },
        vehicle: {
          year: selectedVehicle.year,
          make: selectedVehicle.make,
          model: selectedVehicle.model,
        },
        message: `Added "${product.name}" to wishlist for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`,
      }
    }
  )

  /**
   * Remove an item from the wishlist
   */
  vowel.registerAction(
    'removeFromWishlist',
    {
      description: 'Remove a product from the wishlist by SKU. Removes the item for the currently selected vehicle if multiple vehicles have the same item.',
      parameters: {
        productId: {
          type: 'string',
          description: 'Product SKU to remove from wishlist',
        },
      },
    },
    async ({ productId }) => {
      const selectedVehicle = getSelectedVehicle()
      
      // Find the item in wishlist
      const itemIndex = wishlistStore.wishlistItems.findIndex((item) => {
        if (item.sku.toLowerCase() !== productId.toLowerCase()) return false
        
        // If vehicle is selected, only remove for that vehicle
        if (selectedVehicle) {
          const itemVehicle = typeof item.vehicle === 'string'
            ? vehicleStore.vehicles.find(v => getVehicleKey(v) === item.vehicle)
            : item.vehicle
          
          if (!itemVehicle) return false
          
          return (
            itemVehicle.year === selectedVehicle.year &&
            itemVehicle.make === selectedVehicle.make &&
            itemVehicle.model === selectedVehicle.model
          )
        }
        
        // If no vehicle selected, remove first match
        return true
      })

      if (itemIndex < 0) {
        return {
          success: false,
          error: `Product with SKU "${productId}" not found in wishlist${selectedVehicle ? ` for ${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}` : ''}.`,
        }
      }

      const item = wishlistStore.wishlistItems[itemIndex]
      removeFromWishlist(itemIndex)

      return {
        success: true,
        product: {
          name: item.itemName,
          sku: item.sku,
        },
        message: `Removed "${item.itemName}" from wishlist`,
      }
    }
  )

  /**
   * Navigate to wishlist page to view all saved wishlist items
   */
  vowel.registerAction(
    'viewWishlist',
    {
      description: 'Navigate to the wishlist page to view all saved wishlist items.',
      parameters: {},
    },
    async () => {
      const itemCount = wishlistStore.wishlistItems.length
      
      // Navigate to wishlist page
      router.navigate({
        to: '/wishlist' as any,
        search: {} as any,
      })

      return {
        success: true,
        itemCount,
        message: itemCount > 0 
          ? `Wishlist has ${itemCount} item(s). Showing wishlist page.`
          : `Wishlist is empty. Showing wishlist page.`,
      }
    }
  )

  /**
   * Navigate to wishlist page filtered by a specific vehicle
   * TEMPORARILY DISABLED
   */
  // vowel.registerAction(
  //   'viewWishlistByVehicle',
  //   {
  //     description: 'Navigate to the wishlist page filtered by a specific vehicle.',
  //     parameters: {
  //       vehicleId: {
  //         type: 'number',
  //         description: 'Vehicle index (0-based) to filter wishlist items',
  //       },
  //     },
  //   },
  //   async ({ vehicleId }) => {
  //     const itemCount = wishlistStore.wishlistItems.length
  //     
  //     // Navigate to wishlist page with vehicle filter
  //     router.navigate({
  //       to: '/wishlist' as any,
  //       search: { vehicleId } as any,
  //     })

  //     const vehicle = vehicleStore.vehicles[vehicleId]

  //     if (!vehicle) {
  //       return {
  //         success: false,
  //         error: `Vehicle index ${vehicleId} is out of range. Available vehicles: 0-${vehicleStore.vehicles.length - 1}`,
  //       }
  //     }

  //     return {
  //       success: true,
  //       itemCount,
  //       vehicleId,
  //       vehicle: {
  //         year: vehicle.year,
  //         make: vehicle.make,
  //         model: vehicle.model,
  //       },
  //       message: `Showing wishlist for ${vehicle.year} ${vehicle.make} ${vehicle.model}. Wishlist has ${itemCount} item(s) total.`,
  //     }
  //   }
  // )

  /**
   * Navigate to previous purchases page to view purchase history
   */
  vowel.registerAction(
    'viewPurchases',
    {
      description: 'Navigate to the previous purchases page to view purchase history.',
      parameters: {},
    },
    async () => {
      const purchaseCount = purchasesStore.previousPurchases.length
      
      // Navigate to purchases page
      router.navigate({
        to: '/purchases' as any,
        search: {} as any,
      })

      return {
        success: true,
        purchaseCount,
        message: purchaseCount > 0 
          ? `You have ${purchaseCount} purchase(s). Showing purchases page.`
          : `No purchase history. Showing purchases page.`,
      }
    }
  )

  /**
   * Navigate to previous purchases page filtered by a specific vehicle
   * TEMPORARILY DISABLED
   */
  // vowel.registerAction(
  //   'viewPurchasesByVehicle',
  //   {
  //     description: 'Navigate to the previous purchases page filtered by a specific vehicle.',
  //     parameters: {
  //       vehicleId: {
  //         type: 'number',
  //         description: 'Vehicle index (0-based) to filter purchases',
  //       },
  //     },
  //   },
  //   async ({ vehicleId }) => {
  //     const purchaseCount = purchasesStore.previousPurchases.length
  //     
  //     // Navigate to purchases page with vehicle filter
  //     router.navigate({
  //       to: '/purchases' as any,
  //       search: { vehicleId } as any,
  //     })

  //     const vehicle = vehicleStore.vehicles[vehicleId]

  //     if (!vehicle) {
  //       return {
  //         success: false,
  //         error: `Vehicle index ${vehicleId} is out of range. Available vehicles: 0-${vehicleStore.vehicles.length - 1}`,
  //       }
  //     }

  //     return {
  //       success: true,
  //       purchaseCount,
  //       vehicleId,
  //       vehicle: {
  //         year: vehicle.year,
  //         make: vehicle.make,
  //         model: vehicle.model,
  //       },
  //       message: `Showing purchases for ${vehicle.year} ${vehicle.make} ${vehicle.model}. You have ${purchaseCount} purchase(s) total.`,
  //     }
  //   }
  // )

  // ============================================
  // DYNAMIC CONTEXT SYNC
  // ============================================

  /**
   * Context synchronization is now handled by the useAppStateSync hook
   * See src/hooks/useAppStateSync.ts and src/main.tsx
   * 
   * The hook uses useSyncContext from @vowel.to/client/react to automatically
   * sync app state to Vowel's dynamic context whenever stores change.
   * 
   * This replaces the manual subscription approach - the hook handles everything
   * automatically and is more React-friendly.
   */
}
