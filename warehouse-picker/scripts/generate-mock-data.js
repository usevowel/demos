/**
 * Generate mock data with exactly 450 SKUs
 * - 25 shelves (A1-E5) arranged in 5x5 grid
 * - Each shelf: 6 rows × 3 items wide = 18 locations
 * - Total: 25 × 18 = 450 SKUs
 */

const fs = require('fs');
const path = require('path');

const SHELVES = ['A', 'B', 'C', 'D', 'E'];
const ROWS_PER_SHELF = 6;
const ITEMS_PER_ROW = 3;
const TOTAL_SHELVES = 25;
const TOTAL_LOCATIONS = TOTAL_SHELVES * ROWS_PER_SHELF * ITEMS_PER_ROW; // 450

// Product name templates
const PRODUCT_TEMPLATES = [
  'USB Charger', 'Smart Phone', 'Bluetooth Speaker', 'Smart Mouse', 'Wireless Adapter',
  'Rechargeable Speaker', 'Portable Phone', 'Bluetooth Tablet', 'Bluetooth Mouse', 'LED Adapter',
  'Rechargeable Cable', 'Digital Phone', 'USB Monitor', 'Bluetooth Adapter', 'LED Keyboard',
  'Smart Cable', 'Wireless Mouse', 'USB Speaker', 'Portable Tablet', 'Digital Adapter',
  'Smart Monitor', 'Bluetooth Keyboard', 'LED Mouse', 'USB Tablet', 'Wireless Speaker',
  'Rechargeable Mouse', 'Portable Adapter', 'Digital Speaker', 'Smart Adapter', 'Bluetooth Monitor',
  'LED Cable', 'USB Keyboard', 'Wireless Tablet', 'Rechargeable Monitor', 'Portable Keyboard',
  'Digital Mouse', 'Smart Tablet', 'Bluetooth Cable', 'LED Speaker', 'USB Adapter',
  'Wireless Keyboard', 'Rechargeable Tablet', 'Portable Mouse', 'Digital Cable', 'Smart Speaker'
];

const DESCRIPTIONS = [
  'Reliable electronics product built to last',
  'Modern electronics design with superior functionality',
  'Professional-grade electronics solution',
  'Efficient electronics product with great value',
  'Versatile electronics solution for various applications',
  'High-quality electronics product perfect for everyday use',
  'Premium electronics device with advanced features',
  'Durable electronics solution for professional use',
  'Innovative electronics product with cutting-edge technology',
  'Compact electronics device ideal for on-the-go use'
];

const CATEGORIES = ['electronics', 'accessories', 'computers', 'mobile', 'audio'];

/**
 * Generate a unique SKU ID
 * Format: E-0001 (simplified for voice input - "e dash zero zero zero one")
 */
function generateSKUId(index) {
  const padded = String(index).padStart(4, '0');
  return `E-${padded}`;
}

/**
 * Generate a product name (cycle through templates)
 */
function generateProductName(index) {
  return PRODUCT_TEMPLATES[index % PRODUCT_TEMPLATES.length];
}

/**
 * Generate a description (cycle through templates)
 */
function generateDescription(index) {
  return DESCRIPTIONS[index % DESCRIPTIONS.length];
}

/**
 * Generate a category (cycle through categories)
 */
function generateCategory(index) {
  return CATEGORIES[index % CATEGORIES.length];
}

/**
 * Generate a random quantity between 1 and 20
 */
function generateQuantity() {
  return Math.floor(Math.random() * 20) + 1;
}

/**
 * Generate all SKUs with locations
 */
function generateSKUs() {
  const skus = [];
  let skuIndex = 1;

  // Iterate through all shelves (A1-E5)
  for (let shelfRow = 0; shelfRow < 5; shelfRow++) {
    for (let shelfCol = 0; shelfCol < 5; shelfCol++) {
      const shelfId = `${SHELVES[shelfRow]}${shelfCol + 1}`;
      
      // Each shelf has 6 rows
      for (let row = 1; row <= ROWS_PER_SHELF; row++) {
        // Each row has 3 items (bins)
        for (let bin = 1; bin <= ITEMS_PER_ROW; bin++) {
          const location = `${shelfId}-R${row}-B${bin}`;
          const quantity = generateQuantity();
          
          skus.push({
            id: generateSKUId(skuIndex),
            name: generateProductName(skuIndex - 1),
            description: generateDescription(skuIndex - 1),
            category: generateCategory(skuIndex - 1),
            locations: [
              {
                location: location,
                quantity: quantity,
                maxQuantity: quantity
              }
            ]
          });
          
          skuIndex++;
        }
      }
    }
  }

  return skus;
}

// Generate the mock data
const mockData = {
  skus: generateSKUs()
};

// Verify we have exactly 450 SKUs
if (mockData.skus.length !== TOTAL_LOCATIONS) {
  console.error(`Error: Expected ${TOTAL_LOCATIONS} SKUs, got ${mockData.skus.length}`);
  process.exit(1);
}

// Write to file
const outputPath = path.join(__dirname, '../assets/mock-data.json');
fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2), 'utf8');

console.log(`✓ Generated ${mockData.skus.length} SKUs`);
console.log(`✓ Total item locations: ${TOTAL_LOCATIONS}`);
console.log(`✓ File written to: ${outputPath}`);

// Verify unique locations
const locations = new Set(mockData.skus.map(sku => sku.locations[0].location));
if (locations.size !== TOTAL_LOCATIONS) {
  console.error(`Error: Expected ${TOTAL_LOCATIONS} unique locations, got ${locations.size}`);
  process.exit(1);
}
console.log(`✓ Verified ${locations.size} unique locations`);
