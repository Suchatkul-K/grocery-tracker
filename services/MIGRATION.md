# Database Service Migration Guide

## Overview

The database service has been refactored from a monolithic `databaseService.ts` file into a modular architecture with clear separation of concerns.

## New Structure

```
services/
├── database/
│   ├── core/                      # Low-level database infrastructure
│   │   ├── connection.ts          # Database initialization & IndexedDB
│   │   ├── query-executor.ts      # Query execution helpers
│   │   └── schema.ts              # Schema creation & migrations
│   ├── repositories/              # Data access layer (CRUD)
│   │   ├── base.repository.ts     # Base repository class
│   │   ├── user.repository.ts     # User operations
│   │   ├── household.repository.ts # Household operations
│   │   └── membership.repository.ts # Membership operations
│   ├── services/                  # Business logic layer
│   │   ├── household.service.ts   # Household business logic
│   │   └── membership.service.ts  # Membership business logic
│   └── index.ts                   # Facade (main export)
├── utils/
│   └── id-generator.ts            # ID generation utilities
└── databaseService.ts             # DEPRECATED - use database/index.ts
```

## Migration Steps

### For New Code

Use the new modular imports:

```typescript
// Old way (deprecated)
import { databaseService } from '@/services/databaseService';

// New way (recommended)
import { db } from '@/services/database';

// Usage
await db.initialize();
const user = await db.user.create('John Doe');
const household = await db.household.create('My Home', user.id);
```

### For Existing Code

The old `databaseService` export is maintained for backward compatibility:

```typescript
// This still works
import { databaseService } from '@/services/database';

await databaseService.initialize();
const user = await databaseService.createUser('John Doe');
```

## API Changes

### Initialization

```typescript
// Old
await databaseService.initialize();

// New (same, but organized)
await db.initialize();
```

### User Operations

```typescript
// Old
await databaseService.createUser(name);
await databaseService.getUser(id);

// New
await db.user.create(name);
await db.user.get(id);
await db.user.update(id, name);
await db.user.delete(id);
```

### Household Operations

```typescript
// Old
await databaseService.createHousehold(name, ownerId);
await databaseService.getHousehold(id);
await databaseService.getHouseholdByReferenceCode(code);

// New
await db.household.create(name, ownerId);
await db.household.get(id);
await db.household.getByReferenceCode(code);
await db.household.updateName(id, name);
await db.household.transferOwnership(householdId, newOwnerId);
await db.household.delete(id);
```

### Membership Operations

```typescript
// Old
await databaseService.getUserHouseholds(userId);
await databaseService.getHouseholdMembers(householdId);
await databaseService.getUserRole(userId, householdId);
await databaseService.requestJoinHousehold(userId, referenceCode);
await databaseService.getPendingMembershipRequests(householdId);
await databaseService.acceptMembershipRequest(membershipId);
await databaseService.rejectMembershipRequest(membershipId);
await databaseService.addMemberDirectly(householdId, userId);

// New
await db.membership.getUserHouseholds(userId);
await db.membership.getHouseholdMembers(householdId);
await db.membership.getUserRole(userId, householdId);
await db.membership.requestJoin(userId, referenceCode);
await db.membership.getPendingRequests(householdId);
await db.membership.acceptRequest(membershipId);
await db.membership.rejectRequest(membershipId);
await db.membership.addMemberDirectly(householdId, userId);
```

## Benefits of New Architecture

1. **Separation of Concerns**: Core, repositories, and services have distinct responsibilities
2. **Testability**: Easy to mock repositories and test services in isolation
3. **Maintainability**: Changes to one domain don't affect others
4. **Scalability**: Easy to add new features without bloating existing files
5. **Type Safety**: Strong typing throughout all layers
6. **File Size**: No single file exceeds 300 lines

## Testing

All existing tests continue to work without modification due to backward compatibility layer.

New tests can use either approach:

```typescript
// Using backward-compatible export
import { databaseService } from '@/services/database';

// Using new modular API
import { db } from '@/services/database';
```

## Deprecation Timeline

- **Phase 1 (Current)**: Both APIs available, old API maintained for compatibility
- **Phase 2 (Future)**: Gradually migrate existing code to new API
- **Phase 3 (Future)**: Remove backward compatibility layer

## Questions?

See `services/database/index.ts` for the complete API surface.
