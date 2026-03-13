import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/database';
import { CATEGORY_COLORS } from '@/services/database/constants/colors';

describe('Category Management', () => {
  beforeEach(async () => {
    await db.initialize();
  });

  describe('Category Creation', () => {
    it('should create a category with all required fields', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      const category = await db.category.create('Dairy', household.id);

      expect(category.id).toBeDefined();
      expect(category.name).toBe('Dairy');
      expect(category.householdId).toBe(household.id);
      expect(category.color).toBeDefined();
      expect(category.createdAt).toBeGreaterThan(0);
    });

    it('should auto-assign color from palette when not provided', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      const category = await db.category.create('Dairy', household.id);

      expect(CATEGORY_COLORS).toContain(category.color);
    });

    it('should use provided color when specified', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      const customColor = '#123456';

      const category = await db.category.create('Dairy', household.id, customColor);

      expect(category.color).toBe(customColor);
    });

    it('should enforce unique category names per household (case-insensitive)', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      await db.category.create('Dairy', household.id);

      await expect(
        db.category.create('dairy', household.id)
      ).rejects.toThrow('already exists');
    });

    it('should allow same category name in different households', async () => {
      const user = await db.user.create('Test User');
      const household1 = await db.household.create('Household 1', user.id);
      const household2 = await db.household.create('Household 2', user.id);

      const category1 = await db.category.create('Dairy', household1.id);
      const category2 = await db.category.create('Dairy', household2.id);

      expect(category1.name).toBe('Dairy');
      expect(category2.name).toBe('Dairy');
      expect(category1.id).not.toBe(category2.id);
    });
  });

  describe('Category Color Assignment', () => {
    it('should assign different colors to sequential categories', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      const category1 = await db.category.create('Dairy', household.id);
      const category2 = await db.category.create('Produce', household.id);
      const category3 = await db.category.create('Meat', household.id);

      expect(category1.color).not.toBe(category2.color);
      expect(category2.color).not.toBe(category3.color);
      expect(category1.color).not.toBe(category3.color);
    });

    it('should cycle through color palette when all colors are used', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      // Create more categories than colors in palette
      const categories = [];
      for (let i = 0; i < CATEGORY_COLORS.length + 2; i++) {
        const category = await db.category.create(`Category ${i}`, household.id);
        categories.push(category);
      }

      // All colors should be from the palette
      categories.forEach(cat => {
        expect(CATEGORY_COLORS).toContain(cat.color);
      });
    });
  });

  describe('Category Retrieval', () => {
    it('should retrieve all categories for a household', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);

      await db.category.create('Dairy', household.id);
      await db.category.create('Produce', household.id);
      await db.category.create('Meat', household.id);

      const categories = db.category.getAll(household.id);

      expect(categories).toHaveLength(3);
      expect(categories.map(c => c.name).sort()).toEqual(['Dairy', 'Meat', 'Produce']);
    });

    it('should retrieve a category by ID', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      const created = await db.category.create('Dairy', household.id);

      const retrieved = db.category.get(created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe('Dairy');
    });

    it('should return null for non-existent category', async () => {
      const category = db.category.get('non-existent-id');
      expect(category).toBeNull();
    });

    it('should only return categories for specified household', async () => {
      const user = await db.user.create('Test User');
      const household1 = await db.household.create('Household 1', user.id);
      const household2 = await db.household.create('Household 2', user.id);

      await db.category.create('Dairy', household1.id);
      await db.category.create('Produce', household2.id);

      const categories1 = db.category.getAll(household1.id);
      const categories2 = db.category.getAll(household2.id);

      expect(categories1).toHaveLength(1);
      expect(categories1[0].name).toBe('Dairy');
      expect(categories2).toHaveLength(1);
      expect(categories2[0].name).toBe('Produce');
    });
  });

  describe('Category Update', () => {
    it('should update category name', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      const category = await db.category.create('Dairy', household.id);

      await db.category.update(category.id, 'Dairy Products');

      const updated = db.category.get(category.id);
      expect(updated?.name).toBe('Dairy Products');
    });

    it('should update category color', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      const category = await db.category.create('Dairy', household.id);
      const newColor = '#ABCDEF';

      await db.category.update(category.id, undefined, newColor);

      const updated = db.category.get(category.id);
      expect(updated?.color).toBe(newColor);
    });

    it('should enforce unique names when updating', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      await db.category.create('Dairy', household.id);
      const category2 = await db.category.create('Produce', household.id);

      await expect(
        db.category.update(category2.id, 'Dairy')
      ).rejects.toThrow('already exists');
    });
  });

  describe('Category Deletion', () => {
    it('should delete a category', async () => {
      const user = await db.user.create('Test User');
      const household = await db.household.create('Test Household', user.id);
      const category = await db.category.create('Dairy', household.id);

      await db.category.delete(category.id);

      const deleted = db.category.get(category.id);
      expect(deleted).toBeNull();
    });
  });
});

