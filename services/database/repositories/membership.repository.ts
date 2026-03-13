import type { HouseholdMembership, HouseholdWithRole, User } from '@/types';
import { BaseRepository } from './base.repository';
import { generateId } from '@/services/utils/id-generator';

/**
 * Membership repository for household membership operations
 */
class MembershipRepository extends BaseRepository {
  /**
   * Create a new membership record
   */
  async createMembership(
    userId: string,
    householdId: string,
    role: 'owner' | 'member',
    status: 'active' | 'pending' = 'active'
  ): Promise<HouseholdMembership> {
    const id = generateId();
    const createdAt = Date.now();

    this.execute(
      'INSERT INTO household_memberships (id, user_id, household_id, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, householdId, role, status, createdAt]
    );

    await this.save();

    return {
      id,
      userId,
      householdId,
      role,
      status,
      createdAt,
    };
  }

  /**
   * Get membership by ID
   */
  async getMembership(membershipId: string): Promise<HouseholdMembership | null> {
    const result = this.queryOne<{
      id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      created_at: number;
    }>('SELECT id, user_id, household_id, role, status, created_at FROM household_memberships WHERE id = ?', [membershipId]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userId: result.user_id,
      householdId: result.household_id,
      role: result.role,
      status: result.status,
      createdAt: result.created_at,
    };
  }

  /**
   * Get existing membership for user and household
   */
  async getExistingMembership(userId: string, householdId: string): Promise<HouseholdMembership | null> {
    const result = this.queryOne<{
      id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      created_at: number;
    }>('SELECT id, user_id, household_id, role, status, created_at FROM household_memberships WHERE user_id = ? AND household_id = ?', [userId, householdId]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      userId: result.user_id,
      householdId: result.household_id,
      role: result.role,
      status: result.status,
      createdAt: result.created_at,
    };
  }

  /**
   * Get all households for a user with their role
   */
  async getUserHouseholds(userId: string): Promise<HouseholdWithRole[]> {
    const results = this.query<{
      household_id: string;
      household_name: string;
      reference_code: string;
      owner_id: string;
      household_created_at: number;
      role: 'owner' | 'member';
    }>(
      `SELECT 
        h.id as household_id,
        h.name as household_name,
        h.reference_code,
        h.owner_id,
        h.created_at as household_created_at,
        hm.role
      FROM household_memberships hm
      JOIN households h ON hm.household_id = h.id
      WHERE hm.user_id = ? AND hm.status = 'active'
      ORDER BY h.created_at DESC`,
      [userId]
    );

    return results.map(row => ({
      household: {
        id: row.household_id,
        name: row.household_name,
        referenceCode: row.reference_code,
        ownerId: row.owner_id,
        createdAt: row.household_created_at,
      },
      role: row.role,
    }));
  }

  /**
   * Get all memberships for a household (returns membership records, not just users)
   */
  async getHouseholdMemberships(householdId: string): Promise<HouseholdMembership[]> {
    const results = this.query<{
      id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      created_at: number;
    }>(
      'SELECT id, user_id, household_id, role, status, created_at FROM household_memberships WHERE household_id = ? ORDER BY created_at ASC',
      [householdId]
    );

    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      householdId: row.household_id,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get all members of a household
   */
  async getHouseholdMembers(householdId: string): Promise<User[]> {
    const results = this.query<{
      id: string;
      name: string;
      created_at: number;
    }>(
      `SELECT u.id, u.name, u.created_at
      FROM users u
      JOIN household_memberships hm ON u.id = hm.user_id
      WHERE hm.household_id = ? AND hm.status = 'active'
      ORDER BY hm.role DESC, u.name ASC`,
      [householdId]
    );

    return results.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get user's role in a specific household
   */
  async getUserRole(userId: string, householdId: string): Promise<'owner' | 'member' | null> {
    const result = this.queryOne<{ role: 'owner' | 'member' }>(
      'SELECT role FROM household_memberships WHERE user_id = ? AND household_id = ? AND status = ?',
      [userId, householdId, 'active']
    );

    return result ? result.role : null;
  }

  /**
   * Get pending membership requests for a household
   */
  async getPendingRequests(householdId: string): Promise<HouseholdMembership[]> {
    const results = this.query<{
      id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      created_at: number;
    }>(
      'SELECT id, user_id, household_id, role, status, created_at FROM household_memberships WHERE household_id = ? AND status = ? ORDER BY created_at ASC',
      [householdId, 'pending']
    );

    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      householdId: row.household_id,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get user's pending membership requests (requests they sent to join households)
   */
  async getUserPendingRequests(userId: string): Promise<HouseholdMembership[]> {
    const results = this.query<{
      id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      created_at: number;
    }>(
      'SELECT id, user_id, household_id, role, status, created_at FROM household_memberships WHERE user_id = ? AND status = ? ORDER BY created_at DESC',
      [userId, 'pending']
    );

    return results.map(row => ({
      id: row.id,
      userId: row.user_id,
      householdId: row.household_id,
      role: row.role,
      status: row.status,
      createdAt: row.created_at,
    }));
  }

  /**
   * Get user's pending membership requests with household details
   */
  async getUserPendingRequestsWithHousehold(userId: string) {
    const results = this.query<{
      membership_id: string;
      user_id: string;
      household_id: string;
      role: 'owner' | 'member';
      status: 'active' | 'pending';
      membership_created_at: number;
      household_name: string;
      reference_code: string;
      owner_id: string;
      household_created_at: number;
    }>(
      `SELECT 
        hm.id as membership_id,
        hm.user_id,
        hm.household_id,
        hm.role,
        hm.status,
        hm.created_at as membership_created_at,
        h.name as household_name,
        h.reference_code,
        h.owner_id,
        h.created_at as household_created_at
      FROM household_memberships hm
      JOIN households h ON hm.household_id = h.id
      WHERE hm.user_id = ? AND hm.status = ?
      ORDER BY hm.created_at DESC`,
      [userId, 'pending']
    );

    return results.map(row => ({
      membership: {
        id: row.membership_id,
        userId: row.user_id,
        householdId: row.household_id,
        role: row.role,
        status: row.status,
        createdAt: row.membership_created_at,
      },
      household: {
        id: row.household_id,
        name: row.household_name,
        referenceCode: row.reference_code,
        ownerId: row.owner_id,
        createdAt: row.household_created_at,
      },
    }));
  }

  /**
   * Update membership status
   */
  async updateMembershipStatus(membershipId: string, status: 'active' | 'pending'): Promise<void> {
    this.execute(
      'UPDATE household_memberships SET status = ? WHERE id = ?',
      [status, membershipId]
    );
    await this.save();
  }

  /**
   * Update membership role
   */
  async updateMembershipRole(membershipId: string, role: 'owner' | 'member'): Promise<void> {
    this.execute(
      'UPDATE household_memberships SET role = ? WHERE id = ?',
      [role, membershipId]
    );
    await this.save();
  }

  /**
   * Update user role in household
   */
  async updateUserRole(userId: string, householdId: string, role: 'owner' | 'member'): Promise<void> {
    await this.execute(
      'UPDATE household_memberships SET role = ? WHERE user_id = ? AND household_id = ?',
      [role, userId, householdId]
    );
    await this.save();
  }

  /**
   * Delete a membership
   */
  async deleteMembership(membershipId: string): Promise<void> {
    this.execute('DELETE FROM household_memberships WHERE id = ?', [membershipId]);
    await this.save();
  }

  /**
   * Delete all memberships for a household
   */
  async deleteHouseholdMemberships(householdId: string): Promise<void> {
    this.execute('DELETE FROM household_memberships WHERE household_id = ?', [householdId]);
    await this.save();
  }
}

// Export singleton instance
export const membershipRepository = new MembershipRepository();
