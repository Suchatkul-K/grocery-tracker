import { beforeAll, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/services/database'

// Track if database has been initialized
let isInitialized = false;

// Mock IndexedDB for testing environment
beforeAll(async () => {
  // fake-indexeddb/auto automatically sets up IndexedDB globals
  // This ensures IndexedDB is available in the test environment
  
  // Initialize database once before all tests (without sample data)
  await db.initialize(true);
  isInitialized = true;
})

// Reset database before each test to ensure clean state
beforeEach(async () => {
  if (!isInitialized) {
    // Fallback: initialize if not already done
    await db.initialize(true);
    isInitialized = true;
  }
  
  // Reset the database to clean state (drops and recreates all tables)
  await db.schema.reset();
})
