import { BaseRepository } from './base.repository';
import { Category } from '@/types';
import { generateId } from '@/services/utils/id-generator';

/**
 * Repository for category data access operations
 */
class CategoryRepository extends BaseRepository {
  /**
   * Create a new category
   */
  async createCategory(name: string, color: string, householdId: string): Promise<Category> {
    const id = generateId();
    const createdAt = Date.now();

    // Check for duplicate category name in household (case-insensitive)
    const existing = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories WHERE LOWER(name) = LOWER(?) AND household_id = ?',
      [name, householdId]
    );

    if (existing && existing.count > 0) {
      throw new Error(`Category "${name}" already exists in this household`);
    }

    this.execute(
      'INSERT INTO categories (id, name, color, household_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, color, householdId, createdAt]
    );

    await this.save();

    return {
      id,
      name,
      color,
      householdId,
      createdAt,
    };
  }

  /**
   * Get all categories for a household
   */
  getCategories(householdId: string): Category[] {
    return this.query<Category>(
      'SELECT id, name, color, household_id as householdId, created_at as createdAt FROM categories WHERE household_id = ? ORDER BY name',
      [householdId]
    );
  }

  /**
   * Get a category by ID
   */
  getCategory(id: string): Category | null {
    return this.queryOne<Category>(
      'SELECT id, name, color, household_id as householdId, created_at as createdAt FROM categories WHERE id = ?',
      [id]
    );
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, name?: string, color?: string): Promise<void> {
    const category = this.getCategory(id);
    if (!category) {
      throw new Error('Category not found');
    }

    // If updating name, check for duplicates
    if (name && name !== category.name) {
      const existing = this.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories WHERE LOWER(name) = LOWER(?) AND household_id = ? AND id != ?',
        [name, category.householdId, id]
      );

      if (existing && existing.count > 0) {
        throw new Error(`Category "${name}" already exists in this household`);
      }
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }

    if (updates.length > 0) {
      params.push(id);
      this.execute(
        `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
      await this.save();
    }
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string): Promise<void> {
    this.execute('DELETE FROM categories WHERE id = ?', [id]);
    await this.save();
  }

  /**
   * Delete all categories for a household
   */
  async deleteHouseholdCategories(householdId: string): Promise<void> {
    this.execute('DELETE FROM categories WHERE household_id = ?', [householdId]);
    await this.save();
  }
}

export const categoryRepository = new CategoryRepository();

