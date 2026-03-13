import { describe, it, expect } from 'vitest';
import { GroceryItemCard } from '@/components/GroceryItemCard';

describe('GroceryItemCard Component', () => {
  it('should be importable', () => {
    expect(GroceryItemCard).toBeDefined();
    expect(typeof GroceryItemCard).toBe('function');
  });

  it('should have correct component name', () => {
    expect(GroceryItemCard.name).toBe('GroceryItemCard');
  });
});

