import { describe, it, expect, beforeEach } from 'vitest';
import { databaseService } from './databaseService';

describe('DatabaseService - Membership Operations', () => {
  beforeEach(async () => {
    // Initialize a fresh database for each test
    await databaseService.initialize();
  });

  describe('getUserHouseholds', () => {
    it('should return empty array for user with no households', async () => {
      const user = await databaseService.createUser('Test User');
      const households = await databaseService.getUserHouseholds(user.id);
      
      expect(households).toEqual([]);
    });

    it('should return household with owner role for household creator', async () => {
      const user = await databaseService.createUser('Owner User');
      const household = await databaseService.createHousehold('Test Household', user.id);
      
      const households = await databaseService.getUserHouseholds(user.id);
      
      expect(households).toHaveLength(1);
      expect(households[0].household.id).toBe(household.id);
      expect(households[0].household.name).toBe('Test Household');
      expect(households[0].role).toBe('owner');
    });

    it('should return multiple households for user in multiple households', async () => {
      const user = await databaseService.createUser('Multi User');
      const household1 = await databaseService.createHousehold('Household 1', user.id);
      const household2 = await databaseService.createHousehold('Household 2', user.id);
      
      const households = await databaseService.getUserHouseholds(user.id);
      
      expect(households).toHaveLength(2);
      const householdIds = households.map(h => h.household.id);
      expect(householdIds).toContain(household1.id);
      expect(householdIds).toContain(household2.id);
    });

    it('should only return active memberships, not pending', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      // Create pending membership request
      await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      // Member should not see household yet (pending)
      const memberHouseholds = await databaseService.getUserHouseholds(member.id);
      expect(memberHouseholds).toHaveLength(0);
      
      // Owner should see household
      const ownerHouseholds = await databaseService.getUserHouseholds(owner.id);
      expect(ownerHouseholds).toHaveLength(1);
    });
  });

  describe('getHouseholdMembers', () => {
    it('should return owner as member of household', async () => {
      const user = await databaseService.createUser('Owner User');
      const household = await databaseService.createHousehold('Test Household', user.id);
      
      const members = await databaseService.getHouseholdMembers(household.id);
      
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(user.id);
      expect(members[0].name).toBe('Owner User');
    });

    it('should return all active members of household', async () => {
      const owner = await databaseService.createUser('Owner');
      const member1 = await databaseService.createUser('Member 1');
      const member2 = await databaseService.createUser('Member 2');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      // Add members directly
      await databaseService.addMemberDirectly(household.id, member1.id);
      await databaseService.addMemberDirectly(household.id, member2.id);
      
      const members = await databaseService.getHouseholdMembers(household.id);
      
      expect(members).toHaveLength(3);
      const memberIds = members.map(m => m.id);
      expect(memberIds).toContain(owner.id);
      expect(memberIds).toContain(member1.id);
      expect(memberIds).toContain(member2.id);
    });

    it('should not return pending members', async () => {
      const owner = await databaseService.createUser('Owner');
      const pendingMember = await databaseService.createUser('Pending Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      // Create pending membership request
      await databaseService.requestJoinHousehold(pendingMember.id, household.referenceCode);
      
      const members = await databaseService.getHouseholdMembers(household.id);
      
      expect(members).toHaveLength(1);
      expect(members[0].id).toBe(owner.id);
    });
  });

  describe('getUserRole', () => {
    it('should return owner role for household creator', async () => {
      const user = await databaseService.createUser('Owner User');
      const household = await databaseService.createHousehold('Test Household', user.id);
      
      const role = await databaseService.getUserRole(user.id, household.id);
      
      expect(role).toBe('owner');
    });

    it('should return member role for added member', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.addMemberDirectly(household.id, member.id);
      
      const role = await databaseService.getUserRole(member.id, household.id);
      
      expect(role).toBe('member');
    });

    it('should return null for user not in household', async () => {
      const owner = await databaseService.createUser('Owner');
      const nonMember = await databaseService.createUser('Non Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const role = await databaseService.getUserRole(nonMember.id, household.id);
      
      expect(role).toBeNull();
    });

    it('should return null for pending membership', async () => {
      const owner = await databaseService.createUser('Owner');
      const pendingMember = await databaseService.createUser('Pending Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.requestJoinHousehold(pendingMember.id, household.referenceCode);
      
      const role = await databaseService.getUserRole(pendingMember.id, household.id);
      
      expect(role).toBeNull();
    });
  });

  describe('requestJoinHousehold', () => {
    it('should create pending membership request with valid reference code', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      expect(membership.userId).toBe(member.id);
      expect(membership.householdId).toBe(household.id);
      expect(membership.role).toBe('member');
      expect(membership.status).toBe('pending');
      expect(membership.createdAt).toBeGreaterThan(0);
    });

    it('should throw error for invalid reference code', async () => {
      const user = await databaseService.createUser('User');
      
      await expect(
        databaseService.requestJoinHousehold(user.id, 'INVALID')
      ).rejects.toThrow('Household not found');
    });

    it('should throw error if user is already active member', async () => {
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await expect(
        databaseService.requestJoinHousehold(owner.id, household.referenceCode)
      ).rejects.toThrow('already a member');
    });

    it('should throw error if user already has pending request', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      await expect(
        databaseService.requestJoinHousehold(member.id, household.referenceCode)
      ).rejects.toThrow('pending request');
    });
  });

  describe('getPendingMembershipRequests', () => {
    it('should return empty array for household with no pending requests', async () => {
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const requests = await databaseService.getPendingMembershipRequests(household.id);
      
      expect(requests).toEqual([]);
    });

    it('should return pending membership requests', async () => {
      const owner = await databaseService.createUser('Owner');
      const member1 = await databaseService.createUser('Member 1');
      const member2 = await databaseService.createUser('Member 2');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.requestJoinHousehold(member1.id, household.referenceCode);
      await databaseService.requestJoinHousehold(member2.id, household.referenceCode);
      
      const requests = await databaseService.getPendingMembershipRequests(household.id);
      
      expect(requests).toHaveLength(2);
      expect(requests[0].status).toBe('pending');
      expect(requests[1].status).toBe('pending');
    });

    it('should not return active memberships', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.addMemberDirectly(household.id, member.id);
      
      const requests = await databaseService.getPendingMembershipRequests(household.id);
      
      expect(requests).toEqual([]);
    });
  });

  describe('acceptMembershipRequest', () => {
    it('should change membership status from pending to active', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      await databaseService.acceptMembershipRequest(membership.id);
      
      // Verify member now has access
      const households = await databaseService.getUserHouseholds(member.id);
      expect(households).toHaveLength(1);
      expect(households[0].household.id).toBe(household.id);
      expect(households[0].role).toBe('member');
      
      // Verify no more pending requests
      const requests = await databaseService.getPendingMembershipRequests(household.id);
      expect(requests).toEqual([]);
    });

    it('should throw error for non-existent membership', async () => {
      await expect(
        databaseService.acceptMembershipRequest('non-existent-id')
      ).rejects.toThrow('not found');
    });

    it('should throw error for already active membership', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      await databaseService.acceptMembershipRequest(membership.id);
      
      await expect(
        databaseService.acceptMembershipRequest(membership.id)
      ).rejects.toThrow('not pending');
    });
  });

  describe('rejectMembershipRequest', () => {
    it('should delete pending membership request', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      await databaseService.rejectMembershipRequest(membership.id);
      
      // Verify no pending requests
      const requests = await databaseService.getPendingMembershipRequests(household.id);
      expect(requests).toEqual([]);
      
      // Verify member still has no access
      const households = await databaseService.getUserHouseholds(member.id);
      expect(households).toEqual([]);
    });

    it('should throw error for non-existent membership', async () => {
      await expect(
        databaseService.rejectMembershipRequest('non-existent-id')
      ).rejects.toThrow('not found');
    });

    it('should throw error for already active membership', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      await databaseService.acceptMembershipRequest(membership.id);
      
      await expect(
        databaseService.rejectMembershipRequest(membership.id)
      ).rejects.toThrow('not pending');
    });
  });

  describe('addMemberDirectly', () => {
    it('should add member with active status directly', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      const membership = await databaseService.addMemberDirectly(household.id, member.id);
      
      expect(membership.userId).toBe(member.id);
      expect(membership.householdId).toBe(household.id);
      expect(membership.role).toBe('member');
      expect(membership.status).toBe('active');
      
      // Verify member has immediate access
      const households = await databaseService.getUserHouseholds(member.id);
      expect(households).toHaveLength(1);
      expect(households[0].household.id).toBe(household.id);
    });

    it('should throw error for non-existent household', async () => {
      const user = await databaseService.createUser('User');
      
      await expect(
        databaseService.addMemberDirectly('non-existent-household', user.id)
      ).rejects.toThrow('Household not found');
    });

    it('should throw error for non-existent user', async () => {
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await expect(
        databaseService.addMemberDirectly(household.id, 'non-existent-user')
      ).rejects.toThrow('User not found');
    });

    it('should throw error if user is already active member', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.addMemberDirectly(household.id, member.id);
      
      await expect(
        databaseService.addMemberDirectly(household.id, member.id)
      ).rejects.toThrow('already a member');
    });

    it('should throw error if user has pending request', async () => {
      const owner = await databaseService.createUser('Owner');
      const member = await databaseService.createUser('Member');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      await databaseService.requestJoinHousehold(member.id, household.referenceCode);
      
      await expect(
        databaseService.addMemberDirectly(household.id, member.id)
      ).rejects.toThrow('pending request');
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete membership workflow', async () => {
      // Create owner and household
      const owner = await databaseService.createUser('Owner');
      const household = await databaseService.createHousehold('Test Household', owner.id);
      
      // Create two potential members
      const member1 = await databaseService.createUser('Member 1');
      const member2 = await databaseService.createUser('Member 2');
      
      // Member 1 requests to join
      const request1 = await databaseService.requestJoinHousehold(member1.id, household.referenceCode);
      
      // Member 2 is added directly by owner
      await databaseService.addMemberDirectly(household.id, member2.id);
      
      // Verify pending requests
      let pendingRequests = await databaseService.getPendingMembershipRequests(household.id);
      expect(pendingRequests).toHaveLength(1);
      expect(pendingRequests[0].userId).toBe(member1.id);
      
      // Verify current members (owner + member2)
      let members = await databaseService.getHouseholdMembers(household.id);
      expect(members).toHaveLength(2);
      
      // Owner accepts member1's request
      await databaseService.acceptMembershipRequest(request1.id);
      
      // Verify no pending requests
      pendingRequests = await databaseService.getPendingMembershipRequests(household.id);
      expect(pendingRequests).toEqual([]);
      
      // Verify all members (owner + member1 + member2)
      members = await databaseService.getHouseholdMembers(household.id);
      expect(members).toHaveLength(3);
      
      // Verify roles
      expect(await databaseService.getUserRole(owner.id, household.id)).toBe('owner');
      expect(await databaseService.getUserRole(member1.id, household.id)).toBe('member');
      expect(await databaseService.getUserRole(member2.id, household.id)).toBe('member');
    });

    it('should handle user in multiple households', async () => {
      const user = await databaseService.createUser('Multi-Household User');
      const owner1 = await databaseService.createUser('Owner 1');
      const owner2 = await databaseService.createUser('Owner 2');
      
      const household1 = await databaseService.createHousehold('Household 1', owner1.id);
      const household2 = await databaseService.createHousehold('Household 2', owner2.id);
      const household3 = await databaseService.createHousehold('Household 3', user.id);
      
      // Add user to household1 and household2
      await databaseService.addMemberDirectly(household1.id, user.id);
      await databaseService.addMemberDirectly(household2.id, user.id);
      
      // Verify user has access to all three households
      const households = await databaseService.getUserHouseholds(user.id);
      expect(households).toHaveLength(3);
      
      // Verify roles
      const roles = households.reduce((acc, h) => {
        acc[h.household.id] = h.role;
        return acc;
      }, {} as Record<string, string>);
      
      expect(roles[household1.id]).toBe('member');
      expect(roles[household2.id]).toBe('member');
      expect(roles[household3.id]).toBe('owner');
    });
  });
});
