import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/database';
import { User, Household, Category, GroceryItem } from '@/types';

describe('Stock Operations', () => {
  let user: User;
  let household: Household;
  let category: Category;
  let item: GroceryItem;

  beforeEach(async () => {
    // Database is already initialized and reset by global setup

    // Create test user
    user = await db.user.create('Test User');

    // Create test household
    household = await db.household.create('Test Household', user.id);

    // Create test category
    category = await db.category.create('Test Category', household.id);

    // Create test grocery item
    item = await db.groceryItem.create({
      name: 'Test Item',
      categoryId: category.id,
      householdId: household.id,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, user.id);
  });

  describe('addStock', () => {
    it('should increase stock level when adding stock', async () => {
      const initialLevel = db.stock.getLevel(item.id);
      expect(initialLevel).toBe(10);

      await db.stock.add(item.id, 5, user.id);

      const newLevel = db.stock.getLevel(item.id);
      expect(newLevel).toBe(15);
    });

    it('should record transaction when adding stock', async () => {
      await db.stock.add(item.id, 5, user.id);

      const transactions = db.stock.getTransactions(item.id);
      expect(transactions).toHaveLength(2); // 1 initial + 1 add
      
      // Find the add transaction (not the initial one)
      const addTransaction = transactions.find(t => t.transactionType === 'add' && t.quantity === 5);
      expect(addTransaction).toBeDefined();
      expect(addTransaction!.userId).toBe(user.id);
      expect(addTransaction!.groceryItemId).toBe(item.id);
    });

    it('should include user information in transaction', async () => {
      await db.stock.add(item.id, 5, user.id);

      const transactions = db.stock.getTransactionsWithUser(item.id);
      // 1 initial + 1 new = 2 transactions
      expect(transactions).toHaveLength(2);
      expect(transactions[0].user.id).toBe(user.id);
      expect(transactions[0].user.name).toBe('Test User');
      expect(transactions[0].transaction.quantity).toBe(5);
    });

    it('should throw error for negative quantity', async () => {
      await expect(db.stock.add(item.id, -5, user.id)).rejects.toThrow(
        'Quantity must be positive'
      );
    });

    it('should throw error for zero quantity', async () => {
      await expect(db.stock.add(item.id, 0, user.id)).rejects.toThrow(
        'Quantity must be positive'
      );
    });

    it('should handle multiple add operations', async () => {
      await db.stock.add(item.id, 5, user.id);
      await db.stock.add(item.id, 3, user.id);
      await db.stock.add(item.id, 2, user.id);

      const level = db.stock.getLevel(item.id);
      expect(level).toBe(20); // 10 + 5 + 3 + 2

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 3 new = 4 transactions
      expect(transactions).toHaveLength(4);
    });
  });

  describe('useStock', () => {
    it('should decrease stock level when using stock', async () => {
      const initialLevel = db.stock.getLevel(item.id);
      expect(initialLevel).toBe(10);

      await db.stock.use(item.id, 3, user.id);

      const newLevel = db.stock.getLevel(item.id);
      expect(newLevel).toBe(7);
    });

    it('should record transaction when using stock', async () => {
      await db.stock.use(item.id, 3, user.id);

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 1 use = 2 transactions
      expect(transactions).toHaveLength(2);
      expect(transactions[0].transactionType).toBe('use');
      expect(transactions[0].quantity).toBe(3);
      expect(transactions[0].userId).toBe(user.id);
    });

    it('should set stock to zero when using more than available', async () => {
      const result = await db.stock.use(item.id, 15, user.id);

      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('Insufficient stock');
      expect(result.warning).toContain('Available: 10');
      expect(result.warning).toContain('Requested: 15');

      const level = db.stock.getLevel(item.id);
      expect(level).toBe(0);
    });

    it('should still record transaction when stock goes negative', async () => {
      await db.stock.use(item.id, 15, user.id);

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 1 use = 2 transactions
      expect(transactions).toHaveLength(2);
      expect(transactions[0].quantity).toBe(15); // Records requested amount
    });

    it('should throw error for negative quantity', async () => {
      await expect(db.stock.use(item.id, -5, user.id)).rejects.toThrow(
        'Quantity must be positive'
      );
    });

    it('should throw error for zero quantity', async () => {
      await expect(db.stock.use(item.id, 0, user.id)).rejects.toThrow(
        'Quantity must be positive'
      );
    });

    it('should handle exact stock usage', async () => {
      const result = await db.stock.use(item.id, 10, user.id);

      expect(result.warning).toBeUndefined();
      const level = db.stock.getLevel(item.id);
      expect(level).toBe(0);
    });

    it('should handle multiple use operations', async () => {
      await db.stock.use(item.id, 2, user.id);
      await db.stock.use(item.id, 3, user.id);
      await db.stock.use(item.id, 1, user.id);

      const level = db.stock.getLevel(item.id);
      expect(level).toBe(4); // 10 - 2 - 3 - 1

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 3 use = 4 transactions
      expect(transactions).toHaveLength(4);
    });
  });

  describe('getStockLevel', () => {
    it('should return current stock level', () => {
      const level = db.stock.getLevel(item.id);
      expect(level).toBe(10);
    });

    it('should throw error for non-existent item', () => {
      expect(() => db.stock.getLevel('non-existent-id')).toThrow(
        'Grocery item not found'
      );
    });

    it('should reflect changes after add/use operations', async () => {
      await db.stock.add(item.id, 5, user.id);
      expect(db.stock.getLevel(item.id)).toBe(15);

      await db.stock.use(item.id, 8, user.id);
      expect(db.stock.getLevel(item.id)).toBe(7);
    });
  });

  describe('getStockTransactions', () => {
    it('should return empty array for item with no transactions', async () => {
      const newItem = await db.groceryItem.create({
        name: 'New Item',
        categoryId: category.id,
        householdId: household.id,
      });

      const transactions = db.stock.getTransactions(newItem.id);
      expect(transactions).toHaveLength(0);
    });

    it('should return transactions in descending order by timestamp', async () => {
      await db.stock.add(item.id, 5, user.id);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
      await db.stock.use(item.id, 3, user.id);
      await new Promise(resolve => setTimeout(resolve, 10));
      await db.stock.add(item.id, 2, user.id);

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 3 new = 4 transactions
      expect(transactions).toHaveLength(4);
      expect(transactions[0].transactionType).toBe('add'); // Most recent
      expect(transactions[0].quantity).toBe(2);
      expect(transactions[1].transactionType).toBe('use');
      expect(transactions[2].transactionType).toBe('add'); // quantity 5
      expect(transactions[3].transactionType).toBe('add'); // Initial (oldest)
    });

    it('should include all transaction details', async () => {
      await db.stock.add(item.id, 5, user.id);

      const transactions = db.stock.getTransactions(item.id);
      const transaction = transactions[0];

      expect(transaction.id).toBeDefined();
      expect(transaction.groceryItemId).toBe(item.id);
      expect(transaction.userId).toBe(user.id);
      expect(transaction.transactionType).toBe('add');
      expect(transaction.quantity).toBe(5);
      expect(transaction.timestamp).toBeDefined();
      expect(transaction.timestamp).toBeGreaterThan(0);
    });
  });

  describe('getStockTransactionsWithUser', () => {
    it('should include user information with each transaction', async () => {
      await db.stock.add(item.id, 5, user.id);
      await db.stock.use(item.id, 2, user.id);

      const transactions = db.stock.getTransactionsWithUser(item.id);
      // 1 initial + 2 new = 3 transactions
      expect(transactions).toHaveLength(3);

      transactions.forEach(({ transaction, user: txUser }) => {
        expect(transaction.id).toBeDefined();
        expect(transaction.userId).toBe(user.id);
        expect(txUser.id).toBe(user.id);
        expect(txUser.name).toBe('Test User');
        expect(txUser.createdAt).toBeDefined();
      });
    });

    it('should handle multiple users', async () => {
      const user2 = await db.user.create('Second User');
      await db.membership.addMemberDirectly(household.id, user2.id);

      await db.stock.add(item.id, 5, user.id);
      await db.stock.use(item.id, 2, user2.id);

      const transactions = db.stock.getTransactionsWithUser(item.id);
      // 1 initial + 2 new = 3 transactions
      expect(transactions).toHaveLength(3);
      expect(transactions[0].user.name).toBe('Second User');
      expect(transactions[1].user.name).toBe('Test User');
      expect(transactions[2].user.name).toBe('Test User'); // Initial transaction
    });
  });

  describe('Mixed operations', () => {
    it('should handle complex sequence of add and use operations', async () => {
      // Start with 10
      await db.stock.add(item.id, 5, user.id); // 15
      await db.stock.use(item.id, 3, user.id); // 12
      await db.stock.add(item.id, 8, user.id); // 20
      await db.stock.use(item.id, 10, user.id); // 10
      await db.stock.use(item.id, 5, user.id); // 5

      const level = db.stock.getLevel(item.id);
      expect(level).toBe(5);

      const transactions = db.stock.getTransactions(item.id);
      // 1 initial + 5 new = 6 transactions
      expect(transactions).toHaveLength(6);
    });

    it('should maintain accurate stock level across operations', async () => {
      const operations = [
        { type: 'add', amount: 10 },
        { type: 'use', amount: 5 },
        { type: 'add', amount: 3 },
        { type: 'use', amount: 8 },
        { type: 'add', amount: 15 },
      ];

      let expectedLevel = 10; // Initial

      for (const op of operations) {
        if (op.type === 'add') {
          await db.stock.add(item.id, op.amount, user.id);
          expectedLevel += op.amount;
        } else {
          await db.stock.use(item.id, op.amount, user.id);
          expectedLevel -= op.amount;
        }

        const currentLevel = db.stock.getLevel(item.id);
        expect(currentLevel).toBe(expectedLevel);
      }
    });
  });
});
