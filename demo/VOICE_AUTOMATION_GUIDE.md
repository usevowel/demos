# Voice Automation Guide - Demo App

This demo app is fully configured with **voice-controlled page automation** using the `DirectAutomationAdapter`. This means you can control the app entirely with your voice!

## 🎯 What's Enabled

The demo uses the **Dual Adapter Architecture**:

1. **NavigationAdapter** (TanStack Router)
   - Voice-controlled routing between pages
   - Automatic route detection

2. **AutomationAdapter** (DirectAutomationAdapter)
   - Same-page DOM interaction
   - Search for elements by description
   - Click buttons and links
   - Fill in forms
   - Focus elements
   - Scroll to elements
   - Press keyboard keys

## 🌐 Language Requirements

**⚠️ Important:** All tool inputs (search queries, form inputs, and other tool parameters) must be in **English**. 

- While you can speak to the voice agent in any language, tool inputs will be converted to English
- Search queries: Use English terms (e.g., "laptop", "wireless mouse", "electronics")
- Form inputs: Product names, categories, prices should be in English
- Tool parameters: All action parameters are expected to be in English

## 🎤 Voice Commands You Can Use

### Navigation Commands

Navigate between pages:
- "Go to products"
- "Take me to the search page"
- "Navigate to cart"
- "Show me the dashboard"
- "Go to sign in page"
- "Take me home"

### Page Interaction Commands

#### On Products Page
- "Click the first add to cart button"
- "Add the wireless headphones to cart"
- "Show me electronics products"
- "Click the clothing category"

#### On Search Page
- "Search for laptop"
- "Type 'wireless mouse' in the search box"
- "Select electronics category"
- "Set minimum price to 50"
- "Set maximum price to 200"
- "Check the in stock only checkbox"
- "Click the search button"
- "Clear filters"
- "Add the first product to cart"

#### On Cart Page
- "Remove the first item"
- "Update quantity to 3"
- "Clear the cart"
- "Proceed to checkout"

#### On Sign In/Sign Up Pages
- "Type my email as john@example.com"
- "Fill in password"
- "Click sign in"
- "Go to sign up page"

### Combined Commands

The AI can understand complex, multi-step commands:
- "Go to search and find laptops under $1000"
- "Navigate to products and add wireless headphones to cart"
- "Search for electronics and show me only in-stock items"
- "Go to cart and remove the first item"

## 🔧 How It Works

### Configuration

The automation is configured in `src/vowel.client.ts`:

```typescript
const { navigationAdapter, automationAdapter } = createTanStackAdapters({
  router,
  enableAutomation: true  // ✅ This enables page automation
});

export const vowel = new Vowel({
  appId: DEMO_APP_ID,
  navigationAdapter,   // Handles navigation
  automationAdapter,   // Handles page interaction
});
```

### Built-in Automation Actions

When `automationAdapter` is provided, Vowel automatically registers these actions:

1. **`search_page_elements`**
   - Search for elements on the current page
   - Uses fuzzy matching to find elements by text, labels, placeholders, etc.
   - Example: "search for add to cart button"

2. **`get_page_snapshot`**
   - Get a text representation of the current page structure
   - Helps the AI understand what's on the page
   - Automatically called when needed

3. **`click_element`**
   - Click any element on the page
   - Example: "click the search button"

4. **`type_into_element`**
   - Type text into input fields, textareas, etc.
   - Example: "type 'laptop' in the search box"

5. **`focus_element`**
   - Focus an input or interactive element
   - Example: "focus the email field"

6. **`scroll_to_element`**
   - Scroll to bring an element into view
   - Example: "scroll to the footer"

7. **`press_key`**
   - Press keyboard keys (Enter, Escape, etc.)
   - Example: "press enter"

### Element Search Algorithm

The `DirectAutomationAdapter` uses intelligent fuzzy search to find elements:

- **Text Content**: Matches visible text in buttons, links, etc.
- **Placeholders**: Matches placeholder text in inputs
- **ARIA Labels**: Matches accessibility labels
- **IDs and Classes**: Matches element IDs and class names
- **Fuzzy Matching**: Uses Levenshtein distance for typo tolerance
- **Similarity Scoring**: Ranks results by relevance

Example searches:
- "add to cart" → Finds buttons with "Add to Cart" text
- "search box" → Finds inputs with "Search" placeholder
- "electronics" → Finds category badges or links with "Electronics"
- "first product" → Finds the first product card

## 🎨 Interactive Elements in Demo

### Products Page (`/products`)
- ✅ Category badges (clickable)
- ✅ Product cards (clickable links)
- ✅ "Add to Cart" buttons
- ✅ "Sign in to purchase" links
- ✅ Product images
- ✅ Rating displays

### Search Page (`/search`)
- ✅ Search input field
- ✅ Category dropdown
- ✅ Min/Max price inputs
- ✅ "In Stock Only" checkbox
- ✅ "Search" button
- ✅ "Clear Filters" button
- ✅ Product results grid
- ✅ "Add to Cart" buttons

### Cart Page (`/cart`)
- ✅ Quantity inputs
- ✅ "Remove" buttons
- ✅ "Clear Cart" button
- ✅ "Checkout" button
- ✅ Product links

### Sign In/Sign Up Pages
- ✅ Email input
- ✅ Password input
- ✅ Name input (sign up)
- ✅ Submit buttons
- ✅ Navigation links

## 🧪 Testing Voice Automation

### Basic Test Flow

1. **Start the demo**:
   ```bash
   bun run dev
   ```

2. **Click the microphone button** in the navbar

3. **Try these commands in order**:
   - "Go to products" → Should navigate to products page
   - "Click the first add to cart button" → Should add product to cart
   - "Go to cart" → Should navigate to cart
   - "Remove the first item" → Should remove item from cart

### Advanced Test Flow

1. **Search and filter**:
   - "Go to search"
   - "Type 'wireless' in the search box"
   - "Select electronics category"
   - "Set maximum price to 100"
   - "Click search"

2. **Complex interaction**:
   - "Go to products and add the first item to cart"
   - "Navigate to cart and update quantity to 3"

## 🐛 Troubleshooting

### Voice commands not working?

1. **Check console logs**:
   - Look for `🤖 [DirectAutomationAdapter]` messages
   - Check for search results and action executions

2. **Verify automation is enabled**:
   - Open browser console
   - Type: `vowel.getActionsConfig()`
   - Should see automation actions listed

3. **Check microphone permissions**:
   - Browser must have microphone access
   - Check browser settings

### Element not found?

1. **Try different descriptions**:
   - Instead of "add to cart", try "add button"
   - Instead of "search box", try "search input"

2. **Check element visibility**:
   - Element must be visible on the page
   - Scroll to make it visible first

3. **Use more specific descriptions**:
   - "first add to cart button"
   - "search button in the form"

## 📊 Console Logging

The automation adapter logs all actions to the console:

```
🤖 [DirectAutomationAdapter] Initialized for same-tab DOM interaction
🤖 [DirectAutomationAdapter] Searching for: "add to cart button"
   ✅ Found 12 elements
🤖 [DirectAutomationAdapter] Clicking element: btn_add_cart_1
   ✅ Click successful
```

Watch the console to see what's happening behind the scenes!

## 🚀 Next Steps

### Extend with Custom Actions

You can add more custom actions in `vowel.client.ts`:

```typescript
vowel.registerAction('quickCheckout', {
  description: 'Quick checkout with saved payment method',
  parameters: {}
}, async () => {
  // Your custom logic
  await vowel.navigate('/cart');
  // Click checkout button
  // Fill in payment info
  // Submit order
});
```

### Improve Element Targeting

Add more descriptive attributes to your HTML:

```tsx
// ✅ Good - descriptive text
<button>Add to Cart</button>

// ✅ Better - with aria-label
<button aria-label="Add wireless headphones to cart">
  Add to Cart
</button>

// ✅ Best - with data attributes
<button 
  aria-label="Add wireless headphones to cart"
  data-product-name="Wireless Headphones"
>
  Add to Cart
</button>
```

## 📚 Related Documentation

- [Adapter Architecture Guide](../../client/docs/guides/ADAPTER_ARCHITECTURE.md)
- [API Reference](../../client/docs/guides/API_REFERENCE.md)
- [Getting Started](../../client/docs/guides/GETTING_STARTED.md)

## 🎉 Summary

This demo is **fully voice-enabled** with:
- ✅ Voice navigation between pages
- ✅ Voice-controlled page interaction
- ✅ Intelligent element search
- ✅ Form filling and button clicking
- ✅ Complex multi-step commands
- ✅ Real-time console logging

**Try it out and experience the future of web interaction!** 🚀

