# Service Layer Architecture

## Modular Structure

The service layer follows a modular architecture inspired by NestJS patterns, separating concerns into distinct layers for maintainability and testability.

```
services/
├── database/
│   ├── core/
│   │   ├── connection.ts          # Database initialization, IndexedDB, sql.js setup
│   │   ├── query-executor.ts      # Query execution helpers (query, queryOne, execute)
│   │   └── schema.ts              # Schema creation and migrations
│   ├── repositories/
│   │   ├── base.repository.ts     # Base repository with common methods
│   │   ├── user.repository.ts     # User CRUD operations
│   │   ├── household.repository.ts # Household CRUD operations
│   │   ├── membership.repository.ts # Membership operations
│   │   ├── category.repository.ts  # Category operations
│   │   ├── grocery-item.repository.ts # Grocery item operations
│   │   ├── stock.repository.ts     # Stock operations
│   │   └── notification.repository.ts # Notification operations
│   ├── services/
│   │   ├── household.service.ts    # Business logic for households
│   │   ├── membership.service.ts   # Business logic for memberships
│   │   ├── inventory.service.ts    # Business logic for inventory
│   │   └── notification.service.ts # Business logic for notifications
│   └── index.ts                    # Main export (facade pattern)
└── utils/
    ├── id-generator.ts             # ID and reference code generation
    └── validators.ts               # Input validation helpers
```

## Layer Responsibilities

### Core Layer (`services/database/core/`)

**Purpose**: Low-level database infrastructure

- **connection.ts**: 
  - Database initialization and lifecycle management
  - Browser compatibility checks
  - IndexedDB persistence (save/load)
  - sql.js WebAssembly loading (environment-aware)
  - Singleton database instance management

- **query-executor.ts**:
  - Generic query execution methods (`query<T>`, `queryOne<T>`, `execute`)
  - SQL statement preparation and binding
  - Result mapping and type safety
  - Error handling for database operations

- **schema.ts**:
  - Table creation and schema definitions
  - Index creation for performance
  - Database migrations (future)
  - Schema versioning (future)

### Repository Layer (`services/database/repositories/`)

**Purpose**: Data access and CRUD operations

**Principles**:
- Pure data access, no business logic
- One repository per domain entity
- Direct database interaction via query executor
- Returns domain entities (types from `types/`)
- Handles SQL queries and result mapping

**Example responsibilities**:
- `user.repository.ts`: createUser, getUser, updateUser, deleteUser
- `household.repository.ts`: createHousehold, getHousehold, updateHousehold, deleteHousehold
- `membership.repository.ts`: createMembership, getMemberships, updateMembershipStatus

**Base Repository**:
- Common CRUD patterns
- Shared query building utilities
- Standard error handling

### Service Layer (`services/database/services/`)

**Purpose**: Business logic and orchestration

**Principles**:
- Orchestrates multiple repositories
- Implements business rules and validation
- Handles complex transactions
- Enforces domain constraints
- No direct SQL queries (uses repositories)

**Example responsibilities**:
- `household.service.ts`: 
  - Create household with owner membership
  - Transfer ownership (update household + memberships + notifications)
  - Delete household with cascade (remove all related data)
  
- `membership.service.ts`:
  - Request to join household (validate reference code)
  - Approve/reject membership requests
  - Manage member permissions

- `inventory.service.ts`:
  - Add/use stock with transaction logging
  - Calculate restock notifications
  - Check expiration dates
  - Get item history with user details

### Facade Layer (`services/database/index.ts`)

**Purpose**: Single entry point for consumers

**Principles**:
- Exports unified API for all database operations
- Maintains backward compatibility
- Delegates to appropriate services
- Simplifies imports for UI components

**Example**:
```typescript
export const db = {
  // User operations
  createUser: userRepository.createUser,
  getUser: userRepository.getUser,
  
  // Household operations (business logic)
  createHousehold: householdService.createHousehold,
  transferOwnership: householdService.transferOwnership,
  deleteHousehold: householdService.deleteHousehold,
  
  // Inventory operations
  addStock: inventoryService.addStock,
  getItemHistory: inventoryService.getItemHistory,
};
```

## Design Patterns

### Repository Pattern
- Abstracts data access logic
- Provides collection-like interface for domain objects
- Enables easy testing with mock repositories

### Service Pattern
- Encapsulates business logic
- Coordinates multiple repositories
- Implements use cases from requirements

### Facade Pattern
- Simplifies complex subsystem
- Provides unified interface
- Reduces coupling between layers

### Dependency Injection (Manual)
- Services receive repository instances
- Repositories receive query executor
- Enables testing with mocks

## Benefits

1. **Separation of Concerns**: Each layer has a single, well-defined responsibility
2. **Testability**: Easy to mock repositories and test services in isolation
3. **Maintainability**: Changes to one domain don't affect others
4. **Scalability**: Easy to add new features without bloating existing files
5. **Type Safety**: Strong typing throughout all layers
6. **Reusability**: Repositories can be used by multiple services
7. **Clarity**: Clear boundaries between data access and business logic

## Migration Strategy

When refactoring existing code:

1. **Extract Core**: Move database initialization and query methods to core layer
2. **Create Repositories**: Extract CRUD operations into repository files
3. **Build Services**: Move business logic into service files
4. **Update Facade**: Create index.ts that exports the new structure
5. **Update Consumers**: Update imports in components/context to use facade
6. **Remove Old Code**: Delete original monolithic service file

## Testing Strategy

- **Core Layer**: Unit tests for connection, query execution, schema creation
- **Repository Layer**: Integration tests with fake-indexeddb
- **Service Layer**: Unit tests with mocked repositories
- **Facade Layer**: Integration tests for complete workflows

## File Size Guidelines

- Keep files under 300 lines
- Split large repositories by concern (e.g., household.repository.ts and household-membership.repository.ts)
- Extract complex queries into query builder utilities
