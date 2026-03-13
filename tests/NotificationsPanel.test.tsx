import { describe, it, expect } from 'vitest';
import { NotificationsPanel } from '@/components/NotificationsPanel';

describe('NotificationsPanel Component', () => {
  it('should be importable', () => {
    expect(NotificationsPanel).toBeDefined();
    expect(typeof NotificationsPanel).toBe('function');
  });

  it('should have correct component name', () => {
    expect(NotificationsPanel.name).toBe('NotificationsPanel');
  });
});
