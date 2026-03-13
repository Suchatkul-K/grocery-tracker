/**
 * Sample Data Population Service
 * Handles first-use detection and sample data population
 */

import { userRepository } from '../repositories/user.repository';
import { householdService } from './household.service';
import { categoryService } from './category.service';
import { groceryItemRepository } from '../repositories/grocery-item.repository';
import { stockRepository } from '../repositories/stock.repository';
import { SAMPLE_CATEGORIES, getSampleGroceryItems } from './sample-data.service';
import { dbConnection } from '../core/connection';

// Flag to prevent duplicate population during React StrictMode double-mount
let isPopulating = false;

/**
 * Check if the database is empty (first use)
 * Returns true if no users exist in the database
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const db = dbConnection.getDatabase();
    const result = db.exec('SELECT COUNT(*) as count FROM users');
    
    if (result.length === 0 || !result[0].values.length) {
      return true;
    }
    
    const count = result[0].values[0][0] as number;
    return count === 0;
  } catch (error) {
    // If table doesn't exist, database is empty
    return true;
  }
}

/**
 * Populate the database with sample data
 * Creates a default user, household, categories, and grocery items
 * 
 * @param householdId - Optional household ID to populate (if not provided, creates new household)
 * @param userId - Optional user ID to use for stock transactions (if not provided, creates new user)
 */
export async function populateSampleData(
  householdId?: string,
  userId?: string
): Promise<{
  userId: string;
  householdId: string;
  categoryCount: number;
  itemCount: number;
}> {
  // Create or use provided user
  // Use 'default-user' ID to match AppContext expectations
  let user;
  if (userId) {
    user = await userRepository.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }
  } else {
    // Try to get the default user that AppContext creates
    user = await userRepository.getUser('default-user');
    if (!user) {
      // Create with specific ID 'default-user' to match AppContext
      user = await userRepository.createUser('Demo User', 'default-user');
    }
  }
  
  // Create or use provided household
  let household;
  let categoriesAlreadyCreated = false;
  if (householdId) {
    household = await householdService.getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }
    categoriesAlreadyCreated = true; // Assume categories exist if household was provided
  } else {
    // createHousehold automatically creates default categories
    household = await householdService.createHousehold('My Household', user.id);
    categoriesAlreadyCreated = true; // Categories were created by createHousehold
  }
  
  // Get existing categories (created by createHousehold)
  const existingCategories = await categoryService.getCategories(household.id);
  const categoryMap: Record<string, string> = {};
  for (const category of existingCategories) {
    categoryMap[category.name] = category.id;
  }
  
  // Create grocery items with initial stock
  const sampleItems = getSampleGroceryItems(household.id, categoryMap);
  let itemCount = 0;
  
  for (const itemInput of sampleItems) {
    const item = await groceryItemRepository.createGroceryItem(itemInput, user.id);
    itemCount++;
  }
  
  // Save to IndexedDB
  await dbConnection.saveToIndexedDB();
  
  return {
    userId: user.id,
    householdId: household.id,
    categoryCount: existingCategories.length,
    itemCount,
  };
}

/**
 * Check and populate sample data if database is empty
 * Returns information about the populated data or null if database was not empty
 */
export async function checkAndPopulateSampleData(): Promise<{
  userId: string;
  householdId: string;
  categoryCount: number;
  itemCount: number;
} | null> {
  // Prevent duplicate population during React StrictMode double-mount
  if (isPopulating) {
    console.log('Sample data population already in progress, skipping...');
    return null;
  }

  const isEmpty = await isDatabaseEmpty();
  
  if (isEmpty) {
    isPopulating = true;
    try {
      console.log('Database is empty, populating with sample data...');
      const result = await populateSampleData();
      console.log(`Sample data populated: ${result.itemCount} items in ${result.categoryCount} categories`);
      return result;
    } finally {
      // Reset flag after a short delay to allow for legitimate re-population
      setTimeout(() => {
        isPopulating = false;
      }, 1000);
    }
  }
  
  return null;
}
