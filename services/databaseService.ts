/**
 * DEPRECATED: This file is maintained for backward compatibility only.
 * 
 * Please use the new modular structure:
 * import { db } from '@/services/database';
 * 
 * See services/MIGRATION.md for migration guide.
 */

export { databaseService, db, initializeDatabase, checkBrowserCompatibility } from './database';

// Re-export types for convenience
export type {
  Household,
  User,
  HouseholdMembership,
  Category,
  GroceryItem,
  GroceryItemInput,
  StockTransaction,
  StockTransactionWithUser,
  ItemHistory,
  HouseholdWithRole,
  Notification,
} from '@/types';
