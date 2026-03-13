import { notificationRepository } from '../repositories/notification.repository';
import { membershipRepository } from '../repositories/membership.repository';
import type { Notification } from '@/types';

/**
 * Notification Service
 * Handles business logic for notifications
 */

export const notificationService = {
  /**
   * Create a notification for a single user
   */
  async createNotification(
    userId: string,
    householdId: string | undefined,
    type: 'ownership_transfer' | 'household_deletion' | 'membership_approved',
    message: string
  ): Promise<Notification> {
    return notificationRepository.createNotification(userId, householdId, type, message);
  },

  /**
   * Get all notifications for a user
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return notificationRepository.getUserNotifications(userId);
  },

  /**
   * Mark a notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    return notificationRepository.markNotificationAsRead(notificationId);
  },

  /**
   * Get unread notification count for a user
   */
  async getUnreadNotificationCount(userId: string): Promise<number> {
    return notificationRepository.getUnreadNotificationCount(userId);
  },

  /**
   * Notify all members of a household
   * Used for ownership transfer and household deletion
   */
  async notifyAllMembers(
    householdId: string,
    type: 'ownership_transfer' | 'household_deletion',
    message: string
  ): Promise<void> {
    // Get all active members of the household
    const memberships = await membershipRepository.getHouseholdMemberships(householdId);
    const activeMembers = memberships.filter((m) => m.status === 'active');

    // Create notification for each member
    const notificationPromises = activeMembers.map((membership) =>
      notificationRepository.createNotification(
        membership.userId,
        householdId,
        type,
        message
      )
    );

    await Promise.all(notificationPromises);
  },
};
