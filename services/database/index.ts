/**
 * Database facade - Single entry point for all database operations
 * Provides a unified API that delegates to appropriate services and repositories
 */

import { dbConnection } from './core/connection';
import { schemaManager } from './core/schema';
import { userRepository } from './repositories/user.repository';
import { householdService } from './services/household.service';
import { membershipService } from './services/membership.service';
import { notificationService } from './services/notification.service';
import { categoryService } from './services/category.service';
import { groceryItemRepository } from './repositories/grocery-item.repository';
import { stockRepository } from './repositories/stock.repository';
import { inventoryService } from './services/inventory.service';
import { 
  isDatabaseEmpty, 
  populateSampleData, 
  checkAndPopulateSampleData 
} from './services/sample-data-population.service';

/**
 * Initialize the database
 * Must be called before any other database operations
 * @param skipSampleData - If true, skips automatic sample data population (useful for tests)
 */
export async function initializeDatabase(skipSampleData: boolean = false): Promise<void> {
  await dbConnection.initialize();
  
  // Create schema if this is a new database
  if (!dbConnection.isInitialized()) {
    throw new Error('Database initialization failed');
  }
  
  // Check if schema exists by trying to query a table
  try {
    await userRepository.getUser('test-id');
  } catch (error) {
    // Schema doesn't exist, create it
    await schemaManager.createSchema();
  }
  
  // Check and populate sample data if database is empty (unless skipped)
  if (!skipSampleData) {
    await checkAndPopulateSampleData();
  }
}

/**
 * Check browser compatibility
 */
export function checkBrowserCompatibility() {
  return dbConnection.checkBrowserCompatibility();
}

/**
 * Database API
 * Organized by domain for easy discovery
 */
export const db = {
  // Initialization
  initialize: initializeDatabase,
  checkCompatibility: checkBrowserCompatibility,

  // Database management
  schema: {
    create: schemaManager.createSchema.bind(schemaManager),
    reset: schemaManager.resetDatabase.bind(schemaManager),
    drop: schemaManager.dropAllTables.bind(schemaManager),
  },

  // User operations (direct repository access - simple CRUD)
  user: {
    create: userRepository.createUser.bind(userRepository),
    get: userRepository.getUser.bind(userRepository),
    getAll: userRepository.getAllUsers.bind(userRepository),
    update: userRepository.updateUser.bind(userRepository),
    delete: userRepository.deleteUser.bind(userRepository),
  },

  // Household operations (service layer - business logic)
  household: {
    create: householdService.createHousehold.bind(householdService),
    get: householdService.getHousehold.bind(householdService),
    getAll: householdService.getAllHouseholds.bind(householdService),
    getByReferenceCode: householdService.getHouseholdByReferenceCode.bind(householdService),
    updateName: householdService.updateHouseholdName.bind(householdService),
    transferOwnership: householdService.transferOwnership.bind(householdService),
    delete: householdService.deleteHousehold.bind(householdService),
  },

  // Membership operations (service layer - business logic)
  membership: {
    requestJoin: membershipService.requestJoinHousehold.bind(membershipService),
    getPendingRequests: membershipService.getPendingMembershipRequests.bind(membershipService),
    getUserPendingRequests: membershipService.getUserPendingRequests.bind(membershipService),
    getUserPendingRequestsWithHousehold: membershipService.getUserPendingRequestsWithHousehold.bind(membershipService),
    acceptRequest: membershipService.acceptMembershipRequest.bind(membershipService),
    rejectRequest: membershipService.rejectMembershipRequest.bind(membershipService),
    addMemberDirectly: membershipService.addMemberDirectly.bind(membershipService),
    getUserHouseholds: membershipService.getUserHouseholds.bind(membershipService),
    getHouseholdMembers: membershipService.getHouseholdMembers.bind(membershipService),
    getUserRole: membershipService.getUserRole.bind(membershipService),
  },

  // Notification operations (service layer - business logic)
  notification: {
    create: notificationService.createNotification.bind(notificationService),
    getUserNotifications: notificationService.getUserNotifications.bind(notificationService),
    markAsRead: notificationService.markNotificationAsRead.bind(notificationService),
    getUnreadCount: notificationService.getUnreadNotificationCount.bind(notificationService),
    notifyAllMembers: notificationService.notifyAllMembers.bind(notificationService),
  },

  // Category operations (service layer - business logic with color assignment)
  category: {
    create: categoryService.createCategory.bind(categoryService),
    get: categoryService.getCategory.bind(categoryService),
    getAll: categoryService.getCategories.bind(categoryService),
    update: categoryService.updateCategory.bind(categoryService),
    delete: categoryService.deleteCategory.bind(categoryService),
  },

  // Grocery item operations (repository layer - CRUD with category validation)
  groceryItem: {
    create: groceryItemRepository.createGroceryItem.bind(groceryItemRepository),
    get: groceryItemRepository.getGroceryItem.bind(groceryItemRepository),
    getAll: groceryItemRepository.getGroceryItems.bind(groceryItemRepository),
    update: groceryItemRepository.updateGroceryItem.bind(groceryItemRepository),
    delete: groceryItemRepository.deleteGroceryItem.bind(groceryItemRepository),
  },

  // Stock operations (repository layer - stock tracking and transactions)
  stock: {
    add: stockRepository.addStock.bind(stockRepository),
    use: stockRepository.useStock.bind(stockRepository),
    getLevel: stockRepository.getStockLevel.bind(stockRepository),
    getTransactions: stockRepository.getStockTransactions.bind(stockRepository),
    getTransactionsWithUser: stockRepository.getStockTransactionsWithUser.bind(stockRepository),
    getItemHistory: stockRepository.getItemHistory.bind(stockRepository),
  },

  // Inventory operations (service layer - notifications and status)
  inventory: {
    getLowStockItems: inventoryService.getLowStockItems.bind(inventoryService),
    getExpiringItems: inventoryService.getExpiringItems.bind(inventoryService),
    calculateNotificationStatus: inventoryService.calculateNotificationStatus.bind(inventoryService),
    calculateNotificationStatusForItem: inventoryService.calculateNotificationStatusForItem.bind(inventoryService),
    getItemsWithStatus: inventoryService.getItemsWithStatus.bind(inventoryService),
  },

  // Sample data operations (service layer - first-use population)
  sampleData: {
    isDatabaseEmpty,
    populateSampleData,
    checkAndPopulateSampleData,
  },
};

// Also export for backward compatibility with existing code
export const databaseService = {
  initialize: initializeDatabase,
  checkBrowserCompatibility,
  createUser: userRepository.createUser.bind(userRepository),
  getUser: userRepository.getUser.bind(userRepository),
  createHousehold: householdService.createHousehold.bind(householdService),
  getHousehold: householdService.getHousehold.bind(householdService),
  getHouseholdByReferenceCode: householdService.getHouseholdByReferenceCode.bind(householdService),
  getUserHouseholds: membershipService.getUserHouseholds.bind(membershipService),
  getHouseholdMembers: membershipService.getHouseholdMembers.bind(membershipService),
  getUserRole: membershipService.getUserRole.bind(membershipService),
  requestJoinHousehold: membershipService.requestJoinHousehold.bind(membershipService),
  getPendingMembershipRequests: membershipService.getPendingMembershipRequests.bind(membershipService),
  acceptMembershipRequest: membershipService.acceptMembershipRequest.bind(membershipService),
  rejectMembershipRequest: membershipService.rejectMembershipRequest.bind(membershipService),
  addMemberDirectly: membershipService.addMemberDirectly.bind(membershipService),
  createNotification: notificationService.createNotification.bind(notificationService),
  getUserNotifications: notificationService.getUserNotifications.bind(notificationService),
  markNotificationAsRead: notificationService.markNotificationAsRead.bind(notificationService),
  getUnreadNotificationCount: notificationService.getUnreadNotificationCount.bind(notificationService),
  createCategory: categoryService.createCategory.bind(categoryService),
  getCategories: categoryService.getCategories.bind(categoryService),
  createGroceryItem: groceryItemRepository.createGroceryItem.bind(groceryItemRepository),
  getGroceryItems: groceryItemRepository.getGroceryItems.bind(groceryItemRepository),
  updateGroceryItem: groceryItemRepository.updateGroceryItem.bind(groceryItemRepository),
  deleteGroceryItem: groceryItemRepository.deleteGroceryItem.bind(groceryItemRepository),
  addStock: stockRepository.addStock.bind(stockRepository),
  useStock: stockRepository.useStock.bind(stockRepository),
  getStockLevel: stockRepository.getStockLevel.bind(stockRepository),
  getStockTransactions: stockRepository.getStockTransactions.bind(stockRepository),
  getStockTransactionsWithUser: stockRepository.getStockTransactionsWithUser.bind(stockRepository),
  getItemHistory: stockRepository.getItemHistory.bind(stockRepository),
  getLowStockItems: inventoryService.getLowStockItems.bind(inventoryService),
  getExpiringItems: inventoryService.getExpiringItems.bind(inventoryService),
  calculateNotificationStatus: inventoryService.calculateNotificationStatus.bind(inventoryService),
  calculateNotificationStatusForItem: inventoryService.calculateNotificationStatusForItem.bind(inventoryService),
  getItemsWithStatus: inventoryService.getItemsWithStatus.bind(inventoryService),
};
