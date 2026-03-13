import type { Household } from '@/types';
import { householdRepository } from '../repositories/household.repository';
import { membershipRepository } from '../repositories/membership.repository';
import { notificationService } from './notification.service';
import { categoryRepository } from '../repositories/category.repository';
import { groceryItemRepository } from '../repositories/grocery-item.repository';
import { categoryService } from './category.service';
import { SAMPLE_CATEGORIES } from './sample-data.service';

/**
 * Household service with business logic
 * Orchestrates household and membership operations
 */
class HouseholdService {
  /**
   * Create a new household with owner membership and default categories
   * Business logic: 
   * - Automatically creates owner membership when household is created
   * - Creates default categories (Dairy, Produce, Meat, Pantry, Beverages)
   */
  async createHousehold(name: string, ownerId: string): Promise<Household> {
    // Create the household
    const household = await householdRepository.createHousehold(name, ownerId);

    // Create the owner membership record
    await membershipRepository.createMembership(ownerId, household.id, 'owner', 'active');

    // Create default categories
    for (const categoryDef of SAMPLE_CATEGORIES) {
      await categoryService.createCategory(categoryDef.name, household.id);
    }

    return household;
  }

  /**
   * Get household by ID
   */
  async getHousehold(id: string): Promise<Household | null> {
    return householdRepository.getHousehold(id);
  }

  /**
   * Get household by reference code
   */
  async getHouseholdByReferenceCode(referenceCode: string): Promise<Household | null> {
    return householdRepository.getHouseholdByReferenceCode(referenceCode);
  }

  /**
   * Transfer ownership to another member
   * Business logic: Updates household owner, changes roles, creates notifications
   */
  async transferOwnership(householdId: string, newOwnerId: string): Promise<void> {
    // Get household to find current owner
    const household = await householdRepository.getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    const currentOwnerId = household.ownerId;

    // Verify new owner is a member
    const newOwnerRole = await membershipRepository.getUserRole(newOwnerId, householdId);
    if (!newOwnerRole) {
      throw new Error('New owner must be a member of the household');
    }

    // Update household owner
    await householdRepository.updateHouseholdOwner(householdId, newOwnerId);

    // Update previous owner to member role
    await membershipRepository.updateUserRole(currentOwnerId, householdId, 'member');

    // Update new owner to owner role
    await membershipRepository.updateUserRole(newOwnerId, householdId, 'owner');

    // Notify all members about ownership transfer
    await notificationService.notifyAllMembers(
      householdId,
      'ownership_transfer',
      `Ownership of household "${household.name}" has been transferred.`
    );
  }

  /**
   * Delete household with cascade
   * Business logic: Removes all associated data (memberships, categories, items, etc.)
   */
  async deleteHousehold(householdId: string): Promise<void> {
    // Get household details for notification message
    const household = await householdRepository.getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    // Notify all members before deletion
    await notificationService.notifyAllMembers(
      householdId,
      'household_deletion',
      `Household "${household.name}" has been deleted by the owner.`
    );
    
    // Delete all grocery items (this will cascade to stock transactions via DB constraints)
    await groceryItemRepository.deleteHouseholdGroceryItems(householdId);

    // Delete all categories
    await categoryRepository.deleteHouseholdCategories(householdId);

    // Delete all memberships
    await membershipRepository.deleteHouseholdMemberships(householdId);

    // Delete the household
    await householdRepository.deleteHousehold(householdId);
  }

  /**
   * Update household name
   */
  async updateHouseholdName(householdId: string, name: string): Promise<void> {
    await householdRepository.updateHouseholdName(householdId, name);
  }

  /**
   * Get all households
   */
  async getAllHouseholds(): Promise<Household[]> {
    return householdRepository.getAllHouseholds();
  }
}

// Export singleton instance
export const householdService = new HouseholdService();
