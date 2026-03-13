import { dbConnection } from './connection';

/**
 * Database schema manager
 * Handles table creation, indexes, and migrations
 */
class SchemaManager {
  /**
   * Create all database tables and indexes
   */
  async createSchema(): Promise<void> {
    const db = dbConnection.getDatabase();

    // Create tables
    db.run(`
      CREATE TABLE IF NOT EXISTS households (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        reference_code TEXT NOT NULL UNIQUE,
        owner_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS household_memberships (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        household_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('owner', 'member')),
        status TEXT NOT NULL CHECK(status IN ('active', 'pending')) DEFAULT 'active',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (household_id) REFERENCES households(id),
        UNIQUE(user_id, household_id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        household_id TEXT,
        type TEXT NOT NULL CHECK(type IN ('ownership_transfer', 'household_deletion', 'membership_approved')),
        message TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (household_id) REFERENCES households(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL,
        household_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (household_id) REFERENCES households(id),
        UNIQUE(name, household_id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS grocery_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL,
        household_id TEXT NOT NULL,
        restock_threshold REAL NOT NULL DEFAULT 1.0,
        unit TEXT NOT NULL DEFAULT 'pieces',
        notes TEXT,
        expiration_date INTEGER,
        stock_level REAL NOT NULL DEFAULT 0.0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (household_id) REFERENCES households(id)
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id TEXT PRIMARY KEY,
        grocery_item_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        transaction_type TEXT NOT NULL CHECK(transaction_type IN ('add', 'use')),
        quantity REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (grocery_item_id) REFERENCES grocery_items(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    // Create indexes for performance
    this.createIndexes(db);

    // Save the newly created schema to IndexedDB
    await dbConnection.saveToIndexedDB();
  }

  /**
   * Drop all tables (reset database)
   */
  async dropAllTables(): Promise<void> {
    const db = dbConnection.getDatabase();

    // Drop tables in reverse order of dependencies
    db.run('DROP TABLE IF EXISTS stock_transactions;');
    db.run('DROP TABLE IF EXISTS grocery_items;');
    db.run('DROP TABLE IF EXISTS categories;');
    db.run('DROP TABLE IF EXISTS notifications;');
    db.run('DROP TABLE IF EXISTS household_memberships;');
    db.run('DROP TABLE IF EXISTS households;');
    db.run('DROP TABLE IF EXISTS users;');

    // Save the empty database to IndexedDB
    await dbConnection.saveToIndexedDB();
  }

  /**
   * Reset database (drop all tables and recreate schema)
   */
  async resetDatabase(): Promise<void> {
    await this.dropAllTables();
    await this.createSchema();
  }

  /**
   * Create database indexes for performance optimization
   */
  private createIndexes(db: any): void {
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_household_memberships_user 
      ON household_memberships(user_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_household_memberships_household 
      ON household_memberships(household_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_household_memberships_status 
      ON household_memberships(status);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user 
      ON notifications(user_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_notifications_read 
      ON notifications(is_read);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_grocery_items_household 
      ON grocery_items(household_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_grocery_items_category 
      ON grocery_items(category_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_stock_transactions_item 
      ON stock_transactions(grocery_item_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_stock_transactions_user 
      ON stock_transactions(user_id);
    `);

    db.run(`
      CREATE INDEX IF NOT EXISTS idx_stock_transactions_timestamp 
      ON stock_transactions(timestamp);
    `);
  }
}

// Export singleton instance
export const schemaManager = new SchemaManager();
