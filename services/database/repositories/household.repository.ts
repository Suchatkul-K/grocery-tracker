import type { Household } from '@/types';
import { BaseRepository } from './base.repository';
import { generateId, generateReferenceCode } from '@/services/utils/id-generator';

/**
 * Household repository for CRUD operations
 */
class HouseholdRepository extends BaseRepository {
  /**
   * Create a new household
   */
  async createHousehold(name: string, ownerId: string): Promise<Household> {
    const id = generateId();
    const referenceCode = generateReferenceCode();
    const createdAt = Date.now();

    this.execute(
      'INSERT INTO households (id, name, reference_code, owner_id, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, name, referenceCode, ownerId, createdAt]
    );

    await this.save();

    return {
      id,
      name,
      referenceCode,
      ownerId,
      createdAt,
    };
  }

  /**
   * Retrieve a household by ID
   */
  async getHousehold(id: string): Promise<Household | null> {
    const result = this.queryOne<{
      id: string;
      name: string;
      reference_code: string;
      owner_id: string;
      created_at: number;
    }>('SELECT id, name, reference_code, owner_id, created_at FROM households WHERE id = ?', [id]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      referenceCode: result.reference_code,
      ownerId: result.owner_id,
      createdAt: result.created_at,
    };
  }

  /**
   * Retrieve a household by reference code
   */
  async getHouseholdByReferenceCode(referenceCode: string): Promise<Household | null> {
    const result = this.queryOne<{
      id: string;
      name: string;
      reference_code: string;
      owner_id: string;
      created_at: number;
    }>('SELECT id, name, reference_code, owner_id, created_at FROM households WHERE reference_code = ?', [referenceCode]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      referenceCode: result.reference_code,
      ownerId: result.owner_id,
      createdAt: result.created_at,
    };
  }

  /**
   * Update household owner
   */
  async updateHouseholdOwner(householdId: string, newOwnerId: string): Promise<void> {
    this.execute(
      'UPDATE households SET owner_id = ? WHERE id = ?',
      [newOwnerId, householdId]
    );
    await this.save();
  }

  /**
   * Update household name
   */
  async updateHouseholdName(householdId: string, name: string): Promise<void> {
    this.execute(
      'UPDATE households SET name = ? WHERE id = ?',
      [name, householdId]
    );
    await this.save();
  }

  /**
   * Delete a household
   */
  async deleteHousehold(householdId: string): Promise<void> {
    this.execute('DELETE FROM households WHERE id = ?', [householdId]);
    await this.save();
  }

  /**
   * Get all households
   */
  async getAllHouseholds(): Promise<Household[]> {
    const results = this.query<{
      id: string;
      name: string;
      reference_code: string;
      owner_id: string;
      created_at: number;
    }>('SELECT id, name, reference_code, owner_id, created_at FROM households ORDER BY created_at DESC');

    return results.map(result => ({
      id: result.id,
      name: result.name,
      referenceCode: result.reference_code,
      ownerId: result.owner_id,
      createdAt: result.created_at,
    }));
  }
}

// Export singleton instance
export const householdRepository = new HouseholdRepository();
