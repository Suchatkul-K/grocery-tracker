import initSqlJs, { Database } from 'sql.js';

const DB_NAME = 'grocery-tracker-db';
const DB_STORE_NAME = 'sqliteDb';
const DB_KEY = 'database';

/**
 * Database connection manager
 * Handles initialization, browser compatibility, and IndexedDB persistence
 */
class DatabaseConnection {
  private db: Database | null = null;
  private SQL: any = null;

  /**
   * Get the database instance
   */
  getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    return this.db !== null;
  }

  /**
   * Check browser compatibility for required features
   */
  checkBrowserCompatibility(): { compatible: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check IndexedDB support
    if (!window.indexedDB) {
      errors.push('IndexedDB is not supported in this browser');
    }

    // Check WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      errors.push('WebAssembly is not supported in this browser');
    }

    return {
      compatible: errors.length === 0,
      errors,
    };
  }

  /**
   * Initialize the database connection
   * - Loads sql.js WebAssembly module
   * - Attempts to load existing database from IndexedDB
   * - Creates new database if none exists
   */
  async initialize(): Promise<void> {
    // Check browser compatibility
    const compatibility = this.checkBrowserCompatibility();
    if (!compatibility.compatible) {
      throw new Error(
        `Browser compatibility check failed: ${compatibility.errors.join(', ')}`
      );
    }

    // Initialize sql.js
    // In test environment, use local file; in browser, use local public files
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    this.SQL = await initSqlJs({
      locateFile: (file) => {
        if (isTest) {
          // In test environment, load from node_modules
          return `node_modules/sql.js/dist/${file}`;
        }
        // In browser, load from public directory
        return `/sql-wasm/${file}`;
      },
    });

    // Try to load existing database from IndexedDB
    try {
      await this.loadFromIndexedDB();
    } catch (error) {
      console.log('No existing database found, creating new one');
      // Create new database if loading fails
      this.db = new this.SQL.Database();
    }

    // Ensure database is initialized
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
  }

  /**
   * Save the current database state to IndexedDB
   */
  async saveToIndexedDB(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([DB_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(DB_STORE_NAME);

        // Export database as Uint8Array
        const data = this.db!.export();
        const putRequest = store.put(data, DB_KEY);

        putRequest.onsuccess = () => {
          db.close();
          resolve();
        };

        putRequest.onerror = () => {
          db.close();
          reject(new Error('Failed to save database to IndexedDB'));
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          db.createObjectStore(DB_STORE_NAME);
        }
      };
    });
  }

  /**
   * Load database from IndexedDB
   */
  private async loadFromIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([DB_STORE_NAME], 'readonly');
        const store = transaction.objectStore(DB_STORE_NAME);
        const getRequest = store.get(DB_KEY);

        getRequest.onsuccess = () => {
          const data = getRequest.result;
          if (data) {
            // Load database from stored data
            this.db = new this.SQL.Database(data);
            db.close();
            resolve();
          } else {
            db.close();
            reject(new Error('No database found in IndexedDB'));
          }
        };

        getRequest.onerror = () => {
          db.close();
          reject(new Error('Failed to load database from IndexedDB'));
        };
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
          db.createObjectStore(DB_STORE_NAME);
        }
      };
    });
  }
}

// Export singleton instance
export const dbConnection = new DatabaseConnection();
