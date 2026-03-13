import { dbConnection } from './connection';

/**
 * Query executor for database operations
 * Provides type-safe query execution methods
 */
class QueryExecutor {
  /**
   * Execute a query and return all results
   */
  query<T>(sql: string, params: any[] = []): T[] {
    const db = dbConnection.getDatabase();
    const results: T[] = [];
    const stmt = db.prepare(sql);
    stmt.bind(params);

    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row as T);
    }

    stmt.free();
    return results;
  }

  /**
   * Execute a query and return a single result
   */
  queryOne<T>(sql: string, params: any[] = []): T | null {
    const results = this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params: any[] = []): void {
    const db = dbConnection.getDatabase();
    db.run(sql, params);
  }
}

// Export singleton instance
export const queryExecutor = new QueryExecutor();
