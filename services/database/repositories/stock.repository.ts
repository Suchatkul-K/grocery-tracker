import { BaseRepository } from './base.repository';
import { StockTransaction, StockTransactionWithUser, User, ItemHistory } from '@/types';
import { generateId } from '@/services/utils/id-generator';

/**
 * Repository for stock transaction data access operations
 */
class StockRepository extends BaseRepository {
  /**
   * Add stock to a grocery item
   * @param itemId - The grocery item ID
   * @param quantity - Amount to add (must be positive)
   * @param userId - User performing the action
   * @param timestamp - Optional timestamp (defaults to Date.now())
   */
  async addStock(itemId: string, quantity: number, userId: string, timestamp?: number): Promise<void> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const now = timestamp ?? Date.now();

    // Update stock level
    this.execute(
      'UPDATE grocery_items SET stock_level = stock_level + ?, updated_at = ? WHERE id = ?',
      [quantity, now, itemId]
    );

    // Record transaction
    const transactionId = generateId();
    this.execute(
      `INSERT INTO stock_transactions (id, grocery_item_id, user_id, transaction_type, quantity, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [transactionId, itemId, userId, 'add', quantity, now]
    );

    await this.save();
  }


  /**
   * Use stock from a grocery item
   * If stock would go negative, sets to zero and returns a warning
   */
  async useStock(itemId: string, quantity: number, userId: string): Promise<{ warning?: string }> {
    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    const now = Date.now();

    // Get current stock level
    const item = this.queryOne<{ stock_level: number }>(
      'SELECT stock_level FROM grocery_items WHERE id = ?',
      [itemId]
    );

    if (!item) {
      throw new Error('Grocery item not found');
    }

    let warning: string | undefined;
    let newStockLevel = item.stock_level - quantity;

    // Handle negative stock
    if (newStockLevel < 0) {
      warning = `Insufficient stock. Available: ${item.stock_level}, Requested: ${quantity}. Stock level set to zero.`;
      newStockLevel = 0;
    }

    // Update stock level
    this.execute(
      'UPDATE grocery_items SET stock_level = ?, updated_at = ? WHERE id = ?',
      [newStockLevel, now, itemId]
    );

    // Record transaction
    const transactionId = generateId();
    this.execute(
      `INSERT INTO stock_transactions (id, grocery_item_id, user_id, transaction_type, quantity, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [transactionId, itemId, userId, 'use', quantity, now]
    );

    await this.save();

    return warning ? { warning } : {};
  }

  /**
   * Get current stock level for an item
   */
  getStockLevel(itemId: string): number {
    const result = this.queryOne<{ stock_level: number }>(
      'SELECT stock_level FROM grocery_items WHERE id = ?',
      [itemId]
    );

    if (!result) {
      throw new Error('Grocery item not found');
    }

    return result.stock_level;
  }

  /**
   * Get all stock transactions for an item
   */
  getStockTransactions(itemId: string): StockTransaction[] {
    const results = this.query<{
      id: string;
      grocery_item_id: string;
      user_id: string;
      transaction_type: 'add' | 'use';
      quantity: number;
      timestamp: number;
    }>(
      `SELECT id, grocery_item_id, user_id, transaction_type, quantity, timestamp
       FROM stock_transactions
       WHERE grocery_item_id = ?
       ORDER BY timestamp DESC`,
      [itemId]
    );

    return results.map(result => ({
      id: result.id,
      groceryItemId: result.grocery_item_id,
      userId: result.user_id,
      transactionType: result.transaction_type,
      quantity: result.quantity,
      timestamp: result.timestamp,
    }));
  }

  /**
   * Get stock transactions with user information
   */
  getStockTransactionsWithUser(itemId: string): StockTransactionWithUser[] {
    const results = this.query<{
      transaction_id: string;
      grocery_item_id: string;
      user_id: string;
      transaction_type: 'add' | 'use';
      quantity: number;
      timestamp: number;
      user_name: string;
      user_created_at: number;
    }>(
      `SELECT 
         st.id as transaction_id,
         st.grocery_item_id,
         st.user_id,
         st.transaction_type,
         st.quantity,
         st.timestamp,
         u.name as user_name,
         u.created_at as user_created_at
       FROM stock_transactions st
       JOIN users u ON st.user_id = u.id
       WHERE st.grocery_item_id = ?
       ORDER BY st.timestamp DESC`,
      [itemId]
    );

    return results.map(result => ({
      transaction: {
        id: result.transaction_id,
        groceryItemId: result.grocery_item_id,
        userId: result.user_id,
        transactionType: result.transaction_type,
        quantity: result.quantity,
        timestamp: result.timestamp,
      },
      user: {
        id: result.user_id,
        name: result.user_name,
        createdAt: result.user_created_at,
      },
    }));
  }

  /**
   * Get complete item history including creation timestamp and all transactions
   * Requirements: 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5, 6.1.6, 6.1.7
   */
  getItemHistory(itemId: string): ItemHistory {
    // Get item creation timestamp
    const item = this.queryOne<{ created_at: number }>(
      'SELECT created_at FROM grocery_items WHERE id = ?',
      [itemId]
    );

    if (!item) {
      throw new Error('Grocery item not found');
    }

    // Get all transactions with user information, sorted by timestamp descending
    const transactions = this.getStockTransactionsWithUser(itemId);

    return {
      itemCreatedAt: item.created_at,
      transactions,
    };
  }
}

export const stockRepository = new StockRepository();
