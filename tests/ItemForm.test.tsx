import { describe, it, expect } from 'vitest';
import { ItemForm } from '@/components/ItemForm';

describe('ItemForm Component', () => {
  it('should be importable', () => {
    expect(ItemForm).toBeDefined();
    expect(typeof ItemForm).toBe('function');
  });

  it('should have correct component name', () => {
    expect(ItemForm.name).toBe('ItemForm');
  });
});
