/**
 * Sample Data Service
 * Provides sample data population for first-time users
 */

import { CATEGORY_COLORS } from '../constants/colors';
import type { GroceryItemInput } from '@/types';

/**
 * Sample category definitions with colors
 */
export const SAMPLE_CATEGORIES = [
  { name: 'Dairy', color: CATEGORY_COLORS[1] }, // Teal
  { name: 'Produce', color: CATEGORY_COLORS[9] }, // Light Green
  { name: 'Meat', color: CATEGORY_COLORS[0] }, // Red
  { name: 'Pantry', color: CATEGORY_COLORS[5] }, // Yellow
  { name: 'Beverages', color: CATEGORY_COLORS[2] }, // Blue
] as const;

/**
 * Sample grocery item definitions
 * Includes varied stock levels, low stock scenarios, and expiration dates
 */
export function getSampleGroceryItems(
  householdId: string,
  categoryMap: Record<string, string>
): GroceryItemInput[] {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  return [
    // Dairy items
    {
      name: 'Milk',
      categoryId: categoryMap['Dairy'],
      householdId,
      restockThreshold: 1,
      unit: 'liters',
      initialStockLevel: 2,
      expirationDate: now + 5 * oneDayMs, // Expires in 5 days
    },
    {
      name: 'Eggs',
      categoryId: categoryMap['Dairy'],
      householdId,
      restockThreshold: 12,
      unit: 'pieces',
      initialStockLevel: 6, // Low stock scenario
      expirationDate: now + 10 * oneDayMs,
    },
    {
      name: 'Yogurt',
      categoryId: categoryMap['Dairy'],
      householdId,
      restockThreshold: 4,
      unit: 'cups',
      initialStockLevel: 8,
      expirationDate: now + 2 * oneDayMs, // Expiring soon (within 3 days)
    },
    
    // Produce items
    {
      name: 'Apples',
      categoryId: categoryMap['Produce'],
      householdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 8,
      expirationDate: now + 7 * oneDayMs,
    },
    {
      name: 'Bananas',
      categoryId: categoryMap['Produce'],
      householdId,
      restockThreshold: 6,
      unit: 'pieces',
      initialStockLevel: 3, // Low stock scenario
      expirationDate: now + 1 * oneDayMs, // Expiring very soon
    },
    {
      name: 'Carrots',
      categoryId: categoryMap['Produce'],
      householdId,
      restockThreshold: 1,
      unit: 'kg',
      initialStockLevel: 0.5, // Low stock scenario
      expirationDate: now + 14 * oneDayMs,
    },
    
    // Meat items
    {
      name: 'Chicken Breast',
      categoryId: categoryMap['Meat'],
      householdId,
      restockThreshold: 1,
      unit: 'kg',
      initialStockLevel: 0.5, // Low stock scenario
      expirationDate: now + 3 * oneDayMs,
    },
    {
      name: 'Ground Beef',
      categoryId: categoryMap['Meat'],
      householdId,
      restockThreshold: 0.5,
      unit: 'kg',
      initialStockLevel: 0, // Out of stock scenario
      expirationDate: now - 1 * oneDayMs, // Already expired
    },
    
    // Pantry items (no expiration dates for shelf-stable items)
    {
      name: 'Rice',
      categoryId: categoryMap['Pantry'],
      householdId,
      restockThreshold: 2,
      unit: 'kg',
      initialStockLevel: 3,
      notes: 'Basmati rice',
    },
    {
      name: 'Pasta',
      categoryId: categoryMap['Pantry'],
      householdId,
      restockThreshold: 1,
      unit: 'kg',
      initialStockLevel: 0.5, // Low stock scenario
    },
    {
      name: 'Canned Tomatoes',
      categoryId: categoryMap['Pantry'],
      householdId,
      restockThreshold: 3,
      unit: 'cans',
      initialStockLevel: 2, // Low stock scenario
    },
    {
      name: 'Olive Oil',
      categoryId: categoryMap['Pantry'],
      householdId,
      restockThreshold: 1,
      unit: 'liters',
      initialStockLevel: 1.5,
    },
    
    // Beverages
    {
      name: 'Orange Juice',
      categoryId: categoryMap['Beverages'],
      householdId,
      restockThreshold: 2,
      unit: 'liters',
      initialStockLevel: 1, // Low stock scenario
      expirationDate: now + 4 * oneDayMs,
    },
    {
      name: 'Coffee',
      categoryId: categoryMap['Beverages'],
      householdId,
      restockThreshold: 0.5,
      unit: 'kg',
      initialStockLevel: 0.8,
    },
    {
      name: 'Tea Bags',
      categoryId: categoryMap['Beverages'],
      householdId,
      restockThreshold: 20,
      unit: 'bags',
      initialStockLevel: 45,
    },
  ];
}

/**
 * Get a summary of sample data characteristics
 * Useful for testing and validation
 */
export function getSampleDataSummary() {
  return {
    categoryCount: SAMPLE_CATEGORIES.length,
    itemCount: 15,
    lowStockCount: 7, // Items with stock <= threshold
    expiringCount: 3, // Items expiring within 3 days
    expiredCount: 1, // Items already expired
  };
}
