import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/database';

describe('Item History Tracking', () => {
  let userId: string;
  let householdId: string;
  let categoryId: string;
  let itemId: string;

  beforeEach(async () => {
    await db.initialize();

    // Create test user
    const user = await db.user.create('Test User');
    userId = user.id;

    // Create test household
    const household = await db.household.create('Test Household', userId);
    householdId = household.id;

    // Create test category
    const category = await db.category.create('Test Category', householdId);
    categoryId = category.id;

    // Create test grocery item
    const item = await db.groceryItem.create({
      name: 'Test Item',
      categoryId,
      householdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    });
    itemId = item.id;
  });

  it('should return item creation timestamp', () => {
    const history = db.stock.getItemHistory(itemId);

    expect(history.itemCreatedAt).toBeDefined();
    expect(typeof history.itemCreatedAt).toBe('number');
    expect(history.itemCreatedAt).toBeGreaterThan(0);
  });

  it('should return empty transactions for new item', () => {
    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toBeDefined();
    expect(Array.isArray(history.transactions)).toBe(true);
    expect(history.transactions).toHaveLength(0);
  });

  it('should include all stock transactions with user information', async () => {
    // Add stock
    await db.stock.add(itemId, 5, userId);
    
    // Use stock
    await db.stock.use(itemId, 3, userId);
    
    // Add more stock
    await db.stock.add(itemId, 2, userId);

    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toHaveLength(3);
    
    // Verify transactions are sorted by timestamp descending (most recent first)
    expect(history.transactions[0].transaction.transactionType).toBe('add');
    expect(history.transactions[0].transaction.quantity).toBe(2);
    
    expect(history.transactions[1].transaction.transactionType).toBe('use');
    expect(history.transactions[1].transaction.quantity).toBe(3);
    
    expect(history.transactions[2].transaction.transactionType).toBe('add');
    expect(history.transactions[2].transaction.quantity).toBe(5);
  });

  it('should include user information for each transaction', async () => {
    await db.stock.add(itemId, 5, userId);

    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toHaveLength(1);
    expect(history.transactions[0].user).toBeDefined();
    expect(history.transactions[0].user.id).toBe(userId);
    expect(history.transactions[0].user.name).toBe('Test User');
    expect(history.transactions[0].user.createdAt).toBeDefined();
  });

  it('should include transaction details (type, quantity, timestamp)', async () => {
    const beforeAdd = Date.now();
    await db.stock.add(itemId, 7, userId);
    const afterAdd = Date.now();

    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toHaveLength(1);
    
    const transaction = history.transactions[0].transaction;
    expect(transaction.transactionType).toBe('add');
    expect(transaction.quantity).toBe(7);
    expect(transaction.timestamp).toBeGreaterThanOrEqual(beforeAdd);
    expect(transaction.timestamp).toBeLessThanOrEqual(afterAdd);
    expect(transaction.groceryItemId).toBe(itemId);
    expect(transaction.userId).toBe(userId);
  });

  it('should sort transactions by timestamp in descending order', async () => {
    // Add multiple transactions with small delays
    await db.stock.add(itemId, 1, userId);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.stock.use(itemId, 1, userId);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.stock.add(itemId, 2, userId);

    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toHaveLength(3);
    
    // Verify timestamps are in descending order
    for (let i = 0; i < history.transactions.length - 1; i++) {
      expect(history.transactions[i].transaction.timestamp)
        .toBeGreaterThanOrEqual(history.transactions[i + 1].transaction.timestamp);
    }
  });

  it('should throw error for non-existent item', () => {
    expect(() => {
      db.stock.getItemHistory('non-existent-id');
    }).toThrow('Grocery item not found');
  });

  it('should track multiple users performing transactions', async () => {
    // Create another user
    const user2 = await db.user.create('Second User');
    
    // Both users perform transactions
    await db.stock.add(itemId, 5, userId);
    await db.stock.use(itemId, 2, user2.id);
    await db.stock.add(itemId, 3, user2.id);

    const history = db.stock.getItemHistory(itemId);

    expect(history.transactions).toHaveLength(3);
    
    // Verify different users are tracked
    expect(history.transactions[0].user.name).toBe('Second User');
    expect(history.transactions[1].user.name).toBe('Second User');
    expect(history.transactions[2].user.name).toBe('Test User');
  });

  it('should preserve item creation timestamp regardless of transactions', async () => {
    const historyBefore = db.stock.getItemHistory(itemId);
    const createdAt = historyBefore.itemCreatedAt;

    // Perform some transactions
    await db.stock.add(itemId, 5, userId);
    await db.stock.use(itemId, 2, userId);

    const historyAfter = db.stock.getItemHistory(itemId);

    // Creation timestamp should remain the same
    expect(historyAfter.itemCreatedAt).toBe(createdAt);
  });
});
