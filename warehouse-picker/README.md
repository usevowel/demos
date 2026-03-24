# Warehouse Picker Demo

A voice-powered e-commerce experience for auto parts shopping with vehicle management and voice-controlled cart operations.

## Features

- 🛍️ **Product Catalog** - Browse and search auto parts (batteries, brake pads, oil, etc.)
- 🚗 **Vehicle Management** - Add and select vehicles for parts compatibility checking
- 🛒 **Shopping Cart** - Voice-controlled cart with 3 delivery methods:
  - Store Pickup (FREE, ready in 30 mins)
  - Same Day Delivery ($8.99 per item)
  - Home Delivery (FREE for orders over $35)
- 💰 **Discount Codes** - Apply and manage promotional codes
- ❤️ **Wishlist** - Save items for later with vehicle associations
- 📜 **Purchase History** - View previous orders and reorder
- 🔧 **Compatibility Check** - Verify parts fit selected vehicles

## Voice Commands

Try these voice commands to shop with your voice:

### Product Search
- "Search for H6-AGM battery"
- "Show me brake pads"
- "Find products under $50"
- "Filter by brand DieHard"
- "Show oil filters"

### Cart Management
- "Add battery to cart with home delivery"
- "Add 2 brake pads to cart"
- "What's in my cart?"
- "Remove battery from cart"
- "Update quantity to 3"
- "Apply discount code SAVE15"
- "Show cart summary"

### Vehicle Management
- "Open vehicle selector"
- "Select vehicle 1"
- "What vehicle is selected?"
- "Show my registered vehicles"

### Navigation
- "Go to home"
- "Show products"
- "Go to cart"
- "Show my wishlist"
- "View purchase history"

### Wishlist
- "Add battery to wishlist"
- "Show my wishlist"
- "Remove brake pads from wishlist"

## Tech Stack

- **React 19** - UI framework
- **TypeScript 5.9** - Type safety
- **Vite 7** - Build tool
- **TanStack Router** - File-based routing
- **Valtio** - State management with localStorage persistence
- **Tailwind CSS** - Styling
- **vowel.to** - Voice AI integration

## Getting Started

### Prerequisites

- Node.js 18+ or Bun 1.1+
- A free vowel.to App ID ([get one here](https://vowel.to))

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   # or
   bun install
   ```

2. **Configure your App ID:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your vowel.to App ID:
   ```
   VITE_VOWEL_APP_ID=your_app_id_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

5. **Activate voice:**
   Click the microphone button in the bottom-right corner to start voice interaction.

## Project Structure

```
src/
├── components/           # React UI components
│   ├── ui/              # shadcn/ui components
│   ├── Header.tsx       # App header with cart
│   ├── AppHeader.tsx    # Alternative header
│   ├── ProductList.tsx  # Product grid display
│   └── ...              # Other components
├── routes/              # TanStack Router routes
│   ├── __root.tsx       # Root layout
│   ├── index.tsx        # Home/landing page
│   ├── category.tsx     # Product category/search
│   ├── product/         # Product detail routes
│   ├── cart.tsx         # Shopping cart
│   ├── wishlist.tsx     # Wishlist page
│   └── purchases.tsx    # Purchase history
├── store/               # Valtio state stores
│   ├── cart.ts          # Shopping cart state
│   ├── vehicle.ts       # Vehicle management
│   ├── wishlist.ts      # Wishlist state
│   ├── purchases.ts     # Purchase history
│   └── mockData.ts      # Mock data initialization
├── data/                # Data files
│   ├── products.ts      # Product catalog
│   └── users.ts         # Mock user data
├── hooks/               # Custom React hooks
│   ├── useAppStateSync.ts  # Sync state to voice context
│   └── useFeatureFlagEnabled.ts # Feature flags
├── lib/                 # Utility functions
│   └── utils.ts         # Helper utilities
├── vowel.client.ts      # Voice agent configuration
├── router.ts            # TanStack Router setup
└── main.tsx             # App entry point

data/
└── auto-parts.json      # Product data (images, SKUs, etc.)
```

## Voice Integration

The demo uses `@vowel.to/client` to add voice capabilities.

### Custom Actions

25+ voice actions are registered in `vowel.client.ts`:

#### Product Search & Filtering
- `searchProducts` - Search by name, SKU, or category
- `filterProductsByCategory` - Filter by category (batteries, brakepads, etc.)
- `filterProductsByBrand` - Filter by brand name
- `filterProductsByPriceRange` - Filter by price range
- `viewProduct` - Navigate to product detail page

#### Cart Management
- `addToCart` - Add products with quantity and delivery method
- `removeFromCart` - Remove items from cart
- `updateCartItemQuantity` - Change item quantities
- `updateCartItemDeliveryMethod` - Switch delivery methods
- `applyDiscountCode` - Apply promotional codes
- `removeDiscountCode` - Remove applied codes
- `getCartSummary` - Show cart contents
- `openCartOverlay` / `closeCartOverlay` - Toggle cart sidebar

#### Vehicle Management
- `openVehicleSelector` / `closeVehicleSelector` - Toggle vehicle modal
- `selectVehicle` - Select vehicle by index

#### Wishlist
- `addToWishlist` - Save items for later
- `removeFromWishlist` - Remove from wishlist
- `viewWishlist` - Navigate to wishlist page

#### Purchases
- `viewPurchases` - View purchase history

### Configuration

Voice features are configured in `vowel.client.ts`:

```typescript
const vowel = new Vowel({
  appId: import.meta.env.VITE_VOWEL_APP_ID,
  
  instructions: `You are a helpful assistant for an auto parts e-commerce website...`,
  
  navigationAdapter: createTanStackAdapters({ router }),
  
  borderGlow: {
    enabled: true,
    color: 'rgba(255, 193, 7, 0.5)', // Amber/yellow
  },
  
  _caption: {
    enabled: true,
    position: 'top-center',
  },
})
```

## Customization

### Adding New Voice Actions

1. Open `src/vowel.client.ts`
2. Add a new action:

```typescript
vowel.registerAction(
  'myNewAction',
  {
    description: 'What this action does',
    parameters: {
      paramName: { 
        type: 'string', 
        description: 'What this parameter is for' 
      },
    },
  },
  async ({ paramName }) => {
    // Your implementation
    return {
      success: true,
      message: `Action completed`,
    }
  }
)
```

3. Update the AI instructions to mention the new action

### Theming

Customize colors in `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#ef4444',    // Red for auto parts theme
        secondary: '#f97316',  // Orange
      },
    },
  },
}
```

### Vehicle Fit Data

Vehicle compatibility is determined by:
1. Checking `vehicleFit` data in product objects
2. Falling back to deterministic hash-based fit for unknown vehicles

To add new vehicles or products, edit `src/data/products.ts`.

## Data

All data is mock data:

- **Products** - Car batteries, brake pads, rotors, oil, oil filters
- **Vehicles** - Pre-configured demo vehicles (2024 Honda Accord, etc.)
- **Users** - Mock user accounts with names
- **Purchases** - Synthetic purchase history

Data persists to localStorage via Valtio stores.

## Delivery Methods

Three delivery options are supported:

1. **Store Pickup**
   - Cost: FREE
   - Ready: 30 minutes
   - Location: In-store pickup

2. **Same Day Delivery**
   - Cost: $8.99 per item
   - Order by: 8:00 PM
   - Delivery: Same day

3. **Home Delivery**
   - Cost: FREE for orders over $35, otherwise $5.99 per item
   - Standard shipping to your address

## Troubleshooting

### Voice Not Working

1. **Check App ID:** Verify `VITE_VOWEL_APP_ID` is set in `.env`
2. **Browser Console:** Look for error messages
3. **Microphone Permission:** Ensure browser has microphone access
4. **HTTPS:** Voice requires HTTPS (localhost works for development)

### Product Images Not Loading

Product images are loaded from external URLs. If images don't load:
1. Check your internet connection
2. Verify the image URLs in `data/auto-parts.json`
3. Some images may use placeholder services

### Cart Not Persisting

Cart data is stored in localStorage via `valtio-persist`. If data doesn't persist:
1. Check browser localStorage is enabled
2. Clear localStorage and refresh: `localStorage.clear()` in browser console

## License

MIT License - See [LICENSE](../LICENSE) for details

---

Built with [vowel.to](https://vowel.to) - Voice AI for web applications
