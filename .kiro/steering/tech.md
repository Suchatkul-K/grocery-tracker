# Technology Stack

## Core Technologies

- **Next.js 14**: React framework with App Router, configured for static export (`output: 'export'`)
- **TypeScript 5.3**: Strict mode enabled for type safety
- **React 18.2**: UI library
- **sql.js 1.10.3**: SQLite compiled to WebAssembly for browser-based database
- **IndexedDB**: Persistent local storage for SQLite database file

## Styling

- **Tailwind CSS 3.3**: Utility-first CSS framework
- **PostCSS**: CSS processing

## Testing

- **Vitest 1.1**: Testing framework with jsdom environment
- **fast-check 3.15**: Property-based testing library for correctness validation

## Development Tools

- **ESLint**: Code linting with Next.js config
- **TypeScript**: Strict type checking

## Common Commands

```bash
# Development
npm run dev              # Start dev server at http://localhost:3000

# Building
npm run build            # Create static export in out/ directory

# Testing
npm test                 # Run tests in watch mode
npm run test:run         # Run tests once (use for CI/property tests)

# Code Quality
npm run lint             # Run ESLint
```

## Configuration Notes

- **Static Export**: Configured in `next.config.js` with `output: 'export'` for client-side only operation
- **Webpack Fallbacks**: Node.js modules (fs, path, crypto) disabled for browser compatibility
- **Path Aliases**: `@/*` maps to project root (configured in tsconfig.json)
- **Module Resolution**: Uses `bundler` mode for Next.js compatibility

## Architecture Constraints

- No server-side code (static export only)
- No Node.js APIs in client code
- All database operations via sql.js in browser
- IndexedDB for persistence between sessions
