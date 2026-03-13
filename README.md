# Grocery Tracker

A local-first web application for tracking household grocery inventory. Built with Next.js, TypeScript, and SQLite (via sql.js), running entirely in the browser with IndexedDB persistence.

## Features

- **Local-First**: All data stored locally in your browser using IndexedDB
- **Privacy-Focused**: No external servers or cloud dependencies
- **Household Management**: Create and manage multiple households with owner/member roles
- **Household Switching**: Easily switch between households with visual role indicators
- **User Switching**: Switch between different user accounts for testing and multi-user scenarios
- **Inline Household Creation**: Create new households directly from the household selector sidebar
- **Household Settings Modal**: Access comprehensive household management via settings button in navigation bar with side-by-side Create/Join layout
- **Membership System**: Join households via reference codes, manage pending requests
- **Inventory Tracking**: Track grocery items with stock levels and categories
- **Smart Notifications**: Get alerts for low stock and expiring items
- **Item History**: Complete audit trail of all stock transactions with user attribution
- **Multi-User**: Support for household owners and members with role-based permissions
- **Integrated Navigation**: Single-page application with view routing for Inventory, Alerts, Members, and Join views

## Tech Stack

- **Next.js 14**: React framework with static export for client-side only operation
- **TypeScript**: Type-safe development
- **sql.js**: SQLite compiled to WebAssembly for browser-based database
- **IndexedDB**: Persistent local storage
- **Tailwind CSS**: Utility-first styling
- **Vitest**: Testing framework
- **fast-check**: Property-based testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

This creates a static export in the `out/` directory that can be served by any static file server.

### Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

The test environment is configured with:
- **jsdom**: Browser-like environment for testing React components
- **fake-indexeddb**: Mock IndexedDB implementation for testing database operations
- **Global test setup**: Automatically configured via `tests/setup.ts`
- **Environment-aware sql.js loading**: Tests load WebAssembly from local node_modules, browser loads from `/sql-wasm/` directory

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── layout.tsx      # Root layout with metadata
│   ├── page.tsx        # Main application with navigation and view routing
│   └── globals.css     # Global styles with Tailwind directives
├── components/         # React UI components
│   ├── HouseholdSelector.tsx    # Household switcher with role display and inline creation
│   ├── HouseholdManagement.tsx  # Household management with side-by-side Create/Join layout
│   ├── JoinHouseholdForm.tsx    # Join household by reference code
│   ├── MembershipPanel.tsx      # Manage members and requests
│   ├── NotificationCenter.tsx   # User notifications display
│   ├── NotificationsPanel.tsx   # Low stock and expiring items
│   ├── InventoryView.tsx        # Main inventory display
│   ├── CategorySection.tsx      # Category-grouped items
│   ├── GroceryItemCard.tsx      # Individual item card
│   ├── ItemForm.tsx             # Create/edit item form
│   └── ItemHistoryModal.tsx     # Item transaction history
├── context/           # React Context providers
│   └── AppContext.tsx # Global state management
├── services/          # Database and business logic
│   ├── database/      # Modular database layer
│   │   ├── core/      # Database initialization, query execution, schema
│   │   ├── repositories/ # Data access layer (CRUD operations)
│   │   ├── services/  # Business logic layer
│   │   └── index.ts   # Unified API facade
│   └── utils/         # Utility functions (ID generation, etc.)
├── types/             # TypeScript type definitions
└── tests/             # Test files
```

## Architecture

The application uses a modular layered architecture:

1. **UI Layer**: React components for user interaction
   - Main application layout with navigation bar (`app/page.tsx`)
   - View routing for Inventory, Alerts, Members, and Join views
   - Reusable components for household management, inventory, and notifications
2. **State Layer**: React Context for global state management
3. **Service Layer**: Business logic and orchestration (`services/database/services/`)
4. **Repository Layer**: Data access and CRUD operations (`services/database/repositories/`)
5. **Core Layer**: Database infrastructure (`services/database/core/`)
6. **SQLite Layer**: sql.js executing SQL queries in WebAssembly
7. **Storage Layer**: IndexedDB for persistent local storage

### Main Application Layout

The main page (`app/page.tsx`) provides:
- **Navigation Bar**: Household selector, notification center, settings button, and view navigation
- **View Routing**: Switch between different application views:
  - **Inventory**: Main inventory view with category-grouped items
  - **Alerts**: Low stock and expiring items notifications
  - **Members**: Household membership management (owner only)
  - **Join**: Join household by reference code
- **Settings Modal**: Access household management (view all, switch, delete) via gear icon in navigation
- **Responsive Layout**: Sidebar for household selector, main content area for active view

### Service Layer Design

The database layer follows a modular architecture with clear separation of concerns:

- **Core Layer** (`services/database/core/`): Database initialization, query execution, schema management
- **Repository Layer** (`services/database/repositories/`): Pure data access, one repository per entity
- **Service Layer** (`services/database/services/`): Business logic, orchestrates multiple repositories
- **Facade Layer** (`services/database/index.ts`): Unified API, single entry point for consumers

## Data Model

The application uses TypeScript interfaces defined in `types/index.ts` to ensure type safety across all layers.

### Core Entities

- **User**: Represents a person using the application
  - `id`, `name`, `createdAt`

- **Household**: A shared grocery inventory space
  - `id`, `name`, `referenceCode`, `ownerId`, `createdAt`
  - Each household has one owner and can have multiple members
  - Reference codes are 6-character alphanumeric codes for inviting members

- **HouseholdMembership**: Links users to households with roles
  - `userId`, `householdId`, `role` (owner/member), `status` (active/pending)
  - Supports both direct member addition and request-based workflow

- **Category**: Organizes grocery items with visual colors
  - `id`, `name`, `color`, `householdId`, `createdAt`

- **GroceryItem**: Individual inventory items
  - `id`, `name`, `categoryId`, `householdId`, `restockThreshold`, `unit`
  - Optional: `notes`, `expirationDate`, `stockLevel`

- **StockTransaction**: Records all inventory changes
  - `groceryItemId`, `userId`, `transactionType` (add/use), `quantity`, `timestamp`

- **Notification**: System notifications for users
  - `userId`, `householdId`, `type`, `message`, `isRead`, `createdAt`

### Helper Types

- **GroceryItemInput**: Input type for creating grocery items
- **StockTransactionWithUser**: Transaction with associated user details
- **ItemHistory**: Complete history of an item including all transactions
- **NotificationStatus**: Computed status for low stock and expiration alerts
- **HouseholdWithRole**: Household with user's role information

## Database Service API

The database service provides a unified API through `services/database/index.ts` (facade pattern).

### Import

```typescript
import { db } from '@/services/database';
// or for backward compatibility:
import { databaseService } from '@/services/database';
```

### Utility Functions

The `services/utils/` directory contains shared utility functions:

- **id-generator.ts**: Unique identifier generation
  - `generateId()`: Creates UUIDs using `crypto.randomUUID()`
  - `generateReferenceCode()`: Generates 6-character alphanumeric codes for household invitations

### Initialization

```typescript
await db.initialize();
// or: await databaseService.initialize();
```

Initializes sql.js, loads existing database from IndexedDB, or creates a new one with schema.

### Database Management

```typescript
// Drop all tables (clears all data)
await db.dropAllTables();

// Reset database (drop all tables and recreate schema)
await db.resetDatabase();
```

**Warning**: These operations are destructive and will permanently delete all data. Use with caution, primarily for testing or development purposes.

### User Operations

```typescript
// Create a new user
const user = await db.user.create(name: string);

// Retrieve user by ID
const user = await db.user.get(id: string);

// Update user
await db.user.update(id: string, name: string);

// Delete user
await db.user.delete(id: string);
```

### Household Operations

```typescript
// Create household (automatically creates owner membership)
const household = await db.household.create(name: string, ownerId: string);

// Retrieve household by ID
const household = await db.household.get(id: string);

// Retrieve household by reference code
const household = await db.household.getByReferenceCode(referenceCode: string);

// Update household name
await db.household.updateName(householdId: string, name: string);

// Transfer ownership (updates household owner, changes roles, creates notifications)
await db.household.transferOwnership(householdId: string, newOwnerId: string);

// Delete household (cascades to all related data)
await db.household.delete(householdId: string);
```

### Membership Operations

```typescript
// Get all households for a user with their role
const households = await db.membership.getUserHouseholds(userId: string);

// Get all active members of a household
const members = await db.membership.getHouseholdMembers(householdId: string);

// Get user's role in a specific household
const role = await db.membership.getUserRole(userId: string, householdId: string);

// Request to join household by reference code (creates pending membership)
const membership = await db.membership.requestJoin(userId: string, referenceCode: string);

// Get pending membership requests for a household (owner view)
const requests = await db.membership.getPendingRequests(householdId: string);

// Get user's pending membership requests (requests they sent to join households)
const userRequests = await db.membership.getUserPendingRequests(userId: string);

// Get user's pending requests with household details
const userRequestsWithHousehold = await db.membership.getUserPendingRequestsWithHousehold(userId: string);

// Accept a membership request (changes status to active)
await db.membership.acceptRequest(membershipId: string);

// Reject a membership request (deletes the record)
await db.membership.rejectRequest(membershipId: string);

// Add member directly without request workflow (owner action)
const membership = await db.membership.addMemberDirectly(householdId: string, userId: string);
```

### Notification Operations

```typescript
// Create a notification
const notification = await db.notification.create(
  userId: string,
  householdId: string | undefined,
  type: 'ownership_transfer' | 'household_deletion' | 'membership_approved',
  message: string
);

// Get all notifications for a user (sorted by most recent first)
const notifications = await db.notification.getUserNotifications(userId: string);

// Mark a notification as read
await db.notification.markAsRead(notificationId: string);

// Get unread notification count for a user
const unreadCount = await db.notification.getUnreadCount(userId: string);

// Delete all notifications for a household (used during cascade delete)
await db.notification.deleteByHousehold(householdId: string);
```

### Category Operations

```typescript
// Create a category
const category = await db.category.create(name: string, color: string, householdId: string);

// Get all categories for a household (sorted by name)
const categories = await db.category.getAll(householdId: string);

// Get a category by ID
const category = await db.category.get(id: string);

// Update a category (name and/or color)
await db.category.update(id: string, name?: string, color?: string);

// Delete a category
await db.category.delete(id: string);
```

**Note**: Category names are unique per household (case-insensitive). Creating or updating a category with a duplicate name will throw an error.

### Grocery Item Operations

```typescript
// Create a grocery item
const item = await db.groceryItem.create({
  name: string,
  categoryId: string,
  householdId: string,
  restockThreshold?: number,      // Default: 1.0
  unit?: string,                  // Default: 'pieces'
  notes?: string,
  expirationDate?: number,        // Unix timestamp
  initialStockLevel?: number      // Default: 0.0
});

// Get a grocery item by ID
const item = await db.groceryItem.get(id: string);

// Get all grocery items for a household (sorted by name)
const items = await db.groceryItem.getAll(householdId: string);

// Update grocery item metadata
await db.groceryItem.update(id: string, {
  name?: string,
  categoryId?: string,
  restockThreshold?: number,
  unit?: string,
  notes?: string,
  expirationDate?: number
});

// Delete a grocery item
await db.groceryItem.delete(id: string);
```

**Notes**: 
- Category must exist before creating an item (validated on create and update)
- Stock level is managed separately through stock operations (not via update)
- All mutations automatically persist to IndexedDB

### Stock Operations

```typescript
// Add stock to an item (creates transaction record)
// Optional timestamp parameter for backdating transactions (e.g., initial stock)
await db.stock.add(itemId: string, quantity: number, userId: string, timestamp?: number);

// Use stock from an item (creates transaction record)
// Returns warning if insufficient stock (sets to zero)
const result = await db.stock.use(itemId: string, quantity: number, userId: string);
if (result.warning) {
  console.warn(result.warning);
}

// Get current stock level for an item
const stockLevel = db.stock.getLevel(itemId: string);

// Get all stock transactions for an item (sorted by most recent first)
const transactions = db.stock.getTransactions(itemId: string);

// Get stock transactions with user information
const transactionsWithUsers = db.stock.getTransactionsWithUser(itemId: string);

// Get complete item history (creation timestamp + all transactions with users)
const history = db.stock.getItemHistory(itemId: string);
// Returns: { itemCreatedAt: number, transactions: StockTransactionWithUser[] }
```

**Notes**:
- Quantity must be positive for both add and use operations
- Using more stock than available sets level to zero and returns a warning
- All stock changes are recorded as transactions with timestamp and user
- Transactions are immutable once created
- `getItemHistory` provides a complete audit trail including when the item was created

### Inventory Notification Operations

```typescript
// Get items with stock at or below restock threshold
const lowStockItems = await db.inventory.getLowStockItems(householdId: string);

// Get items expired or expiring within specified days (default: 3 days)
const expiringItems = await db.inventory.getExpiringItems(householdId: string, daysAhead?: number);

// Calculate notification status for a single item by ID
const status = await db.inventory.calculateNotificationStatus(itemId: string);
// Returns: { isLowStock, isExpired, isExpiringSoon, daysUntilExpiration? }

// Calculate notification status for an item object (synchronous)
const status = db.inventory.calculateNotificationStatusForItem(item: GroceryItem);
// Returns: { isLowStock, isExpired, isExpiringSoon, daysUntilExpiration? }

// Get all items with their notification status
const itemsWithStatus = await db.inventory.getItemsWithStatus(householdId: string);
// Returns: Array<GroceryItem & { status: NotificationStatus }>
```

**Notes**:
- `getLowStockItems` filters items where `stockLevel <= restockThreshold`
- `getExpiringItems` identifies items expiring within the specified timeframe
- `calculateNotificationStatus` fetches the item by ID and computes status (async)
- `calculateNotificationStatusForItem` computes status from an item object (sync)
- `getItemsWithStatus` combines item data with status for efficient rendering
- Expiration checks use Unix timestamps for date comparisons

### Sample Data

The application includes a sample data service that provides pre-defined categories and grocery items for first-time users. This helps users understand the application's features without manually creating data.

**Sample Categories** (`SAMPLE_CATEGORIES`):
- 5 pre-defined categories with assigned colors from the palette
- Categories: Dairy, Produce, Meat, Pantry, Beverages

**Sample Grocery Items** (`getSampleGroceryItems`):
- 15 diverse grocery items across all categories
- Includes varied stock levels to demonstrate different scenarios:
  - 7 items with low stock (at or below restock threshold)
  - 3 items expiring within 3 days
  - 1 item already expired
- Mix of items with and without expiration dates
- Demonstrates different units (liters, pieces, kg, cans, cups, bags)

**Sample Data Summary** (`getSampleDataSummary`):
```typescript
{
  categoryCount: 5,
  itemCount: 15,
  lowStockCount: 7,
  expiringCount: 3,
  expiredCount: 1
}
```

**Usage**:
The sample data is automatically populated when the database is initialized for the first time (empty database detection). This is handled by the `sample-data-population.service.ts` which orchestrates the creation of a default user, household, and items.

**User Handling**:
The sample data service checks for an existing 'default-user' (created by AppContext during initialization) before creating a new user. This ensures consistent user ID patterns and prevents duplicate user accounts during the initialization flow.

**Note**: Categories are automatically created by `createHousehold()`, so the sample data population service reuses these existing categories rather than creating duplicates.

## License

MIT


### Persistence

All database operations automatically persist to IndexedDB. This is handled internally by the repository layer after each mutation operation.

### Backward Compatibility

The legacy `databaseService` export is maintained for backward compatibility with existing code:

```typescript
import { databaseService } from '@/services/database';
// All original methods still work
await databaseService.createUser(name);
await databaseService.createHousehold(name, ownerId);
```
