import { queryExecutor } from '../core/query-executor';
import { dbConnection } from '../core/connection';

/**
 * Base repository with common database operations
 * All repositories should extend this class
 */
export abstract class BaseRepository {
  /**
   * Execute a query and return all results
   */
  protected query<T>(sql: string, params: any[] = []): T[] {
    return queryExecutor.query<T>(sql, params);
  }

  /**
   * Execute a query and return a single result
   */
  protected queryOne<T>(sql: string, params: any[] = []): T | null {
    return queryExecutor.queryOne<T>(sql, params);
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  protected execute(sql: string, params: any[] = []): void {
    queryExecutor.execute(sql, params);
  }

  /**
   * Save changes to IndexedDB
   */
  protected async save(): Promise<void> {
    await dbConnection.saveToIndexedDB();
  }
}
