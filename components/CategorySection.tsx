'use client';

import React from 'react';
import { GroceryItem, Category, NotificationStatus } from '@/types';
import { GroceryItemCard } from './GroceryItemCard';

/**
 * CategorySection Component
 * 
 * Displays all grocery items belonging to a specific category.
 * Uses the category's assigned color for visual distinction,
 * shows the category name prominently, and displays the count
 * of items in that category.
 * 
 * Requirements: 3.4, 3.5, 11.4
 */
interface CategorySectionProps {
  category: Category;
  items: Array<GroceryItem & { status: NotificationStatus }>;
  onViewHistory?: (itemId: string, itemName: string) => void;
}

export function CategorySection({ category, items, onViewHistory }: CategorySectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Category Header */}
      <div
        className="px-6 py-4 border-b border-gray-200"
        style={{ backgroundColor: `${category.color}15` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.color }}
          />
          <h3 className="text-lg font-semibold text-gray-800">
            {category.name}
          </h3>
          <span className="text-sm text-gray-500">
            ({items.length})
          </span>
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <GroceryItemCard 
              key={item.id} 
              item={item} 
              onViewHistory={onViewHistory ? () => onViewHistory(item.id, item.name) : undefined} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}
