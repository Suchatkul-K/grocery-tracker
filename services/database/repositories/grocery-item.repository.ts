import { BaseRepository } from './base.repository';
import { GroceryItem, GroceryItemInput } from '@/types';
import { generateId } from '@/services/utils/id-generator';

/**
 * Repository for grocery item data access operations
 */
class GroceryItemRepository extends BaseRepository {
  /**
   * Create a new grocery item
   * If initialStockLevel > 0, records an initial stock transaction (requires userId)
   */
  async createGroceryItem(input: GroceryItemInput, userId?: string): Promise<GroceryItem> {
    const id = generateId();
    const now = Date.now();
    
    // Validate category exists
    const categoryExists = this.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM categories WHERE id = ?',
      [input.categoryId]
    );
    
    if (!categoryExists || categoryExists.count === 0) {
      throw new Error('Category does not exist');
    }

    // Set defaults for optional fields
    const restockThreshold = input.restockThreshold ?? 1.0;
    const unit = input.unit ?? 'pieces';
    const stockLevel = input.initialStockLevel ?? 0.0;
    const notes = input.notes ?? null;
    const expirationDate = input.expirationDate ?? null;

    // Validate userId is provided when initialStockLevel > 0
    if (stockLevel > 0 && !userId) {
      throw new Error('userId is required when initialStockLevel > 0');
    }

    await this.execute(
      `INSERT INTO grocery_items 
       (id, name, category_id, household_id, restock_threshold, unit, notes, expiration_date, stock_level, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.name, input.categoryId, input.householdId, restockThreshold, unit, notes, expirationDate, stockLevel, now, now]
    );

    // If initial stock > 0, record as transaction
    if (stockLevel > 0 && userId) {
      // Record transaction
      const transactionId = generateId();
      await this.execute(
        `INSERT INTO stock_transactions (id, grocery_item_id, user_id, transaction_type, quantity, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [transactionId, id, userId, 'add', stockLevel, now]
      );
    }

    await this.save();

    return {
      id,
      name: input.name,
      categoryId: input.categoryId,
      householdId: input.householdId,
      restockThreshold,
      unit,
      notes: notes ?? undefined,
      expirationDate: expirationDate ?? undefined,
      stockLevel,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Get a grocery item by ID
   */
  getGroceryItem(id: string): GroceryItem | null {
    const result = this.queryOne<{
      id: string;
      name: string;
      category_id: string;
      household_id: string;
      restock_threshold: number;
      unit: string;
      notes: string | null;
      expiration_date: number | null;
      stock_level: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT id, name, category_id, household_id, restock_threshold, unit, notes, expiration_date, stock_level, created_at, updated_at 
       FROM grocery_items WHERE id = ?`,
      [id]
    );

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      categoryId: result.category_id,
      householdId: result.household_id,
      restockThreshold: result.restock_threshold,
      unit: result.unit,
      notes: result.notes ?? undefined,
      expirationDate: result.expiration_date ?? undefined,
      stockLevel: result.stock_level,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    };
  }

  /**
   * Get all grocery items for a household
   */
  getGroceryItems(householdId: string): GroceryItem[] {
    const results = this.query<{
      id: string;
      name: string;
      category_id: string;
      household_id: string;
      restock_threshold: number;
      unit: string;
      notes: string | null;
      expiration_date: number | null;
      stock_level: number;
      created_at: number;
      updated_at: number;
    }>(
      `SELECT id, name, category_id, household_id, restock_threshold, unit, notes, expiration_date, stock_level, created_at, updated_at 
       FROM grocery_items WHERE household_id = ? ORDER BY name`,
      [householdId]
    );

    return results.map(result => ({
      id: result.id,
      name: result.name,
      categoryId: result.category_id,
      householdId: result.household_id,
      restockThreshold: result.restock_threshold,
      unit: result.unit,
      notes: result.notes ?? undefined,
      expirationDate: result.expiration_date ?? undefined,
      stockLevel: result.stock_level,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    }));
  }

  /**
   * Update grocery item metadata
   */
  async updateGroceryItem(id: string, updates: Partial<GroceryItemInput>): Promise<void> {
    const item = this.getGroceryItem(id);
    if (!item) {
      throw new Error('Grocery item not found');
    }

    // If updating category, validate it exists
    if (updates.categoryId) {
      const categoryExists = this.queryOne<{ count: number }>(
        'SELECT COUNT(*) as count FROM categories WHERE id = ?',
        [updates.categoryId]
      );
      
      if (!categoryExists || categoryExists.count === 0) {
        throw new Error('Category does not exist');
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      params.push(updates.name);
    }

    if (updates.categoryId !== undefined) {
      updateFields.push('category_id = ?');
      params.push(updates.categoryId);
    }

    if (updates.restockThreshold !== undefined) {
      updateFields.push('restock_threshold = ?');
      params.push(updates.restockThreshold);
    }

    if (updates.unit !== undefined) {
      updateFields.push('unit = ?');
      params.push(updates.unit);
    }

    if (updates.notes !== undefined) {
      updateFields.push('notes = ?');
      params.push(updates.notes || null);
    }

    if (updates.expirationDate !== undefined) {
      updateFields.push('expiration_date = ?');
      params.push(updates.expirationDate || null);
    }

    if (updateFields.length > 0) {
      // Always update the updated_at timestamp
      updateFields.push('updated_at = ?');
      params.push(Date.now());

      params.push(id);
      await this.execute(
        `UPDATE grocery_items SET ${updateFields.join(', ')} WHERE id = ?`,
        params
      );
      await this.save();
    }
  }

  /**
   * Delete a grocery item
   */
  async deleteGroceryItem(id: string): Promise<void> {
    await this.execute('DELETE FROM grocery_items WHERE id = ?', [id]);
    await this.save();
  }

  /**
   * Delete all grocery items for a household
   */
  async deleteHouseholdGroceryItems(householdId: string): Promise<void> {
    await this.execute('DELETE FROM grocery_items WHERE household_id = ?', [householdId]);
    await this.save();
  }
}

export const groceryItemRepository = new GroceryItemRepository();
