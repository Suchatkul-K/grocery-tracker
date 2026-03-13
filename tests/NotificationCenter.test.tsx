/**
 * NotificationCenter Component Integration Tests
 * Verifies the notification system functionality
 * 
 * Requirements: 1.1.4, 1.2.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { dbConnection } from '@/services/database/core/connection';
import { schemaManager } from '@/services/database/core/schema';
import { db } from '@/services/database';

describe('NotificationCenter Integration', () => {
  let testUserId: string;
  let testHouseholdId: string;

  beforeEach(async () => {
    // Initialize database connection
    await dbConnection.initialize();

    // Create test user and household
    const user = await db.user.create('Test User');
    testUserId = user.id;

    const household = await db.household.create('Test Household', testUserId);
    testHouseholdId = household.id;
  });

  describe('Notification Creation', () => {
    it('should create ownership transfer notification', async () => {
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'ownership_transfer',
        'You are now the owner of Test Household'
      );

      expect(notification).toBeDefined();
      expect(notification.userId).toBe(testUserId);
      expect(notification.householdId).toBe(testHouseholdId);
      expect(notification.type).toBe('ownership_transfer');
      expect(notification.message).toBe('You are now the owner of Test Household');
      expect(notification.isRead).toBe(false);
      expect(notification.createdAt).toBeDefined();
    });

    it('should create household deletion notification', async () => {
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'household_deletion',
        'Household "Test Household" has been deleted'
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('household_deletion');
      expect(notification.isRead).toBe(false);
    });

    it('should create membership approved notification', async () => {
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'membership_approved',
        'Your request to join Test Household has been approved'
      );

      expect(notification).toBeDefined();
      expect(notification.type).toBe('membership_approved');
      expect(notification.isRead).toBe(false);
    });
  });

  describe('Notification Retrieval', () => {
    it('should retrieve all notifications for a user', async () => {
      // Ensure at least one notification exists
      await db.notification.create(
        testUserId,
        testHouseholdId,
        'ownership_transfer',
        'Test notification for retrieval'
      );

      const notifications = await db.notification.getUserNotifications(testUserId);

      expect(notifications).toBeDefined();
      expect(Array.isArray(notifications)).toBe(true);
      expect(notifications.length).toBeGreaterThan(0);
    });

    it('should return notifications in descending order by creation time', async () => {
      const notifications = await db.notification.getUserNotifications(testUserId);

      if (notifications.length > 1) {
        for (let i = 0; i < notifications.length - 1; i++) {
          expect(notifications[i].createdAt).toBeGreaterThanOrEqual(
            notifications[i + 1].createdAt
          );
        }
      }
    });
  });

  describe('Mark Notification as Read', () => {
    it('should mark a notification as read', async () => {
      // Create a new notification
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'ownership_transfer',
        'Test notification for marking as read'
      );

      expect(notification.isRead).toBe(false);

      // Mark as read
      await db.notification.markAsRead(notification.id);

      // Retrieve and verify
      const notifications = await db.notification.getUserNotifications(testUserId);
      const updatedNotification = notifications.find(n => n.id === notification.id);

      expect(updatedNotification).toBeDefined();
      expect(updatedNotification?.isRead).toBe(true);
    });
  });

  describe('Unread Notification Count', () => {
    it('should return correct unread notification count', async () => {
      // Get initial count
      const initialCount = await db.notification.getUnreadCount(testUserId);

      // Create a new unread notification
      await db.notification.create(
        testUserId,
        testHouseholdId,
        'membership_approved',
        'New unread notification'
      );

      // Get updated count
      const updatedCount = await db.notification.getUnreadCount(testUserId);

      expect(updatedCount).toBe(initialCount + 1);
    });

    it('should decrease unread count when notification is marked as read', async () => {
      // Create a new notification
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'ownership_transfer',
        'Notification to be marked as read'
      );

      const countBefore = await db.notification.getUnreadCount(testUserId);

      // Mark as read
      await db.notification.markAsRead(notification.id);

      const countAfter = await db.notification.getUnreadCount(testUserId);

      expect(countAfter).toBe(countBefore - 1);
    });
  });

  describe('Notification Display Requirements', () => {
    it('should include all required notification fields', async () => {
      const notification = await db.notification.create(
        testUserId,
        testHouseholdId,
        'ownership_transfer',
        'Complete notification test'
      );

      // Verify all required fields are present
      expect(notification.id).toBeDefined();
      expect(notification.userId).toBeDefined();
      expect(notification.householdId).toBeDefined();
      expect(notification.type).toBeDefined();
      expect(notification.message).toBeDefined();
      expect(typeof notification.isRead).toBe('boolean');
      expect(notification.createdAt).toBeDefined();
      expect(typeof notification.createdAt).toBe('number');
    });

    it('should support notifications without household association', async () => {
      const notification = await db.notification.create(
        testUserId,
        undefined,
        'membership_approved',
        'System-wide notification'
      );

      expect(notification).toBeDefined();
      expect(notification.householdId).toBeUndefined();
    });
  });
});
