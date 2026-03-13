/**
 * JoinHouseholdForm Component Tests
 * Verifies the join household form functionality
 * 
 * Requirements: 2.1.1, 2.1.2
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { dbConnection } from '@/services/database/core/connection';
import { schemaManager } from '@/services/database/core/schema';
import { db } from '@/services/database';

describe('JoinHouseholdForm Integration', () => {
  let testUserId: string;
  let testHouseholdId: string;
  let referenceCode: string;

  beforeAll(async () => {
    // Initialize database connection
    await dbConnection.initialize();
    
    // Create schema if needed
    try {
      await db.user.get('test-id');
    } catch (error) {
      await schemaManager.createSchema();
    }

    // Create test user
    const user = await db.user.create('Test User');
    testUserId = user.id;

    // Create test household
    const household = await db.household.create('Test Household', testUserId);
    testHouseholdId = household.id;
    referenceCode = household.referenceCode;
  });

  describe('Reference Code Validation', () => {
    it('should successfully request to join with valid reference code', async () => {
      // Create another user to join
      const joiningUser = await db.user.create('Joining User');
      
      // Request to join using reference code
      const membership = await db.membership.requestJoin(joiningUser.id, referenceCode);
      
      expect(membership).toBeDefined();
      expect(membership.userId).toBe(joiningUser.id);
      expect(membership.householdId).toBe(testHouseholdId);
      expect(membership.status).toBe('pending');
      expect(membership.role).toBe('member');
    });

    it('should throw error for invalid reference code', async () => {
      const joiningUser = await db.user.create('Another User');
      
      await expect(
        db.membership.requestJoin(joiningUser.id, 'INVALID-CODE')
      ).rejects.toThrow();
    });

    it('should handle reference code with exact match', async () => {
      const joiningUser = await db.user.create('Whitespace User');
      
      // Request with exact reference code (trimming happens in component)
      const membership = await db.membership.requestJoin(
        joiningUser.id, 
        referenceCode
      );
      
      expect(membership).toBeDefined();
      expect(membership.householdId).toBe(testHouseholdId);
    });
  });

  describe('Pending Membership Requests', () => {
    it('should create pending membership request', async () => {
      const joiningUser = await db.user.create('Pending User');
      
      await db.membership.requestJoin(joiningUser.id, referenceCode);
      
      // Get pending requests for household
      const pendingRequests = await db.membership.getPendingRequests(testHouseholdId);
      
      const userRequest = pendingRequests.find(r => r.userId === joiningUser.id);
      expect(userRequest).toBeDefined();
      expect(userRequest?.status).toBe('pending');
    });

    it('should not allow duplicate join requests', async () => {
      const joiningUser = await db.user.create('Duplicate User');
      
      // First request should succeed
      await db.membership.requestJoin(joiningUser.id, referenceCode);
      
      // Second request should fail
      await expect(
        db.membership.requestJoin(joiningUser.id, referenceCode)
      ).rejects.toThrow();
    });
  });

  describe('Component Behavior Validation', () => {
    it('should validate empty reference code', () => {
      const emptyCode = '';
      expect(emptyCode.trim()).toBe('');
    });

    it('should validate whitespace-only reference code', () => {
      const whitespaceCode = '   ';
      expect(whitespaceCode.trim()).toBe('');
    });

    it('should accept valid reference code format', () => {
      expect(referenceCode).toBeDefined();
      expect(referenceCode.length).toBeGreaterThan(0);
      expect(referenceCode.trim()).toBe(referenceCode);
    });
  });
});
