# Services Layer

This directory contains the database layer and business logic for the Grocery Tracker application.

## Architecture Overview

The services layer follows a modular architecture with clear separation of concerns:

```
services/
├── database/                      # Modular database layer
│   ├── core/                      # Database infrastructure
│   ├── repositories/              # Data access (CRUD)
│   ├── services/                  # Business logic
│   └── index.ts                   # Main API (facade)
├── utils/                         # Shared utilities
├── databaseService.ts             # DEPRECATED - backward compatibility
└── MIGRATION.md                   # Migration guide
```

## Quick Start

### New Code (Recommended)

```typescript
import { db } from '@/services/database';

// Initialize database
await db.initialize();

// User operations
const user = await db.user.create('John Doe');
const retrievedUser = await db.user.get(user.id);

// Household operations
const household = await db.household.create('My Home', user.id);
const households = await db.membership.getUserHouseholds(user.id);

// Membership operations
await db.membership.requestJoin(userId, referenceCode);
await db.membership.acceptRequest(membershipId);
```

### Existing Code (Backward Compatible)

```typescript
import { databaseService } from '@/services/database';

// All existing code continues to work
await databaseService.initialize();
const user = await databaseService.createUser('John Doe');
const household = await databaseService.createHousehold('My Home', user.id);
```

## Architecture Layers

### 1. Core Layer (`database/core/`)

Low-level database infrastructure:
- **connection.ts**: Database initialization, IndexedDB persistence
- **query-executor.ts**: Type-safe query execution
- **schema.ts**: Table creation, indexes, and database reset operations

### 2. Repository Layer (`database/repositories/`)

Pure data access (CRUD operations):
- **base.repository.ts**: Common repository functionality
- **user.repository.ts**: User CRUD operations
- **household.repository.ts**: Household CRUD operations
- **membership.repository.ts**: Membership CRUD operations
- **notification.repository.ts**: Notification CRUD operations
- **category.repository.ts**: Category CRUD operations
- **grocery-item.repository.ts**: Grocery item CRUD operations (includes initial stock transaction creation to avoid circular dependency)
- **stock.repository.ts**: Stock transaction operations

Repositories handle SQL queries and return domain entities. To avoid circular dependencies, `grocery-item.repository.ts` directly creates stock transactions for initial stock levels rather than importing `stock.repository.ts`.

### 3. Service Layer (`database/services/`)

Business logic and orchestration:
- **household.service.ts**: Household business logic (create with membership, transfer ownership, cascade delete)
- **membership.service.ts**: Membership workflows (request, approve, reject)

Services coordinate multiple repositories and enforce business rules.

### 4. Facade Layer (`database/index.ts`)

Single entry point that provides a unified API:
- Organized by domain (user, household, membership)
- Maintains backward compatibility
- Simplifies imports for consumers

## Design Principles

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Type Safety**: Strong typing throughout all layers
3. **Testability**: Easy to mock and test in isolation
4. **Maintainability**: Changes to one domain don't affect others
5. **Scalability**: Easy to add new features

## File Organization

- Files under 300 lines
- One repository per domain entity
- Services orchestrate multiple repositories
- Utilities extracted to `utils/`

## Testing

All layers are tested:
- **Core**: Unit tests for connection and query execution
- **Repositories**: Integration tests with fake-indexeddb
- **Services**: Unit tests with mocked repositories
- **Facade**: Integration tests for complete workflows

Run tests:
```bash
npm test                    # Watch mode
npm run test:run           # Single run
```

## Migration

See [MIGRATION.md](./MIGRATION.md) for detailed migration guide from the old monolithic structure.

## Current Implementation Status

✅ **Implemented:**
- Core layer (connection, query executor, schema)
- User repository
- Household repository
- Membership repository
- Notification repository
- Category repository
- Grocery item repository
- Stock repository
- Household service
- Membership service
- Notification service
- Category service
- Inventory service (notifications and status calculations)
- Facade with backward compatibility

## Adding New Features

### Adding a New Repository

1. Create `database/repositories/your-entity.repository.ts`
2. Extend `BaseRepository`
3. Implement CRUD methods
4. Export singleton instance

### Adding a New Service

1. Create `database/services/your-domain.service.ts`
2. Import required repositories
3. Implement business logic methods
4. Export singleton instance

### Updating the Facade

1. Import your service/repository in `database/index.ts`
2. Add methods to the `db` object
3. Add to `databaseService` for backward compatibility

## Questions?

- See [MIGRATION.md](./MIGRATION.md) for migration guide
- See [architecture.md](../.kiro/steering/architecture.md) for detailed architecture documentation
- Check existing repositories and services for examples
