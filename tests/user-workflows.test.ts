/**
 * User Workflow Integration Tests
 * Tests complete user journeys through the application features
 * Validates: All requirements
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/services/database';
import { dbConnection } from '@/services/database/core/connection';
import { schemaManager } from '@/services/database/core/schema';
import type { User, Household, Category, GroceryItem } from '@/types';

describe('User Workflows', () => {
  let owner: User;
  let member: User;
  let household: Household;

  beforeEach(async () => {
    // Initialize database without sample data for clean workflow tests
    // We manually initialize to avoid sample data population
    await dbConnection.initialize();
    
    // Only create schema if it doesn't exist
    try {
      await db.user.get('test-check');
    } catch (error) {
      // Schema doesn't exist, create it
      await schemaManager.createSchema();
    }
  });

  describe('Workflow 1: Household Creation and Management', () => {
    it('should complete household creation workflow', async () => {
      // Step 1: Create a user
      owner = await db.user.create('Alice');
      expect(owner).toBeDefined();
      expect(owner.name).toBe('Alice');
      expect(owner.id).toBeDefined();

      // Step 2: Create a household
      household = await db.household.create('Alice\'s Home', owner.id);
      expect(household).toBeDefined();
      expect(household.name).toBe('Alice\'s Home');
      expect(household.ownerId).toBe(owner.id);
      expect(household.referenceCode).toBeDefined();
      expect(household.referenceCode.length).toBeGreaterThan(0);

      // Step 3: Verify owner has access to household
      const userHouseholds = await db.membership.getUserHouseholds(owner.id);
      expect(userHouseholds).toHaveLength(1);
      expect(userHouseholds[0].household.id).toBe(household.id);
      expect(userHouseholds[0].role).toBe('owner');

      // Step 4: Verify owner role
      const role = await db.membership.getUserRole(owner.id, household.id);
      expect(role).toBe('owner');
    });

    it('should complete household management workflow with multiple households', async () => {
      // Create user
      owner = await db.user.create('Bob');

      // Create multiple households
      const household1 = await db.household.create('Home', owner.id);
      const household2 = await db.household.create('Vacation House', owner.id);

      // Verify user has access to both households
      const userHouseholds = await db.membership.getUserHouseholds(owner.id);
      expect(userHouseholds).toHaveLength(2);

      const householdIds = userHouseholds.map(h => h.household.id);
      expect(householdIds).toContain(household1.id);
      expect(householdIds).toContain(household2.id);

      // Verify owner role for both
      expect(userHouseholds.every(h => h.role === 'owner')).toBe(true);
    });

    it('should complete ownership transfer workflow', async () => {
      // Setup: Create owner, member, and household
      owner = await db.user.create('Charlie');
      member = await db.user.create('Diana');
      household = await db.household.create('Charlie\'s Home', owner.id);

      // Add member to household
      await db.membership.addMemberDirectly(household.id, member.id);

      // Transfer ownership (only needs household ID and new owner ID)
      await db.household.transferOwnership(household.id, member.id);

      // Verify new owner role
      const newOwnerRole = await db.membership.getUserRole(member.id, household.id);
      expect(newOwnerRole).toBe('owner');

      // Verify previous owner is now member
      const previousOwnerRole = await db.membership.getUserRole(owner.id, household.id);
      expect(previousOwnerRole).toBe('member');

      // Verify household owner_id updated
      const updatedHousehold = await db.household.get(household.id);
      expect(updatedHousehold?.ownerId).toBe(member.id);

      // Verify notifications sent to all members
      const ownerNotifications = await db.notification.getUserNotifications(owner.id);
      const memberNotifications = await db.notification.getUserNotifications(member.id);
      
      expect(ownerNotifications.some(n => n.type === 'ownership_transfer')).toBe(true);
      expect(memberNotifications.some(n => n.type === 'ownership_transfer')).toBe(true);
    });

    it('should complete household deletion workflow', async () => {
      // Setup: Create owner, member, household with data
      owner = await db.user.create('Eve');
      member = await db.user.create('Frank');
      household = await db.household.create('Eve\'s Home', owner.id);

      // Add member
      await db.membership.addMemberDirectly(household.id, member.id);

      // Create some data in the household
      const category = await db.category.create('Test Category', household.id, '#FF0000');
      const item = await db.groceryItem.create({
        name: 'Test Item',
        categoryId: category.id,
        householdId: household.id,
        initialStockLevel: 5,
      }, owner.id);

      // Add stock transaction
      await db.stock.add(item.id, 3, owner.id);

      // Delete household
      await db.household.delete(household.id);

      // Verify household deleted
      const deletedHousehold = await db.household.get(household.id);
      expect(deletedHousehold).toBeNull();

      // Verify notifications sent before deletion
      const ownerNotifications = await db.notification.getUserNotifications(owner.id);
      const memberNotifications = await db.notification.getUserNotifications(member.id);
      
      expect(ownerNotifications.some(n => n.type === 'household_deletion')).toBe(true);
      expect(memberNotifications.some(n => n.type === 'household_deletion')).toBe(true);

      // Note: Cascade deletion of categories and items is not yet implemented
      // This test verifies the core deletion workflow and notifications
    });
  });

  describe('Workflow 2: Membership Invitation and Approval', () => {
    beforeEach(async () => {
      // Setup common scenario
      owner = await db.user.create('Owner User');
      household = await db.household.create('Test Household', owner.id);
    });

    it('should complete membership request and approval workflow', async () => {
      // Step 1: New user wants to join
      member = await db.user.create('New Member');

      // Step 2: User requests to join using reference code
      const membership = await db.membership.requestJoin(member.id, household.referenceCode);
      expect(membership).toBeDefined();
      expect(membership.status).toBe('pending');
      expect(membership.userId).toBe(member.id);
      expect(membership.householdId).toBe(household.id);

      // Step 3: Owner sees pending request
      const pendingRequests = await db.membership.getPendingRequests(household.id);
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].userId).toBe(member.id);

      // Step 4: Owner approves request
      await db.membership.acceptRequest(membership.id);

      // Step 5: Verify member now has access
      const memberHouseholds = await db.membership.getUserHouseholds(member.id);
      expect(memberHouseholds).toHaveLength(1);
      expect(memberHouseholds[0].household.id).toBe(household.id);
      expect(memberHouseholds[0].role).toBe('member');

      // Step 6: Verify no more pending requests
      const remainingRequests = await db.membership.getPendingRequests(household.id);
      expect(remainingRequests).toHaveLength(0);

      // Step 7: Verify member received approval notification
      const notifications = await db.notification.getUserNotifications(member.id);
      expect(notifications.some(n => n.type === 'membership_approved')).toBe(true);
    });

    it('should complete membership rejection workflow', async () => {
      // User requests to join
      member = await db.user.create('Rejected Member');
      const membership = await db.membership.requestJoin(member.id, household.referenceCode);

      // Owner rejects request
      await db.membership.rejectRequest(membership.id);

      // Verify member does not have access
      const memberHouseholds = await db.membership.getUserHouseholds(member.id);
      expect(memberHouseholds).toHaveLength(0);

      // Verify no pending requests
      const pendingRequests = await db.membership.getPendingRequests(household.id);
      expect(pendingRequests).toHaveLength(0);
    });

    it('should complete direct member addition workflow', async () => {
      // Owner adds member directly without approval process
      member = await db.user.create('Direct Member');
      
      await db.membership.addMemberDirectly(household.id, member.id);

      // Verify member has immediate access
      const memberHouseholds = await db.membership.getUserHouseholds(member.id);
      expect(memberHouseholds).toHaveLength(1);
      expect(memberHouseholds[0].household.id).toBe(household.id);
      expect(memberHouseholds[0].role).toBe('member');

      // Verify member appears in household members list
      const householdMembers = await db.membership.getHouseholdMembers(household.id);
      expect(householdMembers.some(m => m.id === member.id)).toBe(true);
    });
  });

  describe('Workflow 3: Grocery Item Creation and Management', () => {
    let category: Category;
    let testId: string;

    beforeEach(async () => {
      // Setup common scenario
      testId = Date.now().toString(); // Unique ID for this test run
      owner = await db.user.create('Grocery Manager');
      household = await db.household.create('Grocery Household', owner.id);
      // Use unique category name to avoid conflicts
      category = await db.category.create(`Fresh Produce ${testId}`, household.id, '#A8E6CF');
    });

    it('should complete item creation workflow', async () => {
      // Step 1: Create grocery item with all fields
      const item = await db.groceryItem.create({
        name: 'Apples',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        unit: 'pieces',
        notes: 'Prefer Gala apples',
        expirationDate: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days from now
        initialStockLevel: 10,
      }, owner.id);

      expect(item).toBeDefined();
      expect(item.name).toBe('Apples');
      expect(item.categoryId).toBe(category.id);
      expect(item.stockLevel).toBe(10);
      expect(item.restockThreshold).toBe(5);
      expect(item.unit).toBe('pieces');
      expect(item.notes).toBe('Prefer Gala apples');
      expect(item.expirationDate).toBeDefined();

      // Step 2: Verify item appears in household items
      const items = await db.groceryItem.getAll(household.id);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe(item.id);

      // Step 3: Add stock explicitly to create transaction record
      await db.stock.add(item.id, 5, owner.id);

      // Step 4: Verify stock transaction was recorded
      const transactions = await db.stock.getTransactions(item.id);
      expect(transactions.length).toBeGreaterThanOrEqual(1);
      const addTransaction = transactions.find(t => t.transactionType === 'add' && t.quantity === 5);
      expect(addTransaction).toBeDefined();
    });

    it('should complete item update workflow', async () => {
      // Create item
      const item = await db.groceryItem.create({
        name: 'Bananas',
        categoryId: category.id,
        householdId: household.id,
        unit: 'pieces',
      });

      // Update item metadata
      await db.groceryItem.update(item.id, {
        name: 'Organic Bananas',
        restockThreshold: 3,
        notes: 'Buy organic only',
        expirationDate: Date.now() + 5 * 24 * 60 * 60 * 1000,
      });

      // Verify updates
      const updatedItem = await db.groceryItem.get(item.id);
      expect(updatedItem?.name).toBe('Organic Bananas');
      expect(updatedItem?.restockThreshold).toBe(3);
      expect(updatedItem?.notes).toBe('Buy organic only');
      expect(updatedItem?.expirationDate).toBeDefined();
      expect(updatedItem?.categoryId).toBe(category.id); // Unchanged
      expect(updatedItem?.unit).toBe('pieces'); // Unchanged
    });

    it('should complete item deletion workflow', async () => {
      // Create item
      const item = await db.groceryItem.create({
        name: 'Oranges',
        categoryId: category.id,
        householdId: household.id,
      });

      // Delete item
      await db.groceryItem.delete(item.id);

      // Verify item deleted
      const deletedItem = await db.groceryItem.get(item.id);
      expect(deletedItem).toBeNull();

      // Verify not in household items
      const items = await db.groceryItem.getAll(household.id);
      expect(items.every(i => i.id !== item.id)).toBe(true);
    });

    it('should complete multi-category organization workflow', async () => {
      // Create multiple categories with unique names
      const dairy = await db.category.create(`Dairy Products ${testId}`, household.id, '#4ECDC4');
      const meat = await db.category.create(`Meat & Poultry ${testId}`, household.id, '#FF6B6B');

      // Create items in different categories
      const milk = await db.groceryItem.create({
        name: 'Milk',
        categoryId: dairy.id,
        householdId: household.id,
        unit: 'liters',
      });

      const apples = await db.groceryItem.create({
        name: 'Apples',
        categoryId: category.id, // Produce
        householdId: household.id,
        unit: 'pieces',
      });

      const chicken = await db.groceryItem.create({
        name: 'Chicken',
        categoryId: meat.id,
        householdId: household.id,
        unit: 'kg',
      });

      // Verify items grouped by category
      const allItems = await db.groceryItem.getAll(household.id);
      expect(allItems).toHaveLength(3);

      const produceItems = allItems.filter(i => i.categoryId === category.id);
      const dairyItems = allItems.filter(i => i.categoryId === dairy.id);
      const meatItems = allItems.filter(i => i.categoryId === meat.id);

      expect(produceItems).toHaveLength(1);
      expect(dairyItems).toHaveLength(1);
      expect(meatItems).toHaveLength(1);
    });
  });

  describe('Workflow 4: Stock Operations and History', () => {
    let category: Category;
    let item: GroceryItem;
    let testId: string;

    beforeEach(async () => {
      // Setup common scenario
      testId = Date.now().toString();
      owner = await db.user.create('Stock Manager');
      member = await db.user.create('Stock User');
      household = await db.household.create('Stock Household', owner.id);
      await db.membership.addMemberDirectly(household.id, member.id);
      
      // Use unique category name
      category = await db.category.create(`Pantry Items ${testId}`, household.id, '#F7DC6F');
      item = await db.groceryItem.create({
        name: 'Rice',
        categoryId: category.id,
        householdId: household.id,
        unit: 'kg',
        restockThreshold: 2,
        initialStockLevel: 5,
      }, owner.id);
    });

    it('should complete stock addition workflow', async () => {
      // Step 1: Check initial stock
      const initialStock = await db.stock.getLevel(item.id);
      expect(initialStock).toBe(5);

      // Step 2: Owner adds stock
      await db.stock.add(item.id, 3, owner.id);

      // Step 3: Verify stock increased
      const newStock = await db.stock.getLevel(item.id);
      expect(newStock).toBe(8);

      // Step 4: Verify transaction recorded
      const transactions = await db.stock.getTransactions(item.id);
      const addTransaction = transactions.find(t => t.quantity === 3);
      expect(addTransaction).toBeDefined();
      expect(addTransaction?.transactionType).toBe('add');
      expect(addTransaction?.userId).toBe(owner.id);
    });

    it('should complete stock usage workflow', async () => {
      // Step 1: Member uses stock
      await db.stock.use(item.id, 2, member.id);

      // Step 2: Verify stock decreased
      const newStock = await db.stock.getLevel(item.id);
      expect(newStock).toBe(3);

      // Step 3: Verify transaction recorded
      const transactions = await db.stock.getTransactions(item.id);
      const useTransaction = transactions.find(
        t => t.transactionType === 'use' && t.quantity === 2
      );
      expect(useTransaction).toBeDefined();
      expect(useTransaction?.userId).toBe(member.id);
    });

    it('should complete item history viewing workflow', async () => {
      // Step 1: Perform multiple stock operations
      await db.stock.add(item.id, 5, owner.id);
      await db.stock.use(item.id, 3, member.id);
      await db.stock.add(item.id, 2, member.id);
      await db.stock.use(item.id, 1, owner.id);

      // Step 2: View item history
      const history = await db.stock.getItemHistory(item.id);

      // Step 3: Verify history includes creation timestamp
      expect(history.itemCreatedAt).toBeDefined();
      expect(history.itemCreatedAt).toBeLessThanOrEqual(Date.now());

      // Step 4: Verify all transactions included (4 operations, no initial transaction)
      expect(history.transactions.length).toBeGreaterThanOrEqual(4);

      // Step 5: Verify transactions include user information
      const transactionWithOwner = history.transactions.find(
        t => t.user.id === owner.id
      );
      expect(transactionWithOwner).toBeDefined();
      expect(transactionWithOwner?.user.name).toBe('Stock Manager');

      const transactionWithMember = history.transactions.find(
        t => t.user.id === member.id
      );
      expect(transactionWithMember).toBeDefined();
      expect(transactionWithMember?.user.name).toBe('Stock User');

      // Step 6: Verify transactions sorted by timestamp (descending)
      for (let i = 0; i < history.transactions.length - 1; i++) {
        expect(history.transactions[i].transaction.timestamp)
          .toBeGreaterThanOrEqual(history.transactions[i + 1].transaction.timestamp);
      }
    });

    it('should complete negative stock handling workflow', async () => {
      // Try to use more stock than available
      const currentStock = await db.stock.getLevel(item.id);
      await db.stock.use(item.id, currentStock + 10, owner.id);

      // Verify stock set to zero (not negative)
      const newStock = await db.stock.getLevel(item.id);
      expect(newStock).toBe(0);
      expect(newStock).toBeGreaterThanOrEqual(0);
    });

    it('should complete multi-user stock management workflow', async () => {
      // Multiple users perform operations
      await db.stock.add(item.id, 10, owner.id);
      await db.stock.use(item.id, 3, member.id);
      await db.stock.add(item.id, 5, member.id);
      await db.stock.use(item.id, 2, owner.id);

      // Verify final stock level is correct
      const finalStock = await db.stock.getLevel(item.id);
      expect(finalStock).toBe(5 + 10 - 3 + 5 - 2); // 15

      // Verify all users' transactions recorded
      const transactionsWithUser = await db.stock.getTransactionsWithUser(item.id);
      const ownerTransactions = transactionsWithUser.filter(t => t.user.id === owner.id);
      const memberTransactions = transactionsWithUser.filter(t => t.user.id === member.id);

      expect(ownerTransactions.length).toBeGreaterThan(0);
      expect(memberTransactions.length).toBeGreaterThan(0);
    });
  });

  describe('Workflow 5: Notification System', () => {
    let category: Category;
    let testId: string;

    beforeEach(async () => {
      // Setup common scenario
      testId = Date.now().toString();
      owner = await db.user.create('Notification User');
      household = await db.household.create('Notification Household', owner.id);
      // Use unique category name
      category = await db.category.create(`Food Items ${testId}`, household.id, '#45B7D1');
    });

    it('should complete low stock notification workflow', async () => {
      // Step 1: Create item with low stock
      const item = await db.groceryItem.create({
        name: 'Coffee',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        unit: 'kg',
        initialStockLevel: 5, // Below threshold
      }, owner.id);

      // Step 2: Check low stock items
      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      expect(lowStockItems.some(i => i.id === item.id)).toBe(true);

      // Step 3: Verify notification status
      const status = await db.inventory.calculateNotificationStatus(item);
      expect(status.isLowStock).toBe(true);

      // Step 4: Add stock to bring above threshold
      await db.stock.add(item.id, 10, owner.id);

      // Step 5: Verify no longer in low stock
      const updatedLowStockItems = await db.inventory.getLowStockItems(household.id);
      expect(updatedLowStockItems.some(i => i.id === item.id)).toBe(false);
    });

    it('should complete expiration notification workflow', async () => {
      // Step 1: Create item expiring soon (2 days)
      const twoDaysFromNow = Date.now() + 2 * 24 * 60 * 60 * 1000;
      const expiringItem = await db.groceryItem.create({
        name: 'Yogurt',
        categoryId: category.id,
        householdId: household.id,
        unit: 'pieces',
        expirationDate: twoDaysFromNow,
        initialStockLevel: 5,
      }, owner.id);

      // Step 2: Check expiring items (within 3 days)
      const expiringItems = await db.inventory.getExpiringItems(household.id, 3);
      expect(expiringItems.some(i => i.id === expiringItem.id)).toBe(true);

      // Step 3: Verify notification status
      const status = await db.inventory.calculateNotificationStatus(expiringItem);
      expect(status.isExpiringSoon).toBe(true);
      expect(status.daysUntilExpiration).toBeLessThanOrEqual(3);
    });

    it('should complete expired item notification workflow', async () => {
      // Step 1: Create expired item
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const expiredItem = await db.groceryItem.create({
        name: 'Old Bread',
        categoryId: category.id,
        householdId: household.id,
        unit: 'pieces',
        expirationDate: yesterday,
        initialStockLevel: 2,
      }, owner.id);

      // Step 2: Check expiring items
      const expiringItems = await db.inventory.getExpiringItems(household.id, 3);
      expect(expiringItems.some(i => i.id === expiredItem.id)).toBe(true);

      // Step 3: Verify notification status shows expired
      const status = await db.inventory.calculateNotificationStatus(expiredItem);
      expect(status.isExpired).toBe(true);
    });

    it('should complete multiple notification indicators workflow', async () => {
      // Step 1: Create item with both low stock AND expiring soon
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      const item = await db.groceryItem.create({
        name: 'Cheese',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 5,
        unit: 'pieces',
        expirationDate: tomorrow,
        initialStockLevel: 2, // Below threshold
      }, owner.id);

      // Step 2: Verify appears in both notification lists
      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      const expiringItems = await db.inventory.getExpiringItems(household.id, 3);

      expect(lowStockItems.some(i => i.id === item.id)).toBe(true);
      expect(expiringItems.some(i => i.id === item.id)).toBe(true);

      // Step 3: Verify status shows both indicators
      const status = await db.inventory.calculateNotificationStatus(item);
      expect(status.isLowStock).toBe(true);
      expect(status.isExpiringSoon).toBe(true);
    });

    it('should complete notification filtering workflow', async () => {
      // Create items with different notification states
      const lowStockItem = await db.groceryItem.create({
        name: 'Sugar',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 10,
        unit: 'kg',
        initialStockLevel: 5,
      }, owner.id);

      const expiringItem = await db.groceryItem.create({
        name: 'Milk',
        categoryId: category.id,
        householdId: household.id,
        unit: 'liters',
        expirationDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
        initialStockLevel: 10,
      }, owner.id);

      const normalItem = await db.groceryItem.create({
        name: 'Pasta',
        categoryId: category.id,
        householdId: household.id,
        restockThreshold: 2,
        unit: 'kg',
        initialStockLevel: 10,
      }, owner.id);

      // Get items with status
      const itemsWithStatus = await db.inventory.getItemsWithStatus(household.id);

      // Verify filtering
      const lowStock = itemsWithStatus.filter(i => i.status.isLowStock);
      const expiring = itemsWithStatus.filter(i => i.status.isExpiringSoon || i.status.isExpired);
      const normal = itemsWithStatus.filter(
        i => !i.status.isLowStock && !i.status.isExpiringSoon && !i.status.isExpired
      );

      expect(lowStock.some(i => i.id === lowStockItem.id)).toBe(true);
      expect(expiring.some(i => i.id === expiringItem.id)).toBe(true);
      expect(normal.some(i => i.id === normalItem.id)).toBe(true);
    });

    it('should complete notification reading workflow', async () => {
      // Step 1: Create notifications for user
      await db.notification.create(
        owner.id,
        household.id,
        'ownership_transfer',
        'You are now the owner of Test Household'
      );

      await db.notification.create(
        owner.id,
        household.id,
        'membership_approved',
        'Your membership request was approved'
      );

      // Step 2: Get unread count
      const unreadCount = await db.notification.getUnreadCount(owner.id);
      expect(unreadCount).toBe(2);

      // Step 3: Get all notifications
      const notifications = await db.notification.getUserNotifications(owner.id);
      expect(notifications).toHaveLength(2);
      expect(notifications.every(n => !n.isRead)).toBe(true);

      // Step 4: Mark one as read
      await db.notification.markAsRead(notifications[0].id);

      // Step 5: Verify unread count decreased
      const newUnreadCount = await db.notification.getUnreadCount(owner.id);
      expect(newUnreadCount).toBe(1);

      // Step 6: Verify notification marked as read
      const updatedNotifications = await db.notification.getUserNotifications(owner.id);
      const readNotification = updatedNotifications.find(n => n.id === notifications[0].id);
      expect(readNotification?.isRead).toBe(true);
    });
  });

  describe('Workflow 6: Complete End-to-End Scenario', () => {
    it('should complete full household grocery management workflow', async () => {
      const testId = Date.now().toString();
      
      // === Phase 1: Setup household ===
      owner = await db.user.create('Alice');
      household = await db.household.create('Alice\'s Kitchen', owner.id);

      // === Phase 2: Invite member ===
      member = await db.user.create('Bob');
      const membership = await db.membership.requestJoin(member.id, household.referenceCode);
      await db.membership.acceptRequest(membership.id);

      // Verify both users have access
      const ownerHouseholds = await db.membership.getUserHouseholds(owner.id);
      const memberHouseholds = await db.membership.getUserHouseholds(member.id);
      expect(ownerHouseholds).toHaveLength(1);
      expect(memberHouseholds).toHaveLength(1);

      // === Phase 3: Create categories ===
      const produce = await db.category.create(`Fresh Fruits & Vegetables ${testId}`, household.id, '#A8E6CF');
      const dairy = await db.category.create(`Dairy & Eggs ${testId}`, household.id, '#4ECDC4');
      const pantry = await db.category.create(`Pantry Staples ${testId}`, household.id, '#F7DC6F');

      const categories = await db.category.getAll(household.id);
      // 5 default + 3 new = 8 categories
      expect(categories).toHaveLength(8);

      // === Phase 4: Create grocery items ===
      const apples = await db.groceryItem.create({
        name: 'Apples',
        categoryId: produce.id,
        householdId: household.id,
        restockThreshold: 5,
        unit: 'pieces',
        initialStockLevel: 10,
      }, owner.id);

      const milk = await db.groceryItem.create({
        name: 'Milk',
        categoryId: dairy.id,
        householdId: household.id,
        restockThreshold: 1,
        unit: 'liters',
        expirationDate: Date.now() + 2 * 24 * 60 * 60 * 1000,
        initialStockLevel: 2,
      }, owner.id);

      const rice = await db.groceryItem.create({
        name: 'Rice',
        categoryId: pantry.id,
        householdId: household.id,
        restockThreshold: 2,
        unit: 'kg',
        initialStockLevel: 5,
      }, owner.id);

      const items = await db.groceryItem.getAll(household.id);
      expect(items).toHaveLength(3);

      // === Phase 5: Stock operations by both users ===
      // Owner adds stock
      await db.stock.add(apples.id, 5, owner.id);
      await db.stock.add(milk.id, 1, owner.id);

      // Member uses stock
      await db.stock.use(apples.id, 8, member.id);
      await db.stock.use(rice.id, 3, member.id);

      // Owner uses stock
      await db.stock.use(milk.id, 2, owner.id);

      // Verify stock levels
      expect(await db.stock.getLevel(apples.id)).toBe(10 + 5 - 8); // 7
      expect(await db.stock.getLevel(milk.id)).toBe(2 + 1 - 2); // 1
      expect(await db.stock.getLevel(rice.id)).toBe(5 - 3); // 2

      // === Phase 6: Check notifications ===
      const lowStockItems = await db.inventory.getLowStockItems(household.id);
      const expiringItems = await db.inventory.getExpiringItems(household.id, 3);

      // Milk should be low stock (1 liter, threshold 1)
      expect(lowStockItems.some(i => i.id === milk.id)).toBe(true);
      
      // Rice should be low stock (2 kg, threshold 2)
      expect(lowStockItems.some(i => i.id === rice.id)).toBe(true);

      // Milk should be expiring soon
      expect(expiringItems.some(i => i.id === milk.id)).toBe(true);

      // === Phase 7: View item history ===
      const applesHistory = await db.stock.getItemHistory(apples.id);
      expect(applesHistory.transactions.length).toBeGreaterThanOrEqual(2); // add + use (no initial transaction)

      // Verify both users appear in history
      const ownerTransactions = applesHistory.transactions.filter(t => t.user.id === owner.id);
      const memberTransactions = applesHistory.transactions.filter(t => t.user.id === member.id);
      expect(ownerTransactions.length).toBeGreaterThan(0);
      expect(memberTransactions.length).toBeGreaterThan(0);

      // === Phase 8: Update item ===
      await db.groceryItem.update(apples.id, {
        notes: 'Buy organic only',
        restockThreshold: 8,
      });

      const updatedApples = await db.groceryItem.get(apples.id);
      expect(updatedApples?.notes).toBe('Buy organic only');
      expect(updatedApples?.restockThreshold).toBe(8);

      // === Phase 9: Transfer ownership ===
      await db.household.transferOwnership(household.id, member.id);

      // Verify roles switched
      expect(await db.membership.getUserRole(member.id, household.id)).toBe('owner');
      expect(await db.membership.getUserRole(owner.id, household.id)).toBe('member');

      // Verify notifications sent
      const ownerNotifications = await db.notification.getUserNotifications(owner.id);
      const memberNotifications = await db.notification.getUserNotifications(member.id);
      expect(ownerNotifications.some(n => n.type === 'ownership_transfer')).toBe(true);
      expect(memberNotifications.some(n => n.type === 'ownership_transfer')).toBe(true);

      // === Phase 10: Verify complete state ===
      const finalItems = await db.groceryItem.getAll(household.id);
      const finalCategories = await db.category.getAll(household.id);
      const finalMembers = await db.membership.getHouseholdMembers(household.id);

      expect(finalItems).toHaveLength(3);
      expect(finalCategories).toHaveLength(8); // 5 default + 3 created
      expect(finalMembers).toHaveLength(2);
    });
  });
});
