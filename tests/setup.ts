import { beforeAll } from 'vitest'
import 'fake-indexeddb/auto'

// Mock IndexedDB for testing environment
beforeAll(() => {
  // fake-indexeddb/auto automatically sets up IndexedDB globals
  // This ensures IndexedDB is available in the test environment
})
