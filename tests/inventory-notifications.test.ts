/**
 * Tests for inventory notification queries and status indicators
 * Validates Requirements 8.1-8.8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/database';
import { User, Household, Category, GroceryItem } from '@/types';

describe('Inventory Notifications', () => {
  let user: User;
  let household: Household;
  let category: Category;

  beforeEach(async () => {
    // Database is already initialized and reset by global setup
    
    // Create test user and household
    user = await db.user.create('Test User');
    household = await db.household.create('Test Household', user.id);
    category = await db.category.create('Test Category', household.id);
  });

  describe('Low Stock Identification (Req 8.1, 8.3)', () => {
    it('should identify items at restock threshold', async () => {
      // Create item with stock at threshold
      const item = await db.groceryItem.create({
        name: 'Item At Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 5,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      
      expect(lowStockItems).toHaveLength(1);
      expect(lowStockItems[0].id).toBe(item.id);
    });

    it('should identify items below restock threshold', async () => {
      // Create item with stock below threshold
      const item = await db.groceryItem.create({
        name: 'Item Below Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 3,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      
      expect(lowStockItems).toHaveLength(1);
      expect(lowStockItems[0].id).toBe(item.id);
    });

    it('should not identify items above restock threshold', async () => {
      // Create item with stock above threshold
      await db.groceryItem.create({
        name: 'Item Above Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 10,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      
      expect(lowStockItems).toHaveLength(0);
    });

    it('should identify multiple low stock items', async () => {
      // Create multiple items with low stock
      await db.groceryItem.create({
        name: 'Low Stock 1',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 2,
      }, user.id);

      await db.groceryItem.create({
        name: 'Low Stock 2',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 10,
      }, user.id);

      await db.groceryItem.create({
        name: 'Normal Stock',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 20,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      
      expect(lowStockItems).toHaveLength(2);
    });
  });

  describe('Expiration Identification (Req 8.2, 8.4)', () => {
    it('should identify expired items', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expired Item',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: yesterday,
      }, user.id);

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(1);
      expect(expiringItems[0].id).toBe(item.id);
    });

    it('should identify items expiring within 3 days', async () => {
      const twoDaysFromNow = Date.now() + (2 * 24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expiring Soon',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: twoDaysFromNow,
      });

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(1);
      expect(expiringItems[0].id).toBe(item.id);
    });

    it('should identify items expiring exactly in 3 days', async () => {
      const threeDaysFromNow = Date.now() + (3 * 24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expiring in 3 Days',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: threeDaysFromNow,
      });

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(1);
      expect(expiringItems[0].id).toBe(item.id);
    });

    it('should not identify items expiring more than 3 days away', async () => {
      const fourDaysFromNow = Date.now() + (4 * 24 * 60 * 60 * 1000);
      
      await db.groceryItem.create({
        name: 'Not Expiring Soon',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: fourDaysFromNow,
      });

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(0);
    });

    it('should not identify items without expiration date', async () => {
      await db.groceryItem.create({
        name: 'No Expiration',
        categoryId: category.id,
        householdId: household.id,
      });

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(0);
    });
  });

  describe('Notification Filtering (Req 8.5)', () => {
    it('should return only low stock items when querying low stock', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      // Low stock only
      const lowStockItem = await db.groceryItem.create({
        name: 'Low Stock Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
      }, user.id);

      // Expiring only
      await db.groceryItem.create({
        name: 'Expiring Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 20,
        expirationDate: yesterday,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      
      expect(lowStockItems).toHaveLength(1);
      expect(lowStockItems[0].id).toBe(lowStockItem.id);
    });

    it('should return only expiring items when querying expiring', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      // Low stock only
      await db.groceryItem.create({
        name: 'Low Stock Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
      }, user.id);

      // Expiring only
      const expiringItem = await db.groceryItem.create({
        name: 'Expiring Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 20,
        expirationDate: yesterday,
      }, user.id);

      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(expiringItems).toHaveLength(1);
      expect(expiringItems[0].id).toBe(expiringItem.id);
    });

    it('should allow item to appear in both lists if it meets both criteria', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      // Both low stock and expiring
      const bothItem = await db.groceryItem.create({
        name: 'Low Stock and Expiring',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
        expirationDate: yesterday,
      }, user.id);

      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      const expiringItems = await db.inventory.getExpiringItems(household.id);
      
      expect(lowStockItems).toHaveLength(1);
      expect(lowStockItems[0].id).toBe(bothItem.id);
      expect(expiringItems).toHaveLength(1);
      expect(expiringItems[0].id).toBe(bothItem.id);
    });
  });

  describe('Low Stock Status Indicator (Req 8.6)', () => {
    it('should set isLowStock flag when stock is at threshold', async () => {
      const item = await db.groceryItem.create({
        name: 'At Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 5,
      }, user.id);

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isLowStock).toBe(true);
    });

    it('should set isLowStock flag when stock is below threshold', async () => {
      const item = await db.groceryItem.create({
        name: 'Below Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 3,
      }, user.id);

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isLowStock).toBe(true);
    });

    it('should not set isLowStock flag when stock is above threshold', async () => {
      const item = await db.groceryItem.create({
        name: 'Above Threshold',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 10,
      }, user.id);

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isLowStock).toBe(false);
    });
  });

  describe('Expiration Status Indicator (Req 8.7)', () => {
    it('should set isExpired flag for expired items', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expired',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: yesterday,
      });

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isExpired).toBe(true);
      expect(status.isExpiringSoon).toBe(false);
    });

    it('should set isExpiringSoon flag for items expiring within 3 days', async () => {
      const twoDaysFromNow = Date.now() + (2 * 24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expiring Soon',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: twoDaysFromNow,
      });

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isExpired).toBe(false);
      expect(status.isExpiringSoon).toBe(true);
    });

    it('should not set expiration flags for items without expiration date', async () => {
      const item = await db.groceryItem.create({
        name: 'No Expiration',
        categoryId: category.id,
        householdId: household.id,
      });

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isExpired).toBe(false);
      expect(status.isExpiringSoon).toBe(false);
      expect(status.daysUntilExpiration).toBeUndefined();
    });

    it('should calculate days until expiration correctly', async () => {
      const twoDaysFromNow = Date.now() + (2 * 24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Expiring in 2 Days',
        categoryId: category.id,
        householdId: household.id,
        expirationDate: twoDaysFromNow,
      });

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.daysUntilExpiration).toBe(2);
    });
  });

  describe('Multiple Status Indicators (Req 8.8)', () => {
    it('should set both flags when item is low stock and expired', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Low Stock and Expired',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
        expirationDate: yesterday,
      }, user.id);

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isLowStock).toBe(true);
      expect(status.isExpired).toBe(true);
    });

    it('should set both flags when item is low stock and expiring soon', async () => {
      const twoDaysFromNow = Date.now() + (2 * 24 * 60 * 60 * 1000);
      
      const item = await db.groceryItem.create({
        name: 'Low Stock and Expiring Soon',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
        expirationDate: twoDaysFromNow,
      }, user.id);

      const status = await db.inventory.calculateNotificationStatus(item);
      
      expect(status.isLowStock).toBe(true);
      expect(status.isExpiringSoon).toBe(true);
    });

    it('should include status for all items when using getItemsWithStatus', async () => {
      const yesterday = Date.now() - (24 * 60 * 60 * 1000);
      const twoDaysFromNow = Date.now() + (2 * 24 * 60 * 60 * 1000);
      
      // Low stock only
      await db.groceryItem.create({
        name: 'Low Stock Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
      }, user.id);

      // Expiring only
      await db.groceryItem.create({
        name: 'Expiring Only',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 20,
        expirationDate: yesterday,
      }, user.id);

      // Both
      await db.groceryItem.create({
        name: 'Both Issues',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        initialStockLevel: 5,
        expirationDate: twoDaysFromNow,
      }, user.id);

      // Normal
      await db.groceryItem.create({
        name: 'Normal',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        initialStockLevel: 20,
      }, user.id);

      const itemsWithStatus = await db.inventory.getItemsWithStatus(household.id);
      
      expect(itemsWithStatus).toHaveLength(4);
      
      const lowStockOnly = itemsWithStatus.find(i => i.name === 'Low Stock Only');
      expect(lowStockOnly?.status.isLowStock).toBe(true);
      expect(lowStockOnly?.status.isExpired).toBe(false);
      expect(lowStockOnly?.status.isExpiringSoon).toBe(false);
      
      const expiringOnly = itemsWithStatus.find(i => i.name === 'Expiring Only');
      expect(expiringOnly?.status.isLowStock).toBe(false);
      expect(expiringOnly?.status.isExpired).toBe(true);
      
      const bothIssues = itemsWithStatus.find(i => i.name === 'Both Issues');
      expect(bothIssues?.status.isLowStock).toBe(true);
      expect(bothIssues?.status.isExpiringSoon).toBe(true);
      
      const normal = itemsWithStatus.find(i => i.name === 'Normal');
      expect(normal?.status.isLowStock).toBe(false);
      expect(normal?.status.isExpired).toBe(false);
      expect(normal?.status.isExpiringSoon).toBe(false);
    });
  });
});
