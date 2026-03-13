/**
 * Inventory Service
 * Business logic for inventory notifications and status calculations
 */

import { groceryItemRepository } from '../repositories/grocery-item.repository';
import { GroceryItem, NotificationStatus } from '@/types';

class InventoryService {
  /**
   * Get items with stock level at or below restock threshold
   */
  async getLowStockItems(householdId: string): Promise<GroceryItem[]> {
    const allItems = await groceryItemRepository.getGroceryItems(householdId);
    return allItems.filter(item => item.stockLevel <= item.restockThreshold);
  }

  /**
   * Get items that are expired or expiring within specified days
   */
  async getExpiringItems(householdId: string, daysAhead: number = 3): Promise<GroceryItem[]> {
    const allItems = await groceryItemRepository.getGroceryItems(householdId);
    const now = Date.now();
    const thresholdTime = now + (daysAhead * 24 * 60 * 60 * 1000);

    return allItems.filter(item => {
      if (!item.expirationDate) {
        return false;
      }
      return item.expirationDate <= thresholdTime;
    });
  }

  /**
   * Calculate notification status for a grocery item
   * Can accept either an item ID (string) or a GroceryItem object
   */
  async calculateNotificationStatus(itemOrId: string | GroceryItem): Promise<NotificationStatus> {
    // If it's a string, fetch the item
    if (typeof itemOrId === 'string') {
      const item = await groceryItemRepository.getGroceryItem(itemOrId);
      if (!item) {
        throw new Error('Grocery item not found');
      }
      return this.calculateNotificationStatusForItem(item);
    }
    
    // If it's an object, use it directly
    return this.calculateNotificationStatusForItem(itemOrId);
  }

  /**
   * Calculate notification status for a grocery item object
   */
  calculateNotificationStatusForItem(item: GroceryItem): NotificationStatus {
    const isLowStock = item.stockLevel <= item.restockThreshold;
    
    let isExpired = false;
    let isExpiringSoon = false;
    let daysUntilExpiration: number | undefined;

    if (item.expirationDate) {
      const now = Date.now();
      const timeUntilExpiration = item.expirationDate - now;
      daysUntilExpiration = Math.ceil(timeUntilExpiration / (24 * 60 * 60 * 1000));

      if (timeUntilExpiration <= 0) {
        isExpired = true;
      } else if (daysUntilExpiration <= 3) {
        isExpiringSoon = true;
      }
    }

    return {
      isLowStock,
      isExpired,
      isExpiringSoon,
      daysUntilExpiration,
    };
  }

  /**
   * Get notification status for all items in a household
   */
  async getItemsWithStatus(householdId: string): Promise<Array<GroceryItem & { status: NotificationStatus }>> {
    const allItems = await groceryItemRepository.getGroceryItems(householdId);
    return allItems.map(item => ({
      ...item,
      status: this.calculateNotificationStatusForItem(item),
    }));
  }
}

export const inventoryService = new InventoryService();
