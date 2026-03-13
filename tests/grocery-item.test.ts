import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '@/services/database';
import { dbConnection } from '@/services/database/core/connection';
import { schemaManager } from '@/services/database/core/schema';
import type { User, Household, Category } from '@/types';

describe('Grocery Item Repository', () => {
  let user: User;
  let household: Household;
  let category: Category;

  beforeEach(async () => {
    // Clear IndexedDB before each test
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      if (db.name) {
        indexedDB.deleteDatabase(db.name);
      }
    }
    
    // Initialize fresh database
    await dbConnection.initialize();
    await schemaManager.createSchema();
    
    // Create test user
    user = await db.user.create('Test User');
    
    // Create test household
    household = await db.household.create('Test Household', user.id);
    
    // Create test category
    category = await db.category.create('Test Category', household.id);
  });

  describe('createGroceryItem', () => {
    it('should create a grocery item with required fields', async () => {
      const item = await db.groceryItem.create({
        name: 'Milk',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.name).toBe('Milk');
      expect(item.categoryId).toBe(category.id);
      expect(item.householdId).toBe(household.id);
      expect(item.restockThreshold).toBe(1.0); // default
      expect(item.unit).toBe('pieces'); // default
      expect(item.stockLevel).toBe(0.0); // default
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should create a grocery item with all optional fields', async () => {
      const expirationDate = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
      
      const item = await db.groceryItem.create({
        name: 'Eggs',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 12,
        unit: 'pieces',
        notes: 'Buy organic',
        expirationDate,
        initialStockLevel: 6,
      }, user.id);

      expect(item.name).toBe('Eggs');
      expect(item.restockThreshold).toBe(12);
      expect(item.unit).toBe('pieces');
      expect(item.notes).toBe('Buy organic');
      expect(item.expirationDate).toBe(expirationDate);
      expect(item.stockLevel).toBe(6);
    });

    it('should throw error if category does not exist', async () => {
      await expect(
        db.groceryItem.create({
          name: 'Invalid Item',
          categoryId: 'non-existent-category',
          householdId: household.id,
        }, user.id)
      ).rejects.toThrow('Category does not exist');
    });
  });

  describe('getGroceryItem', () => {
    it('should retrieve a grocery item by ID', async () => {
      const created = await db.groceryItem.create({
        name: 'Bread',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      const retrieved = await db.groceryItem.get(created.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Bread');
      expect(retrieved?.categoryId).toBe(category.id);
    });

    it('should return null for non-existent item', async () => {
      const result = await db.groceryItem.get('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getGroceryItems', () => {
    it('should retrieve all grocery items for a household', async () => {
      await db.groceryItem.create({
        name: 'Milk',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await db.groceryItem.create({
        name: 'Eggs',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      const items = await db.groceryItem.getAll(household.id);

      expect(items).toHaveLength(2);
      expect(items.map(i => i.name).sort()).toEqual(['Eggs', 'Milk']);
    });

    it('should return empty array for household with no items', async () => {
      const items = await db.groceryItem.getAll(household.id);
      expect(items).toEqual([]);
    });

    it('should only return items for the specified household', async () => {
      // Create another household
      const user2 = await db.user.create('User 2');
      const household2 = await db.household.create('Household 2', user2.id);
      const category2 = await db.category.create('Category 2', '#00FF00', household2.id);

      await db.groceryItem.create({
        name: 'Item 1',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await db.groceryItem.create({
        name: 'Item 2',
        categoryId: category2.id,
        householdId: household2.id,
      }, user2.id);

      const items1 = await db.groceryItem.getAll(household.id);
      const items2 = await db.groceryItem.getAll(household2.id);

      expect(items1).toHaveLength(1);
      expect(items1[0].name).toBe('Item 1');
      expect(items2).toHaveLength(1);
      expect(items2[0].name).toBe('Item 2');
    });
  });

  describe('updateGroceryItem', () => {
    it('should update grocery item name', async () => {
      const item = await db.groceryItem.create({
        name: 'Old Name',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await db.groceryItem.update(item.id, { name: 'New Name' });

      const updated = await db.groceryItem.get(item.id);
      expect(updated?.name).toBe('New Name');
      expect(updated?.updatedAt).toBeGreaterThan(item.updatedAt);
    });

    it('should update multiple fields', async () => {
      const item = await db.groceryItem.create({
        name: 'Milk',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 1,
        unit: 'liters',
      }, user.id);

      await db.groceryItem.update(item.id, {
        restockThreshold: 2,
        unit: 'gallons',
        notes: 'Buy whole milk',
      });

      const updated = await db.groceryItem.get(item.id);
      expect(updated?.restockThreshold).toBe(2);
      expect(updated?.unit).toBe('gallons');
      expect(updated?.notes).toBe('Buy whole milk');
      expect(updated?.name).toBe('Milk'); // unchanged
    });

    it('should update category if valid', async () => {
      const category2 = await db.category.create('Category 2', '#00FF00', household.id);
      
      const item = await db.groceryItem.create({
        name: 'Item',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await db.groceryItem.update(item.id, { categoryId: category2.id });

      const updated = await db.groceryItem.get(item.id);
      expect(updated?.categoryId).toBe(category2.id);
    });

    it('should throw error if updating to non-existent category', async () => {
      const item = await db.groceryItem.create({
        name: 'Item',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await expect(
        db.groceryItem.update(item.id, { categoryId: 'non-existent' })
      ).rejects.toThrow('Category does not exist');
    });

    it('should throw error if item does not exist', async () => {
      await expect(
        db.groceryItem.update('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Grocery item not found');
    });
  });

  describe('deleteGroceryItem', () => {
    it('should delete a grocery item', async () => {
      const item = await db.groceryItem.create({
        name: 'To Delete',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await db.groceryItem.delete(item.id);

      const retrieved = await db.groceryItem.get(item.id);
      expect(retrieved).toBeNull();
    });

    it('should not throw error when deleting non-existent item', async () => {
      await expect(
        db.groceryItem.delete('non-existent-id')
      ).resolves.not.toThrow();
    });
  });

  describe('category validation', () => {
    it('should validate category exists on creation', async () => {
      await expect(
        db.groceryItem.create({
          name: 'Item',
          categoryId: 'invalid-category-id',
          householdId: household.id,
        }, user.id)
      ).rejects.toThrow('Category does not exist');
    });

    it('should validate category exists on update', async () => {
      const item = await db.groceryItem.create({
        name: 'Item',
        categoryId: category.id,
        householdId: household.id,
      }, user.id);

      await expect(
        db.groceryItem.update(item.id, { categoryId: 'invalid-category-id' })
      ).rejects.toThrow('Category does not exist');
    });
  });
});
