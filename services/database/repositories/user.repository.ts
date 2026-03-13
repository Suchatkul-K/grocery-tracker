import type { User } from '@/types';
import { BaseRepository } from './base.repository';
import { generateId } from '@/services/utils/id-generator';

/**
 * User repository for CRUD operations
 */
class UserRepository extends BaseRepository {
  /**
   * Create a new user account
   * @param name - User's display name
   * @param id - Optional user ID (if not provided, generates a random ID)
   */
  async createUser(name: string, id?: string): Promise<User> {
    const userId = id ?? generateId();
    const createdAt = Date.now();

    this.execute(
      'INSERT INTO users (id, name, created_at) VALUES (?, ?, ?)',
      [userId, name, createdAt]
    );

    await this.save();

    return {
      id: userId,
      name,
      createdAt,
    };
  }

  /**
   * Retrieve a user by ID
   */
  async getUser(id: string): Promise<User | null> {
    const result = this.queryOne<{
      id: string;
      name: string;
      created_at: number;
    }>('SELECT id, name, created_at FROM users WHERE id = ?', [id]);

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      name: result.name,
      createdAt: result.created_at,
    };
  }

  /**
   * Update user name
   */
  async updateUser(id: string, name: string): Promise<void> {
    this.execute('UPDATE users SET name = ? WHERE id = ?', [name, id]);
    await this.save();
  }

  /**
   * Delete a user
   */
  async deleteUser(id: string): Promise<void> {
    this.execute('DELETE FROM users WHERE id = ?', [id]);
    await this.save();
  }

  /**
   * Get all users
   */
  async getAllUsers(): Promise<User[]> {
    const results = this.query<{
      id: string;
      name: string;
      created_at: number;
    }>('SELECT id, name, created_at FROM users ORDER BY created_at DESC');

    return results.map(result => ({
      id: result.id,
      name: result.name,
      createdAt: result.created_at,
    }));
  }
}

// Export singleton instance
export const userRepository = new UserRepository();
