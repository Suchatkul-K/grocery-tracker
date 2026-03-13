import { describe, it, expect, beforeEach, vi } from 'vitest';
import { databaseService } from '@/services/databaseService';

describe('DatabaseService', () => {
  describe('Browser Compatibility', () => {
    it('should check for IndexedDB support', () => {
      const result = databaseService.checkBrowserCompatibility();
      
      // In test environment, IndexedDB should be available
      expect(result.compatible).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing IndexedDB', () => {
      // Mock missing IndexedDB
      const originalIndexedDB = window.indexedDB;
      // @ts-ignore - intentionally setting to undefined for test
      delete window.indexedDB;

      const result = databaseService.checkBrowserCompatibility();
      
      expect(result.compatible).toBe(false);
      expect(result.errors).toContain('IndexedDB is not supported in this browser');

      // Restore
      window.indexedDB = originalIndexedDB;
    });

    it('should detect missing WebAssembly', () => {
      // Mock missing WebAssembly
      const originalWebAssembly = global.WebAssembly;
      // @ts-ignore - intentionally setting to undefined for test
      delete global.WebAssembly;

      const result = databaseService.checkBrowserCompatibility();
      
      expect(result.compatible).toBe(false);
      expect(result.errors).toContain('WebAssembly is not supported in this browser');

      // Restore
      global.WebAssembly = originalWebAssembly;
    });
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      await expect(databaseService.initialize()).resolves.not.toThrow();
    });

    it('should throw error if browser is incompatible', async () => {
      // Mock incompatible browser
      const originalIndexedDB = window.indexedDB;
      // @ts-ignore
      delete window.indexedDB;

      await expect(databaseService.initialize()).rejects.toThrow(
        'Browser compatibility check failed'
      );

      // Restore
      window.indexedDB = originalIndexedDB;
    });
  });
});
