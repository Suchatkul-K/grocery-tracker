import { queryExecutor } from '../core/query-executor';
import { generateId } from '../../utils/id-generator';
import type { Notification } from '@/types';

/**
 * Notification Repository
 * Handles CRUD operations for notifications
 */

export const notificationRepository = {
  /**
   * Create a new notification
   */
  createNotification(
    userId: string,
    householdId: string | undefined,
    type: 'ownership_transfer' | 'household_deletion' | 'membership_approved',
    message: string
  ): Notification {
    const id = generateId();
    const createdAt = Date.now();

    queryExecutor.execute(
      `INSERT INTO notifications (id, user_id, household_id, type, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [id, userId, householdId || null, type, message, createdAt]
    );

    return {
      id,
      userId,
      householdId,
      type,
      message,
      isRead: false,
      createdAt,
    };
  },

  /**
   * Get all notifications for a user
   */
  getUserNotifications(userId: string): Notification[] {
    const rows = queryExecutor.query<{
      id: string;
      user_id: string;
      household_id: string | null;
      type: string;
      message: string;
      is_read: number;
      created_at: number;
    }>(
      `SELECT id, user_id, household_id, type, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      householdId: row.household_id || undefined,
      type: row.type as 'ownership_transfer' | 'household_deletion' | 'membership_approved',
      message: row.message,
      isRead: row.is_read === 1,
      createdAt: row.created_at,
    }));
  },

  /**
   * Mark a notification as read
   */
  markNotificationAsRead(notificationId: string): void {
    queryExecutor.execute(
      `UPDATE notifications SET is_read = 1 WHERE id = ?`,
      [notificationId]
    );
  },

  /**
   * Get unread notification count for a user
   */
  getUnreadNotificationCount(userId: string): number {
    const result = queryExecutor.queryOne<{ count: number }>(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
      [userId]
    );

    return result?.count || 0;
  },

  /**
   * Delete all notifications for a household
   * Used during household deletion cascade
   */
  deleteNotificationsByHousehold(householdId: string): void {
    queryExecutor.execute(
      `DELETE FROM notifications WHERE household_id = ?`,
      [householdId]
    );
  },
};
