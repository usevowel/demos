# Seed Data Directory

This directory contains all seed data in JSON format for the demo application.

## Files

### `users.json`
Contains 5 seeded users with the following structure:
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "avatar": "string (URL)",
  "role": "admin" | "user",
  "createdAt": "ISO 8601 date string",
  "lastLogin": "ISO 8601 date string"
}
```

**Users:**
1. John Doe (admin)
2. Jane Smith (user)
3. Bob Johnson (user)
4. Alice Williams (user)
5. Charlie Brown (user)

### `products.json`
Contains 10 seeded products with the following structure:
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "price": number,
  "category": "string",
  "image": "string (URL)",
  "inStock": boolean,
  "rating": number,
  "reviews": number
}
```

**Categories:**
- Electronics (17 products)
- Accessories (11 products)
- Storage (2 products)

## How It Works

### Loading in Stores

The stores import and transform the JSON data:

**`usersStore.ts`:**
```typescript
import seedUsersData from '@/data/users.json'

const seedUsers: User[] = seedUsersData.map(user => ({
  ...user,
  role: user.role as 'admin' | 'user',
  createdAt: new Date(user.createdAt),
  lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
}))
```

**`productsStore.ts`:**
```typescript
import seedProductsData from '@/data/products.json'

const seedProducts: Product[] = seedProductsData as Product[]
```

### Type Safety

TypeScript's `resolveJsonModule` option (enabled in `tsconfig.json`) ensures:
- JSON imports are type-checked
- Auto-completion works in your editor
- Invalid JSON structure is caught at compile time

## Editing Seed Data

To modify the seed data:

1. **Edit the JSON files directly** - They're easy to read and modify
2. **No code changes needed** - Just edit the JSON and restart the dev server
3. **Maintain structure** - Keep the same field names and types

### Adding Users

```json
{
  "id": "6",
  "name": "New User",
  "email": "newuser@example.com",
  "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser",
  "role": "user",
  "createdAt": "2024-06-15T00:00:00.000Z",
  "lastLogin": "2025-10-06T00:00:00.000Z"
}
```

### Adding Products

```json
{
  "id": "11",
  "name": "New Product",
  "description": "Description of the new product",
  "price": 99.99,
  "category": "Electronics",
  "image": "https://images.unsplash.com/photo-...",
  "inStock": true,
  "rating": 4.5,
  "reviews": 100
}
```

## Image URLs

Products use Unsplash images. You can:
- Use any Unsplash URL with `?w=400` for consistent sizing
- Use local images in `/public` folder
- Use any external image URL

## Benefits of JSON Seed Data

✅ **Easy to Edit** - No TypeScript knowledge needed
✅ **Version Control** - Track changes to seed data separately
✅ **Portable** - Can be used by other tools or scripts
✅ **Ready for API** - Same format you'd get from a real backend
✅ **Team Friendly** - Non-developers can modify seed data
✅ **Testing** - Easy to create different data sets

## Future Enhancements

When connecting to a real backend:
1. Keep these JSON files for development/testing
2. Add a flag to switch between JSON seed data and API calls
3. Use JSON files for unit tests and mocks

---

**Note:** The stores create copies of the seed data (`[...seedUsers]`), so you can safely modify the store state during runtime without affecting the original seed data.
