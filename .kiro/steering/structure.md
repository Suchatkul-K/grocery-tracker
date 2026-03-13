# Project Structure

## Directory Organization

```
├── app/                 # Next.js App Router pages
│   ├── layout.tsx      # Root layout with metadata
│   ├── page.tsx        # Home page (main inventory view)
│   └── globals.css     # Global styles with Tailwind directives
├── components/         # React UI components
├── context/           # React Context providers for global state
├── services/          # Database layer and business logic
├── types/             # TypeScript type definitions and interfaces
└── tests/             # Test files (unit and property-based tests)
```

## Architectural Layers

1. **UI Layer** (`app/`, `components/`): React components for user interaction
2. **State Layer** (`context/`): React Context for global state management
3. **Service Layer** (`services/`): Type-safe database operations and business logic
4. **Database Layer**: sql.js executing SQL queries in WebAssembly
5. **Storage Layer**: IndexedDB for persistent local storage

## File Naming Conventions

- React components: PascalCase (e.g., `InventoryList.tsx`)
- Services: camelCase (e.g., `databaseService.ts`)
- Types: PascalCase for interfaces/types (e.g., `types/Household.ts`)
- Tests: Match source file with `.test.ts` suffix (e.g., `databaseService.test.ts`)

## Import Patterns

- Use `@/` alias for absolute imports from project root
- Example: `import { DatabaseService } from '@/services/databaseService'`

## Key Design Patterns

- **Service Layer Pattern**: Encapsulate database operations in service modules
- **Context Pattern**: Use React Context for cross-component state (user, household)
- **Type Safety**: Define interfaces in `types/` and import throughout codebase
- **Property-Based Testing**: Use fast-check to validate correctness properties

## Configuration Files

- `next.config.js`: Next.js static export configuration
- `tsconfig.json`: TypeScript compiler options with strict mode
- `tailwind.config.ts`: Tailwind CSS customization
- `vitest.config.ts`: Test environment configuration
- `.eslintrc.json`: Linting rules
