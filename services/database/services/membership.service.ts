import type { HouseholdMembership, HouseholdWithRole, User, PendingRequestWithHousehold } from '@/types';
import { membershipRepository } from '../repositories/membership.repository';
import { householdRepository } from '../repositories/household.repository';
import { userRepository } from '../repositories/user.repository';
import { notificationService } from './notification.service';

/**
 * Membership service with business logic
 * Handles membership requests, approvals, and member management
 */
class MembershipService {
  /**
   * Request to join a household by reference code
   * Business logic: Validates reference code, checks for existing membership
   */
  async requestJoinHousehold(userId: string, referenceCode: string): Promise<HouseholdMembership> {
    // Find household by reference code
    const household = await householdRepository.getHouseholdByReferenceCode(referenceCode);
    if (!household) {
      throw new Error('Household not found with the provided reference code');
    }

    // Check if user is already a member or has a pending request
    const existingMembership = await membershipRepository.getExistingMembership(userId, household.id);

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new Error('User is already a member of this household');
      } else {
        throw new Error('User already has a pending request for this household');
      }
    }

    // Create pending membership request
    return membershipRepository.createMembership(userId, household.id, 'member', 'pending');
  }

  /**
   * Get pending membership requests for a household
   */
  async getPendingMembershipRequests(householdId: string): Promise<HouseholdMembership[]> {
    return membershipRepository.getPendingRequests(householdId);
  }

  /**
   * Accept a membership request
   * Business logic: Validates request is pending, changes status to active, notifies user
   */
  async acceptMembershipRequest(membershipId: string): Promise<void> {
    // Verify the membership exists and is pending
    const membership = await membershipRepository.getMembership(membershipId);

    if (!membership) {
      throw new Error('Membership request not found');
    }

    if (membership.status !== 'pending') {
      throw new Error('Membership request is not pending');
    }

    // Get household details for notification message
    const household = await householdRepository.getHousehold(membership.householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    // Update status to active
    await membershipRepository.updateMembershipStatus(membershipId, 'active');

    // Notify the user that their request was approved
    await notificationService.createNotification(
      membership.userId,
      membership.householdId,
      'membership_approved',
      `Your request to join household "${household.name}" has been approved.`
    );
  }

  /**
   * Reject a membership request
   * Business logic: Validates request is pending, deletes the record
   */
  async rejectMembershipRequest(membershipId: string): Promise<void> {
    // Verify the membership exists and is pending
    const membership = await membershipRepository.getMembership(membershipId);

    if (!membership) {
      throw new Error('Membership request not found');
    }

    if (membership.status !== 'pending') {
      throw new Error('Membership request is not pending');
    }

    // Delete the membership record
    await membershipRepository.deleteMembership(membershipId);
  }

  /**
   * Add a member directly to a household (owner action)
   * Business logic: Validates household and user exist, checks for existing membership
   */
  async addMemberDirectly(householdId: string, userId: string): Promise<HouseholdMembership> {
    // Verify household exists
    const household = await householdRepository.getHousehold(householdId);
    if (!household) {
      throw new Error('Household not found');
    }

    // Verify user exists
    const user = await userRepository.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user is already a member or has a pending request
    const existingMembership = await membershipRepository.getExistingMembership(userId, householdId);

    if (existingMembership) {
      if (existingMembership.status === 'active') {
        throw new Error('User is already a member of this household');
      } else {
        throw new Error('User already has a pending request for this household');
      }
    }

    // Create active membership directly
    return membershipRepository.createMembership(userId, householdId, 'member', 'active');
  }

  /**
   * Get all households for a user with their role
   */
  async getUserHouseholds(userId: string): Promise<HouseholdWithRole[]> {
    return membershipRepository.getUserHouseholds(userId);
  }

  /**
   * Get all members of a household
   */
  async getHouseholdMembers(householdId: string): Promise<User[]> {
    return membershipRepository.getHouseholdMembers(householdId);
  }

  /**
   * Get user's role in a specific household
   */
  async getUserRole(userId: string, householdId: string): Promise<'owner' | 'member' | null> {
    return membershipRepository.getUserRole(userId, householdId);
  }

  /**
   * Get user's pending membership requests (requests they sent to join households)
   */
  async getUserPendingRequests(userId: string): Promise<HouseholdMembership[]> {
    return membershipRepository.getUserPendingRequests(userId);
  }

  /**
   * Get user's pending membership requests with household details
   */
  async getUserPendingRequestsWithHousehold(userId: string): Promise<PendingRequestWithHousehold[]> {
    return membershipRepository.getUserPendingRequestsWithHousehold(userId);
  }
}

// Export singleton instance
export const membershipService = new MembershipService();
