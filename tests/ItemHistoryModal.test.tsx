/**
 * ItemHistoryModal Component Integration Tests
 * Verifies the item history display functionality
 * 
 * Requirements: 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5, 6.1.6, 6.1.7
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { dbConnection } from '@/services/database/core/connection';
import { schemaManager } from '@/services/database/core/schema';
import { db } from '@/services/database';

describe('ItemHistoryModal Integration', () => {
  let testUserId1: string;
  let testUserId2: string;
  let testHouseholdId: string;
  let testCategoryId: string;

  beforeEach(async () => {
    // Initialize database connection
    await dbConnection.initialize();
    
    // Create test users
    const user1 = await db.user.create('Alice');
    testUserId1 = user1.id;
    
    const user2 = await db.user.create('Bob');
    testUserId2 = user2.id;

    // Create test household
    const household = await db.household.create('Test Household', testUserId1);
    testHouseholdId = household.id;

    // Create test category
    const category = await db.category.create('Test Category', '#FF6B6B', testHouseholdId);
    testCategoryId = category.id;
  });

  it('should retrieve item creation timestamp (Requirement 6.1.6)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 1',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    const history = await db.stock.getItemHistory(item.id);
    
    expect(history.itemCreatedAt).toBeDefined();
    expect(typeof history.itemCreatedAt).toBe('number');
    expect(history.itemCreatedAt).toBeGreaterThan(0);
  });

  it('should display all stock transactions (Requirement 6.1.1)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 2',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    await db.stock.add(item.id, 5, testUserId1);
    await db.stock.use(item.id, 3, testUserId2);
    await db.stock.add(item.id, 2, testUserId1);

    const history = await db.stock.getItemHistory(item.id);
    
    expect(history.transactions).toBeDefined();
    expect(history.transactions.length).toBeGreaterThanOrEqual(4); // 1 initial + 3 new
  });

  it('should display user who performed each transaction (Requirement 6.1.2)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 3',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    await db.stock.add(item.id, 5, testUserId1);
    
    const history = await db.stock.getItemHistory(item.id);
    
    for (const txn of history.transactions) {
      expect(txn.user).toBeDefined();
      expect(txn.user.id).toBeDefined();
      expect(txn.user.name).toBeDefined();
      expect(typeof txn.user.name).toBe('string');
    }
  });

  it('should display timestamp for each transaction (Requirement 6.1.3)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 4',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    const history = await db.stock.getItemHistory(item.id);
    
    for (const txn of history.transactions) {
      expect(txn.transaction.timestamp).toBeDefined();
      expect(typeof txn.transaction.timestamp).toBe('number');
      expect(txn.transaction.timestamp).toBeGreaterThan(0);
    }
  });

  it('should display quantity for each transaction (Requirement 6.1.4)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 5',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    const history = await db.stock.getItemHistory(item.id);
    
    for (const txn of history.transactions) {
      expect(txn.transaction.quantity).toBeDefined();
      expect(typeof txn.transaction.quantity).toBe('number');
      expect(txn.transaction.quantity).toBeGreaterThan(0);
    }
  });

  it('should display transaction type (add or use) (Requirement 6.1.5)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 6',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    const history = await db.stock.getItemHistory(item.id);
    
    for (const txn of history.transactions) {
      expect(txn.transaction.transactionType).toBeDefined();
      expect(['add', 'use']).toContain(txn.transaction.transactionType);
    }
  });

  it('should sort transactions by timestamp in descending order (Requirement 6.1.7)', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 7',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    await db.stock.add(item.id, 5, testUserId1);
    await db.stock.use(item.id, 3, testUserId2);
    
    const history = await db.stock.getItemHistory(item.id);
    
    for (let i = 0; i < history.transactions.length - 1; i++) {
      const current = history.transactions[i].transaction.timestamp;
      const next = history.transactions[i + 1].transaction.timestamp;
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });

  it('should include both add and use transactions', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 8',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    await db.stock.add(item.id, 5, testUserId1);
    await db.stock.use(item.id, 3, testUserId2);
    
    const history = await db.stock.getItemHistory(item.id);
    
    const addTransactions = history.transactions.filter(
      txn => txn.transaction.transactionType === 'add'
    );
    const useTransactions = history.transactions.filter(
      txn => txn.transaction.transactionType === 'use'
    );
    
    expect(addTransactions.length).toBeGreaterThan(0);
    expect(useTransactions.length).toBeGreaterThan(0);
  });

  it('should correctly attribute transactions to different users', async () => {
    const item = await db.groceryItem.create({
      name: 'Test Item 9',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 10,
    }, testUserId1);
    
    await db.stock.add(item.id, 5, testUserId1);
    await db.stock.use(item.id, 3, testUserId2);
    
    const history = await db.stock.getItemHistory(item.id);
    
    const user1Transactions = history.transactions.filter(
      txn => txn.user.id === testUserId1
    );
    const user2Transactions = history.transactions.filter(
      txn => txn.user.id === testUserId2
    );
    
    expect(user1Transactions.length).toBeGreaterThan(0);
    expect(user2Transactions.length).toBeGreaterThan(0);
  });

  it('should handle items with no transactions', async () => {
    const item = await db.groceryItem.create({
      name: 'Empty Item',
      categoryId: testCategoryId,
      householdId: testHouseholdId,
      restockThreshold: 5,
      unit: 'pieces',
      initialStockLevel: 0,
    });

    const history = await db.stock.getItemHistory(item.id);
    
    expect(history.itemCreatedAt).toBeDefined();
    expect(history.transactions).toBeDefined();
    expect(history.transactions.length).toBe(0);
  });
});
