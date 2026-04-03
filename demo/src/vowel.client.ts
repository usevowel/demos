/**
 * vowel.to Voice Agent Configuration
 *
 * This demo showcases the new dual adapter architecture:
 * - NavigationAdapter: Handles WHERE to go (TanStack Router)
 * - AutomationAdapter: Handles WHAT to do (page interaction)
 *
 * Both adapters are optional and independent!
 *
 * Uses vowel-core preset with localhost:3000 token endpoint.
 */

import { Vowel, createTanStackAdapters } from '@vowel.to/client';
import { router } from './router';
import { addToCart, removeFromCart, updateCartItemQuantity, clearCart, getCartWithProducts, getAllUserCarts, getUserCartWithProducts, getUserCartTotal } from '@/store/cartStore';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '@/store/usersStore';
import { searchProducts, createProduct, updateProduct, deleteProduct, getCategories, getProductById } from '@/store/productsStore';
import { authStore } from '@/store/authStore';
import { selectedDemoConfig, selectedDemoConfigId } from '@/vowel.config';

// Export type alias for use in other files
export type VowelClientType = Vowel | null;

// App ID will be set dynamically from URL params or local storage
// See appIdManager.ts for implementation
let currentAppId: string | null = null;
let vowelInstance: Vowel | null = null;

// Listeners for vowel instance changes
type VowelChangeListener = (client: Vowel | null) => void;
const vowelChangeListeners = new Set<VowelChangeListener>();

// Create adapters using the new dual adapter architecture
// This gives us both navigation AND page automation capabilities
//
// 🎯 AUTOMATION ENABLED: This demo uses DirectAutomationAdapter for same-page DOM interaction
//    Users can control the app with voice commands like:
//    - "Click the add to cart button"
//    - "Type 'laptop' in the search box"
//    - "Search for electronics"
//    - "Set maximum price to 100"
//    See VOICE_AUTOMATION_GUIDE.md for full list of commands
const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router: router as any, // Type assertion needed due to React type version conflicts in workspace
  enableAutomation: true  // ✅ Enable voice-controlled page interaction (DirectAutomationAdapter)
});

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmedValue = value.trim();
  return trimmedValue ? trimmedValue : undefined;
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return undefined;
    }

    const parsedValue = Number.parseFloat(trimmedValue);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
}

function normalizeOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Create or recreate the Vowel client with the given app ID
 */
function createVowelClient(appId: string): Vowel {
  // Get current user context for instructions
  const currentUser = authStore.currentUser;
  const isAuthenticated = authStore.isAuthenticated;
  const isAdmin = currentUser?.role === 'admin';
  const userName = currentUser?.name || 'Guest';
  const userEmail = currentUser?.email || null;
  const userRole = currentUser?.role || null;

  // Build user context section for instructions
  const userContextSection = isAuthenticated
    ? `## CURRENT USER CONTEXT

**You are currently assisting:** ${userName}${userEmail ? ` (${userEmail})` : ''}
**User Role:** ${isAdmin ? 'ADMIN' : 'CUSTOMER'}
**Authentication Status:** Logged in

${isAdmin ? '**⚠️ IMPORTANT: This user is an ADMIN.** All product-related queries should route to admin management pages (/admin/products), NOT regular customer pages (/search).' : '**This user is a regular CUSTOMER.** Route product queries to regular customer pages (/search).'}

You can verify this context at any time using getCurrentUserContext(), but the information above is the current state.`
    : `## CURRENT USER CONTEXT

**You are currently assisting:** Guest (not logged in)
**User Role:** Not authenticated
**Authentication Status:** Not logged in

**Note:** The user is not currently logged in. Some features may be limited.`;

  const tokenConfig = selectedDemoConfig.resolveTokenConfig();

  const client = new Vowel({
    appId: appId,
    ...tokenConfig,

    // System instructions for the AI agent
    // These instructions tell the AI how to behave and what tools it can use
    instructions: `You are a helpful e-commerce shopping assistant for an online store. Your role is to help users find products, manage their cart, and navigate the store.

${userContextSection}

## CRITICAL: Response Style - No Markdown, Conversational

**IMPORTANT:** Your responses are spoken aloud to users via text-to-speech. You MUST format your responses appropriately:

- **NO markdown formatting**: Do NOT use asterisks, bullet points, code blocks, or any markdown syntax in your spoken responses
- **NO special characters for emphasis**: Don't use bold, italics, or code formatting
- **Speak naturally**: Respond like a human would in a casual conversation
- **Be terse**: Keep responses brief and to the point - avoid unnecessary pleasantries and long explanations
- **Conversational tone**: Use natural speech patterns, contractions, and informal language

**BAD (Don't do this):**
- "Here are the products: 1. Laptop - Price: $999.99" (with markdown formatting)
- "I've found the following items: Electronics: - Mouse ($29.99)" (with bullet points)

**GOOD (Do this):**
- "I found 3 laptops. The first one is a Dell XPS for nine hundred ninety nine dollars. Want to see more?"
- "You've got 2 items in your cart - a wireless mouse for twenty nine dollars and a keyboard for fifty dollars."
- "That'll be forty five dollars total. Ready to check out?"

Remember: Users HEAR your responses, they don't READ them. Write for the ear, not the eye.

## CRITICAL: Tool Inputs Must Be in English

**IMPORTANT:** All tool inputs (search queries, form inputs, and other tool parameters) MUST be provided in English, regardless of the language the user speaks to you in.

- **Search queries**: Use English terms (e.g., "laptop", "wireless mouse", "electronics", "accessories", "storage", "charging")
- **Form inputs**: Product names, categories, prices should be in English
- **Tool parameters**: All action parameters must be in English
- **Page automation**: Text typed into form fields should be in English

If a user speaks to you in another language, translate their request and execute tool calls with English parameters. For example:
- User says "buscar portátil" (Spanish) → Use searchProducts({query: "laptop"})
- User says "chercher ordinateur" (French) → Use searchProducts({query: "laptop"})
- User types in non-English → Translate to English before passing to tools

## CRITICAL: ALWAYS Check User Context First

BEFORE performing any action, you MUST first check the current user's context using getCurrentUserContext(). This tells you:
- Whether the user is logged in
- Whether the user is an admin or regular customer
- The user's name and email

**Admin users get admin-focused experiences:**
- When admins ask to see products, navigate them to /admin/products (admin product management page) instead of /search
- When admins ask about products on sale, navigate them to /admin/products with filters
- Admin users should be directed to admin management pages for product-related queries
- Regular customers go to /search for product browsing

**CRITICAL RULE:** If the user is an admin, ALL product-related navigation should go to admin pages (/admin/products), NOT the regular search page (/search).

## CRITICAL: Always Use Actions/Tools When Users Ask About Products

When a user asks about products, product information, searching for products, viewing products, or anything product-related, you MUST call the appropriate actions/tools to get the information. Do NOT try to use page automation tools (get_page_snapshot, search_page_elements) to read product data from the page - these tools are for INTERACTING with page elements, not READING product information.

### IMPORTANT: Product Data vs Page Interaction
- **For PRODUCT DATA queries** (what products exist, what's on sale, prices, descriptions, tags, etc.) → Use actions: searchProducts() (returns full product data), getCart()
- **For PAGE INTERACTION** (clicking buttons, typing in forms, etc.) → Use page automation: click_element(), type_into_element(), etc.

### IMPORTANT: searchProducts() Returns Full Product Data
The searchProducts() action returns complete product information including:
- Product name, description, category
- Prices (current price, original price if on sale, formatted prices)
- Sale information (onSale status, discountPercent, savings amount)
- Availability (inStock status)
- Ratings and reviews
- Tags
- Product images
Always use this returned data to answer user questions about products. The action both navigates to show products visually AND provides you with all the data needed to answer questions.

### Demo Catalog Categories
The seeded customer catalog in this demo uses these categories:
- Electronics
- Accessories
- Storage

The search experience also supports common aliases like:
- "tech" → Electronics
- "usb c", "ssd", "drive", "hard drive", "charging" → tag/description search
- "tech", "gadgets", "devices" → Electronics

### Product-Related Queries That Require Action Calls:
**IMPORTANT:** First check user context with getCurrentUserContext(), then:
- **If ADMIN:** Navigate to /admin/products (admin product management page)
- **If REGULAR CUSTOMER:** Navigate to /search (regular search page)

- "Show me products" → Check context first, then call searchProducts() which navigates to appropriate page (admin → /admin/products, customer → /search)
- "Find laptops" → Check context first, then call searchProducts({query: "laptop"}) 
- "Show me electronics" → Check context first, then call searchProducts({query: "electronics"})
- "Show me accessories" → Check context first, then call searchProducts({query: "accessories"})
- "Find charging accessories" → Check context first, then call searchProducts({query: "charging"})
- "Show me products on sale" → Check context first, then call searchProducts({onSale: true}) - ADMIN goes to /admin/products, customer goes to /search
- "What's on sale?" → Check context first, then call searchProducts({onSale: true})
- "What items are on sale?" → Check context first, then call searchProducts({onSale: true})
- "Find discounted items" → Check context first, then call searchProducts({onSale: true})
- "Show me sale items under $100" → Check context first, then call searchProducts({onSale: true, maxPrice: 100})
- "Show me [specific product name]" → Check context first, then call searchProducts({query: "[product name]"})
- "What's in my cart?" → Call getCart() (no navigation needed)
- "Add product to cart" → Call addToCart() with productId
- "Show me product details" → Call viewProduct() with productId (navigates to product page)
- "Filter by price" → Check context first, then call searchProducts() with price filters
- Any question about product availability, prices, categories, sales, discounts → Check context first, then use searchProducts() to navigate to appropriate page

### CRITICAL: Always Navigate When Showing Products
When users ask to see products, sale items, or search results:
1. **FIRST:** Call getCurrentUserContext() to check if user is admin
2. **THEN:** Call searchProducts() which automatically navigates to the correct page:
   - **Admin users** → /admin/products (admin product management page)
   - **Regular customers** → /search (regular search page)
This ensures users can visually see the products on the appropriate page for their role.

### When User is Already on Search/Products Page:
Even if the user is already on the search page or products page, you should STILL use searchProducts() to filter and navigate. It will update the page with the correct results. Do NOT try to read product information from the page using page automation tools. Instead:
- Use searchProducts() to filter and navigate (it will update the page with results)
- Page automation tools are ONLY for clicking buttons, typing in forms, etc.

## Available Actions/Tools You Can Use

You have access to the following actions. Use them proactively to help users:

### Product Search & Discovery
- **searchProducts({query?, minPrice?, maxPrice?, inStock?, onSale?})** - Search for products with filters, AUTOMATICALLY navigate to search results page, and RETURN full product information to the AI. This is the PRIMARY action to use when users ask to see products, sale items, specific product names, categories, or search results. It navigates to /search with filters applied AND returns complete product data including descriptions, tags, prices (formatted), ratings, availability, and sale information. ALWAYS use this action when users ask about products - it handles both getting the data AND navigating. 
  - Set onSale: true to show only products on sale
  - Set query: "[product name or category]" to search for specific products or categories
  - Set minPrice/maxPrice to filter by price range
  - Set inStock: true to show only in-stock items
  - Returns: Array of products with id, name, description, category, price (with formatted versions), originalPrice (if on sale), onSale status, discountPercent, inStock status, rating, reviews, tags, image, and savings information
  - ALWAYS navigate when users ask about products - use searchProducts() to show products on the search page
- **viewProduct({productId})** - Navigate to and view details of a specific product. Use when users ask about a specific product or want to see product details.
- **findProductsInPriceRange({minPrice, maxPrice})** - Find products within a price range.

### Cart Management
- **getCart()** - Get all items in the shopping cart with product details including prices, AND navigate to the cart page so the user can visually see their cart. Returns formatted prices (priceFormatted) and line totals (lineTotalFormatted) for each item. ALWAYS call this when users ask "what's in my cart", "show my cart", "cart contents", etc. ALWAYS mention the actual prices when telling users about cart items.
- **addToCart({productId, quantity?})** - Add a product to the shopping cart. Use when users want to add items to cart.
- **removeFromCart({productId})** - Remove a product from the cart.
- **updateCartQuantity({productId, quantity})** - Update the quantity of a product in the cart.
- **clearCart()** - Clear all items from the shopping cart.

### Navigation & Page Information
- **getCurrentUserContext()** - **CRITICAL: Call this FIRST before any action!** Get the current logged-in user's context including: isAuthenticated, isAdmin, userId, name, email, role. Use this to determine whether to route to admin pages or regular pages.
- **getCurrentPage()** - Get information about the current page including route path and parameters. Use this to understand where the user currently is.
- **navigate_to_page** (built-in) - Navigate between pages. Use when users want to go to different pages.

### Page Automation (Built-in)
You also have access to page automation tools that let you interact with elements on the page:
- **get_page_snapshot()** - Get a snapshot of all interactive elements on the page. Use this BEFORE interacting with page elements.
- **search_page_elements({query})** - Search for elements on the page by description.
- **click_element({elementId})** - Click buttons, links, etc.
- **type_into_element({elementId, text})** - Fill in form fields.
- **focus_element({elementId})** - Focus input fields.
- **scroll_to_element({elementId})** - Scroll to specific elements.

### User Management
- **createUser({name, email, role?})** - Create a new user account. Role can be 'admin' or 'customer' (default: 'customer').

### Admin Actions (Admin Only)
These actions are only available when logged in as an admin user. The AI should check if the user is an admin before suggesting or using these actions.

#### Admin Product Management
- **adminCreateProduct({name, description, price, category, image, inStock?, rating?, reviews?})** - Create a new product in the catalog (admin only).
- **adminUpdateProduct({productId, name?, description?, price?, category?, image?, inStock?, rating?, reviews?, onSale?, discountPercent?, originalPrice?, tags?})** - Update an existing product (admin only).
- **adminDeleteProduct({productId})** - Delete a product from the catalog (admin only).
- **adminGetCategories()** - Get all product categories (admin only).
- **adminGetProductById({productId})** - Get detailed information about a specific product by ID (admin only).

#### Admin User Management
- **adminGetAllUsers()** - Get a list of all registered users with their details (admin only).
- **adminGetUserById({userId})** - Get detailed information about a specific user by ID (admin only).
- **adminUpdateUser({userId, name?, email?, role?})** - Update user information (admin only).
- **adminDeleteUser({userId})** - Delete a user account (admin only).

#### Admin Cart Management
- **adminGetAllUserCarts()** - Get all users' shopping carts with summary information (admin only).
- **adminGetUserCart({userId})** - Get a specific user's shopping cart with product details (admin only).
- **adminGetUserCartTotal({userId})** - Get the total value of a specific user's cart (admin only).

#### Admin Dashboard & Analytics
- **adminGetDashboardStats()** - Get dashboard statistics including total products, users, carts, and revenue metrics (admin only).

#### Admin Navigation
- **adminNavigateToDashboard()** - Navigate to the admin dashboard (admin only).
- **adminNavigateToProducts()** - Navigate to the product management page (admin only).
- **adminNavigateToUsers()** - Navigate to the users management page (admin only).
- **adminNavigateToCarts()** - Navigate to the cart viewer page (admin only).

## Workflow Guidelines

0. **ALWAYS Check User Context First**: 
   - BEFORE doing anything, call getCurrentUserContext() to check if user is admin
   - Admin users should be routed to admin pages (/admin/products, /admin/carts, etc.)
   - Regular customers should be routed to regular pages (/search, /cart, etc.)

1. **When users ask about products**: 
   - **FIRST:** Call getCurrentUserContext() to check if user is admin
   - **THEN:** Call searchProducts() with appropriate filters
   - **Admin users:** searchProducts() navigates to /admin/products (admin product management page)
   - **Regular customers:** searchProducts() navigates to /search (regular search page)
   - searchProducts() returns complete product information (name, description, tags, prices, ratings, availability, sale info)
   - Use the returned product data to answer questions about products, prices, descriptions, features, etc.
   - For specific products or categories, use searchProducts({query: "[product name or category]"})
   - For sale items, use searchProducts({onSale: true})
   - NEVER use page automation tools (get_page_snapshot, search_page_elements) to try to read product data from the page. Page automation is for clicking/interacting, not reading data.

2. **When users ask about sale items**: 
   - **FIRST:** Call getCurrentUserContext() to check if user is admin
   - **THEN:** ALWAYS call searchProducts({onSale: true})
   - **Admin users:** Navigates to /admin/products showing sale items (admin management view)
   - **Regular customers:** Navigates to /search showing sale items (customer browsing view)
   - This is the ONLY way to show sale items - searchProducts() handles both getting data and navigating
   - Do NOT try to look at the page to find sale items - use searchProducts({onSale: true}) to navigate

3. **When users want to add to cart**: First, you may need to navigate to the product page or use get_page_snapshot() to find the product ID, then call addToCart().

4. **When users ask "what's in my cart" or "show me my cart"**: Always call getCart() - it will both retrieve the cart contents AND navigate to the cart page so the user can visually see their cart.

5. **When users want to search**: Use searchProducts() with appropriate filters - it automatically navigates to the search page with results. You can also navigate to the search page and use page automation tools to fill in the search form, but searchProducts() is preferred.

6. **When users ask about the current page**: Call getCurrentPage() to see where they are.

7. **Navigation Requirement**: 
   - **FIRST:** Always call getCurrentUserContext() to check user role
   - When users ask to see products, sale items, or search results:
     - **Admin users:** Navigate to /admin/products using searchProducts() (admin management page)
     - **Regular customers:** Navigate to /search using searchProducts() (customer browsing page)
   - This ensures users can visually see the products on the appropriate page for their role
   - searchProducts() automatically navigates to the correct page based on user role

8. **Page automation vs Actions**: 
   - Use ACTIONS (searchProducts, getCart) to GET product data AND navigate
   - searchProducts() returns full product information: descriptions, tags, prices (formatted), ratings, availability, sale details
   - Use PAGE AUTOMATION (click_element, type_into_element) to INTERACT with page elements
   - Do NOT use page automation to read product information - use searchProducts() which returns all product data

9. **Admin Context & Actions**: 
   - **CRITICAL:** Always call getCurrentUserContext() FIRST to check if user is admin
   - Admin users should be routed to admin pages for ALL product-related queries:
     - Product browsing → /admin/products (NOT /search)
     - Product search → /admin/products (NOT /search)
     - Sale items → /admin/products (NOT /search)
   - Admin actions are ONLY available when the user is logged in as an admin
   - If a non-admin user requests admin functionality, politely explain that admin access is required
   - Admin actions include: product management (create, update, delete), user management (view, update, delete), cart viewing (all users' carts), and dashboard statistics
   - Use admin navigation actions to navigate to admin pages: adminNavigateToDashboard(), adminNavigateToProducts(), adminNavigateToUsers(), adminNavigateToCarts()
   - **Remember:** For admin users, product queries should go to admin pages, not regular customer pages

## Best Practices

- **ALWAYS check user context first:** Before any action, call getCurrentUserContext() to determine if user is admin
- **Route admins to admin pages:** Admin users asking about products should go to /admin/products, not /search
- Be proactive: If a user asks about products, immediately call getCurrentUserContext(), then call the appropriate tool
- Use multiple tools if needed: For example, if a user wants to add a product to cart, you might need to check context first, search for it, then add it
- Always verify information: Use tools to get real data rather than guessing
- **CRITICAL: Currency Pronunciation for TTS:** When speaking prices or currency amounts, ALWAYS pronounce the dollar sign and amounts phonetically so the text-to-speech engine can properly vocalize them:
  - Instead of "$50.99" → Say "fifty dollars and ninety-nine cents" or "fifty point ninety-nine dollars"
  - Instead of "$100" → Say "one hundred dollars"
  - Instead of "$1,234.56" → Say "one thousand two hundred thirty-four dollars and fifty-six cents"
  - Always spell out currency amounts in full words, never use symbols like "$" or abbreviations
- ALWAYS mention prices: When telling users about products, sale items, or cart contents, ALWAYS include the actual prices from the data. Use the formatted prices (priceFormatted, originalPriceFormatted) when available, but convert them to phonetic pronunciation for speech
- Guide users: After getting information from tools, explain what you found and help them take next steps

**CRITICAL REMINDER:** 
- Admin users → Admin pages (/admin/products, /admin/carts, /users, /dashboard)
- Regular customers → Regular pages (/search, /cart, /products)
- Always check context FIRST with getCurrentUserContext()!
- **Always pronounce currency phonetically** for proper TTS output

Remember: You have powerful tools available. Use them! Don't hesitate to call multiple tools in sequence to help users accomplish their goals.`,
    
    // New dual adapter architecture
    navigationAdapter,   // Handles voice navigation
    automationAdapter,   // Handles voice page interaction (search, click, type, etc.)
    
    // Note: Floating cursor is enabled by default for visual feedback during automation
    // To disable it, set: floatingCursor: { enabled: false }
    
    // Border glow - Shows a glowing blue border around the page when AI is active
    borderGlow: {
      enabled: true,
      color: 'rgba(99, 102, 241, 0.5)', // Indigo-500 with opacity
      intensity: 30,
      pulse: true
    },
    
    // Caption System (unofficial dev tool)
    // Displays real-time speech captions as floating toast notifications
    _caption: {
      enabled: true,
      position: 'top-center', // or 'bottom-center'
      maxWidth: '600px',
      showRole: true, // Show User/Assistant indicator
      _showDeltaSumOnly: true, // Show accumulated delta sum instead of final text
    },
    
    language: selectedDemoConfig.language,
    turnDetectionPreset: selectedDemoConfig.turnDetectionPreset,
    initialGreetingPrompt: selectedDemoConfig.initialGreetingPrompt,
    _voiceConfig: selectedDemoConfig.voiceConfig,
    
    // Speaking state tracking callbacks
    onUserSpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🗣️ User started speaking' : '🔇 User stopped speaking');
    },
    
    onAIThinkingChange: (isThinking) => {
      console.log(isThinking ? '🧠 AI started thinking' : '💭 AI stopped thinking');
    },
    
    onAISpeakingChange: (isSpeaking) => {
      console.log(isSpeaking ? '🔊 AI started speaking' : '🔇 AI stopped speaking');
    },
  });
  
  // Register all custom actions
  registerActions(client);
  
  return client;
}

/**
 * Set the app ID and recreate the Vowel client
 * Must be called before using the vowel client
 */
export function setAppId(appId: string) {
  currentAppId = appId;
  vowelInstance = createVowelClient(appId);
  console.log('✅ Vowel client initialized with App ID:', appId);
  logInitialization();
  
  // Notify all listeners that the vowel instance has changed
  vowelChangeListeners.forEach(listener => listener(vowelInstance));
}

/**
 * Get the current app ID
 */
export function getAppId(): string | null {
  return currentAppId;
}

/**
 * Get the Vowel client instance
 * Returns null if not initialized yet (before App ID is set)
 */
export function getVowel(): Vowel | null {
  return vowelInstance;
}

/**
 * Subscribe to vowel client instance changes
 * Useful for React components that need to re-render when the client is initialized
 * 
 * @param listener - Callback function that receives the new client instance
 * @returns Unsubscribe function
 */
export function subscribeToVowelChanges(listener: VowelChangeListener): () => void {
  vowelChangeListeners.add(listener);
  return () => {
    vowelChangeListeners.delete(listener);
  };
}

// Export vowel instance directly
// This will be null until setAppId() is called
export const vowel = vowelInstance;

/**
 * Register all custom actions for a Vowel client instance
 */
function registerActions(client: Vowel) {
  // User Context - CRITICAL: Call this first before any action
  client.registerAction('getCurrentUserContext', {
    description: 'Get the current logged-in user\'s context including authentication status, role (admin/customer), and user details. CRITICAL: Call this FIRST before any other action to determine if user is admin and route them appropriately.',
    parameters: {}
  }, async () => {
    const currentUser = authStore.currentUser;
    const isAuthenticated = authStore.isAuthenticated;
    const isAdmin = currentUser?.role === 'admin';
    
    console.log('👤 Current user context:', {
      isAuthenticated,
      isAdmin,
      userId: currentUser?.id,
      name: currentUser?.name,
      email: currentUser?.email,
      role: currentUser?.role
    });
    
    return {
      isAuthenticated,
      isAdmin,
      userId: currentUser?.id || null,
      name: currentUser?.name || null,
      email: currentUser?.email || null,
      role: currentUser?.role || null
    };
  });

  // User Management
  client.registerAction('createUser', {
  description: 'Create a new user account',
  parameters: {
    name: { type: 'string', description: 'User full name' },
    email: { type: 'string', description: 'User email address' },
    role: { 
      type: 'string', 
      description: 'User role',
      optional: true,
      enum: ['admin', 'customer']
    }
  }
}, async ({ name, email, role = 'customer' }) => {
  const user = createUser({ name, email, role });
  console.log('✅ User created:', user);
});

// Product Search
client.registerAction('searchProducts', {
  description: 'Search for products with various filters. Can filter by query, price range, stock status, and sale status. Returns full product information including descriptions, tags, prices, ratings, and availability. CRITICAL: Automatically routes admin users to /admin/products and regular customers to /search. IMPORTANT: All search queries must be in English.',
  parameters: {
    query: { 
      type: 'string', 
      description: 'Search query to match product names, categories, or tags. Must be in English (e.g., "laptop", "wireless mouse", "electronics", "charging", "ssd")',
      optional: true
    },
    minPrice: {
      type: 'number',
      description: 'Minimum price filter',
      optional: true
    },
    maxPrice: {
      type: 'number',
      description: 'Maximum price filter',
      optional: true
    },
    inStock: {
      type: 'boolean',
      description: 'Only show in-stock items',
      optional: true
    },
    onSale: {
      type: 'boolean',
      description: 'Only show products that are on sale (discounted)',
      optional: true
    }
  }
}, async ({ query, minPrice, maxPrice, inStock, onSale }) => {
  const normalizedQuery = normalizeOptionalString(query);
  const normalizedMinPrice = normalizeOptionalNumber(minPrice);
  const normalizedMaxPrice = normalizeOptionalNumber(maxPrice);
  const normalizedInStock = normalizeOptionalBoolean(inStock);
  const normalizedOnSale = normalizeOptionalBoolean(onSale);

  // Check if user is admin to determine navigation target
  const currentUser = authStore.currentUser;
  const isAdmin = currentUser?.role === 'admin';
  
  // Search products using the store function
  const products = searchProducts({
    query: normalizedQuery,
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
    inStock: normalizedInStock,
    onSale: normalizedOnSale
  });
  
  // Build search params
  const searchParams: any = {};
  if (normalizedQuery) searchParams.q = normalizedQuery;
  if (normalizedMinPrice !== undefined) searchParams.minPrice = normalizedMinPrice;
  if (normalizedMaxPrice !== undefined) searchParams.maxPrice = normalizedMaxPrice;
  if (normalizedInStock !== undefined) searchParams.inStock = normalizedInStock;
  if (normalizedOnSale !== undefined) searchParams.onSale = normalizedOnSale;
  
  // Route admin users to admin product management page, regular users to search page
  const targetPath = isAdmin ? '/admin/products' : '/search';
  const queryString = new URLSearchParams(searchParams).toString();
  const fullPath = queryString ? `${targetPath}?${queryString}` : targetPath;
  
  await client.navigate(fullPath);
  console.log(`🔍 Searching products (${isAdmin ? 'ADMIN' : 'CUSTOMER'}):`, searchParams);
  console.log(`📍 Navigated to: ${fullPath}`);
  console.log(`📦 Found ${products.length} products`);
  
  // Return full product information with formatted prices for the AI
  return {
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      priceFormatted: `$${product.price.toFixed(2)}`,
      originalPrice: product.originalPrice,
      originalPriceFormatted: product.originalPrice ? `$${product.originalPrice.toFixed(2)}` : null,
      onSale: product.onSale || false,
      discountPercent: product.discountPercent,
      inStock: product.inStock,
      rating: product.rating,
      reviews: product.reviews,
      tags: product.tags || [],
      image: product.image,
      // Calculate savings if on sale
      savings: product.onSale && product.originalPrice 
        ? product.originalPrice - product.price 
        : null,
      savingsFormatted: product.onSale && product.originalPrice 
        ? `$${(product.originalPrice - product.price).toFixed(2)}` 
        : null,
    })),
    isAdmin,
    navigatedTo: fullPath
  };
});

// Cart Management
client.registerAction('addToCart', {
  description: 'Add a product to the shopping cart',
  parameters: {
    productId: { type: 'string', description: 'Product ID' },
    quantity: { 
      type: 'number', 
      description: 'Quantity to add',
      optional: true
    }
  }
}, async ({ productId, quantity = 1 }) => {
  addToCart(productId, quantity);
  console.log('🛒 Added to cart:', { productId, quantity });
});

client.registerAction('removeFromCart', {
  description: 'Remove a product from the shopping cart',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  removeFromCart(productId);
  console.log('🗑️ Removed from cart:', productId);
});

client.registerAction('updateCartQuantity', {
  description: 'Update the quantity of a product in the cart',
  parameters: {
    productId: { type: 'string', description: 'Product ID' },
    quantity: { type: 'number', description: 'New quantity' }
  }
}, async ({ productId, quantity }) => {
  updateCartItemQuantity(productId, quantity);
  console.log('📝 Updated cart quantity:', { productId, quantity });
});

client.registerAction('clearCart', {
  description: 'Clear all items from the shopping cart',
  parameters: {}
}, async () => {
  clearCart();
  console.log('🧹 Cart cleared');
});

client.registerAction('getCart', {
  description: 'Get all items in the shopping cart with product details including prices. Also navigates to the cart page so the user can visually see their cart.',
  parameters: {}
}, async () => {
  const cart = getCartWithProducts();
  console.log('🛒 Cart contents:', cart);

  // Navigate to cart page so user can visually see the cart
  await client.navigate('/cart');
  console.log('📍 Navigated to cart page');

  // Format prices for better AI readability
  return cart.map((item: any) => ({
    ...item,
    product: item.product ? {
      ...item.product,
      priceFormatted: `$${item.product.price.toFixed(2)}`,
      originalPriceFormatted: item.product.originalPrice ? `$${item.product.originalPrice.toFixed(2)}` : null,
      lineTotal: (item.product.price * item.quantity).toFixed(2),
      lineTotalFormatted: `$${(item.product.price * item.quantity).toFixed(2)}`
    } : null
  }));
});

client.registerAction('getCurrentPage', {
  description: 'Get information about the current page including route path and any parameters',
  parameters: {}
}, async () => {
  const location = router.state.location;
  console.log('📍 Current page:', location);
  return {
    path: location.pathname,
    search: location.search,
    fullPath: location.href,
  };
});

// Product Navigation
client.registerAction('viewProduct', {
  description: 'View details of a specific product',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  await client.navigate(`/product/${productId}`);
  console.log('📦 Viewing product:', productId);
});


client.registerAction('findProductsInPriceRange', {
  description: 'Find products within a price range. CRITICAL: Automatically routes admin users to /admin/products and regular customers to /search.',
  parameters: {
    minPrice: { type: 'number', description: 'Minimum price' },
    maxPrice: { type: 'number', description: 'Maximum price' }
  }
}, async ({ minPrice, maxPrice }) => {
  const normalizedMinPrice = normalizeOptionalNumber(minPrice);
  const normalizedMaxPrice = normalizeOptionalNumber(maxPrice);

  if (normalizedMinPrice === undefined || normalizedMaxPrice === undefined) {
    throw new Error('minPrice and maxPrice must be valid numbers');
  }

  // Check if user is admin to determine navigation target
  const currentUser = authStore.currentUser;
  const isAdmin = currentUser?.role === 'admin';
  
  // Route admin users to admin product management page, regular users to search page
  const targetPath = isAdmin ? '/admin/products' : '/search';
  const queryString = `minPrice=${normalizedMinPrice}&maxPrice=${normalizedMaxPrice}`;
  const fullPath = `${targetPath}?${queryString}`;
  
  await client.navigate(fullPath);
  console.log(`💰 Price range (${isAdmin ? 'ADMIN' : 'CUSTOMER'}):`, { minPrice: normalizedMinPrice, maxPrice: normalizedMaxPrice });
  console.log(`📍 Navigated to: ${fullPath}`);
});

// User Navigation (Admin)
client.registerAction('viewUser', {
  description: 'View details of a specific user (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID' }
  }
}, async ({ userId }) => {
  await client.navigate(`/users/${userId}`);
  console.log('👤 Viewing user:', userId);
});

// ============================================
// ADMIN ACTIONS (Admin Only)
// ============================================

// Helper function to check if current user is admin
function checkAdminAccess(): boolean {
  const currentUser = authStore.currentUser;
  return currentUser?.role === 'admin';
}

// Admin Product Management
client.registerAction('adminCreateProduct', {
  description: 'Create a new product in the catalog (admin only)',
  parameters: {
    name: { type: 'string', description: 'Product name' },
    description: { type: 'string', description: 'Product description' },
    price: { type: 'number', description: 'Product price' },
    category: { type: 'string', description: 'Product category' },
    image: { type: 'string', description: 'Product image URL' },
    inStock: { 
      type: 'boolean', 
      description: 'Whether product is in stock',
      optional: true
    },
    rating: { 
      type: 'number', 
      description: 'Product rating (0-5)',
      optional: true
    },
    reviews: { 
      type: 'number', 
      description: 'Number of reviews',
      optional: true
    }
  }
}, async ({ name, description, price, category, image, inStock = true, rating = 0, reviews = 0 }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const product = createProduct({ name, description, price, category, image, inStock, rating, reviews });
  await client.navigate('/admin/products');
  console.log('✅ Product created:', product);
  return product;
});

client.registerAction('adminUpdateProduct', {
  description: 'Update an existing product (admin only)',
  parameters: {
    productId: { type: 'string', description: 'Product ID to update' },
    name: { type: 'string', description: 'Product name', optional: true },
    description: { type: 'string', description: 'Product description', optional: true },
    price: { type: 'number', description: 'Product price', optional: true },
    category: { type: 'string', description: 'Product category', optional: true },
    image: { type: 'string', description: 'Product image URL', optional: true },
    inStock: { type: 'boolean', description: 'Whether product is in stock', optional: true },
    rating: { type: 'number', description: 'Product rating (0-5)', optional: true },
    reviews: { type: 'number', description: 'Number of reviews', optional: true },
    onSale: { type: 'boolean', description: 'Whether product is on sale', optional: true },
    discountPercent: { type: 'number', description: 'Discount percentage', optional: true },
    originalPrice: { type: 'number', description: 'Original price before discount', optional: true },
    tags: { type: 'array', description: 'Product tags', optional: true }
  }
}, async ({ productId, ...updates }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const updated = updateProduct(productId, updates);
  if (!updated) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  await client.navigate('/admin/products');
  console.log('✅ Product updated:', updated);
  return updated;
});

client.registerAction('adminDeleteProduct', {
  description: 'Delete a product from the catalog (admin only)',
  parameters: {
    productId: { type: 'string', description: 'Product ID to delete' }
  }
}, async ({ productId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const deleted = deleteProduct(productId);
  if (!deleted) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  await client.navigate('/admin/products');
  console.log('🗑️ Product deleted:', productId);
  return { success: true, productId };
});

client.registerAction('adminGetCategories', {
  description: 'Get all product categories (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const categories = getCategories();
  console.log('📂 Categories:', categories);
  return categories;
});

client.registerAction('adminGetProductById', {
  description: 'Get detailed information about a specific product by ID (admin only)',
  parameters: {
    productId: { type: 'string', description: 'Product ID' }
  }
}, async ({ productId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const product = getProductById(productId);
  if (!product) {
    throw new Error(`Product with ID ${productId} not found`);
  }
  console.log('📦 Product:', product);
  return product;
});

// Admin User Management
client.registerAction('adminGetAllUsers', {
  description: 'Get a list of all registered users with their details (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const users = getUsers();
  console.log(`👥 Found ${users.length} users`);
  return users.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString()
  }));
});

client.registerAction('adminGetUserById', {
  description: 'Get detailed information about a specific user by ID (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID' }
  }
}, async ({ userId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const user = getUserById(userId);
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }
  console.log('👤 User:', user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt.toISOString(),
    lastLogin: user.lastLogin?.toISOString()
  };
});

client.registerAction('adminUpdateUser', {
  description: 'Update user information (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID to update' },
    name: { type: 'string', description: 'User name', optional: true },
    email: { type: 'string', description: 'User email', optional: true },
    role: { 
      type: 'string', 
      description: 'User role',
      optional: true,
      enum: ['admin', 'user']
    }
  }
}, async ({ userId, ...updates }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const updated = updateUser(userId, updates);
  if (!updated) {
    throw new Error(`User with ID ${userId} not found`);
  }
  await client.navigate('/users');
  console.log('✅ User updated:', updated);
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    avatar: updated.avatar,
    createdAt: updated.createdAt.toISOString(),
    lastLogin: updated.lastLogin?.toISOString()
  };
});

client.registerAction('adminDeleteUser', {
  description: 'Delete a user account (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID to delete' }
  }
}, async ({ userId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const deleted = deleteUser(userId);
  if (!deleted) {
    throw new Error(`User with ID ${userId} not found`);
  }
  await client.navigate('/users');
  console.log('🗑️ User deleted:', userId);
  return { success: true, userId };
});

// Admin Cart Management
client.registerAction('adminGetAllUserCarts', {
  description: 'Get all users\' shopping carts with summary information (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const allCarts = getAllUserCarts();
  const users = getUsers();
  
  const cartsWithDetails = allCarts.map(userCart => {
    const user = users.find(u => u.id === userCart.userId);
    const total = getUserCartTotal(userCart.userId);
    const itemCount = userCart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    return {
      userId: userCart.userId,
      userName: user?.name || 'Unknown',
      userEmail: user?.email || 'Unknown',
      itemCount,
      total: total.toFixed(2),
      totalFormatted: `$${total.toFixed(2)}`,
      updatedAt: userCart.updatedAt.toISOString()
    };
  });
  
  console.log(`🛒 Found ${allCarts.length} user carts`);
  return cartsWithDetails;
});

client.registerAction('adminGetUserCart', {
  description: 'Get a specific user\'s shopping cart with product details (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID' }
  }
}, async ({ userId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const cartItems = getUserCartWithProducts(userId);
  const total = getUserCartTotal(userId);
  const user = getUserById(userId);
  
  console.log(`🛒 User cart (${userId}):`, cartItems);
  return {
    userId,
    userName: user?.name || 'Unknown',
    userEmail: user?.email || 'Unknown',
    items: cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      product: item.product ? {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        priceFormatted: `$${item.product.price.toFixed(2)}`,
        category: item.product.category,
        image: item.product.image
      } : null,
      lineTotal: item.product ? (item.product.price * item.quantity).toFixed(2) : '0.00',
      lineTotalFormatted: item.product ? `$${(item.product.price * item.quantity).toFixed(2)}` : '$0.00'
    })),
    total: total.toFixed(2),
    totalFormatted: `$${total.toFixed(2)}`
  };
});

client.registerAction('adminGetUserCartTotal', {
  description: 'Get the total value of a specific user\'s cart (admin only)',
  parameters: {
    userId: { type: 'string', description: 'User ID' }
  }
}, async ({ userId }) => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const total = getUserCartTotal(userId);
  const user = getUserById(userId);
  
  console.log(`💰 User cart total (${userId}): $${total.toFixed(2)}`);
  return {
    userId,
    userName: user?.name || 'Unknown',
    userEmail: user?.email || 'Unknown',
    total: total.toFixed(2),
    totalFormatted: `$${total.toFixed(2)}`
  };
});

// Admin Dashboard & Analytics
client.registerAction('adminGetDashboardStats', {
  description: 'Get dashboard statistics including total products, users, carts, and revenue metrics (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  const products = searchProducts({});
  const users = getUsers();
  const allCarts = getAllUserCarts();
  
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalUsers = users.length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const regularUsers = totalUsers - adminUsers;
  const totalCarts = allCarts.length;
  const usersWithCarts = users.filter(user => 
    allCarts.some(uc => uc.userId === user.id)
  ).length;
  
  const totalCartValue = users.reduce((sum, user) => {
    return sum + getUserCartTotal(user.id);
  }, 0);
  
  const totalItemsInCarts = allCarts.reduce(
    (sum, uc) => sum + uc.items.reduce((s, item) => s + item.quantity, 0),
    0
  );
  
  console.log('📊 Dashboard stats calculated');
  return {
    products: {
      total: totalProducts,
      inStock: inStockProducts,
      outOfStock: outOfStockProducts
    },
    users: {
      total: totalUsers,
      admins: adminUsers,
      regular: regularUsers
    },
    carts: {
      total: totalCarts,
      usersWithCarts,
      totalItems: totalItemsInCarts,
      potentialRevenue: totalCartValue.toFixed(2),
      potentialRevenueFormatted: `$${totalCartValue.toFixed(2)}`
    }
  };
});

// Admin Navigation
client.registerAction('adminNavigateToDashboard', {
  description: 'Navigate to the admin dashboard (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  await client.navigate('/dashboard');
  console.log('📊 Navigated to admin dashboard');
});

client.registerAction('adminNavigateToProducts', {
  description: 'Navigate to the product management page (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  await client.navigate('/admin/products');
  console.log('📦 Navigated to product management');
});

client.registerAction('adminNavigateToUsers', {
  description: 'Navigate to the users management page (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  await client.navigate('/users');
  console.log('👥 Navigated to users management');
});

client.registerAction('adminNavigateToCarts', {
  description: 'Navigate to the cart viewer page (admin only)',
  parameters: {}
}, async () => {
  if (!checkAdminAccess()) {
    throw new Error('Admin access required');
  }
  await client.navigate('/admin/carts');
  console.log('🛒 Navigated to cart viewer');
});
}

// Log initialization after actions are registered (called when setAppId is invoked)
function logInitialization() {
  console.log(`🧩 Demo config preset: ${selectedDemoConfigId} (${selectedDemoConfig.label})`);
  console.log(`   ${selectedDemoConfig.description}`);
  const client = getVowel();
  if (!client) return;
  
  const actionsConfig = client.getActionsConfig();
  const actionCount = Object.keys(actionsConfig).length;
  const adminActions = Object.keys(actionsConfig).filter(name => name.startsWith('admin'));
  
  console.log('🎤 Vowel voice agent initialized with:');
  console.log(`  - ${client.routes.length} routes (auto-detected from TanStack Router)`);
  console.log(`  - ${actionCount} total actions`);
  console.log(`  - ${adminActions.length} admin actions`);
  console.log('  - Architecture: Dual Adapter (Navigation + Automation)');
  console.log('');
  console.log('📍 Navigation Actions (from TanStackNavigationAdapter):');
  console.log('    • navigate_to_page - Navigate between pages');
  console.log('');
  console.log('🤖 Page Automation Actions (from DirectAutomationAdapter):');
  console.log('    • search_page_elements - Find elements on the page');
  console.log('    • get_page_snapshot - Get page structure');
  console.log('    • click_element - Click buttons, links, etc.');
  console.log('    • type_into_element - Fill in forms');
  console.log('    • focus_element - Focus inputs');
  console.log('    • scroll_to_element - Scroll to elements');
  console.log('    • press_key - Press keyboard keys');
  console.log('');
  console.log('👤 User Context Actions:');
  console.log('    • getCurrentUserContext - Check if user is admin (CRITICAL: call this first!)');
  console.log('');
  console.log('🛍️ Shopping Actions:');
  console.log('    • searchProducts - Search and filter products (admin-aware routing)');
  console.log('    • viewProduct - View product details');
  console.log('    • findProductsInPriceRange - Find products by price range (admin-aware routing)');
  console.log('    • addToCart - Add product to cart');
  console.log('    • getCart - Get cart contents');
  console.log('    • removeFromCart - Remove from cart');
  console.log('    • updateCartQuantity - Update cart item quantity');
  console.log('    • clearCart - Clear shopping cart');
  console.log('');
  if (adminActions.length > 0) {
    console.log('👑 Admin Actions (Admin Only):');
    console.log('    • adminCreateProduct - Create new product');
    console.log('    • adminUpdateProduct - Update product');
    console.log('    • adminDeleteProduct - Delete product');
    console.log('    • adminGetCategories - Get product categories');
    console.log('    • adminGetAllUsers - List all users');
    console.log('    • adminGetUserById - Get user details');
    console.log('    • adminUpdateUser - Update user');
    console.log('    • adminDeleteUser - Delete user');
    console.log('    • adminGetAllUserCarts - View all user carts');
    console.log('    • adminGetUserCart - Get user cart details');
    console.log('    • adminGetUserCartTotal - Get user cart total');
    console.log('    • adminGetDashboardStats - Get dashboard statistics');
    console.log('    • adminNavigateToDashboard - Go to dashboard');
    console.log('    • adminNavigateToProducts - Go to product management');
    console.log('    • adminNavigateToUsers - Go to user management');
    console.log('    • adminNavigateToCarts - Go to cart viewer');
    console.log('');
  }
  console.log('🎯 Try voice commands like:');
  console.log('    • "Go to products"');
  console.log('    • "Click the first add to cart button"');
  console.log('    • "Type \'laptop\' in the search box"');
  console.log('    • "Search for accessories"');
  if (adminActions.length > 0) {
    console.log('    • "Show me dashboard stats" (admin)');
    console.log('    • "Create a new product" (admin)');
    console.log('    • "List all users" (admin)');
    console.log('    • "Show me all user carts" (admin)');
  }
  console.log('');
  console.log('📖 See VOICE_AUTOMATION_GUIDE.md for full documentation');
}

// Export the configured client
export default vowel;
