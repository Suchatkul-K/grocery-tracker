'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { GroceryItem } from '@/types';

/**
 * NotificationsPanel Component
 * 
 * Displays items that need attention - either low on stock or expired/expiring soon.
 * Allows filtering by notification type (low stock, expiring, or both).
 * Uses distinct colors for different notification types.
 * 
 * Requirements: 8.3, 8.4, 8.5, 8.6, 8.7
 */

type FilterType = 'all' | 'lowStock' | 'expiring';

export function NotificationsPanel() {
  const { lowStockItems, expiringItems, categories, isLoading } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');

  // Combine and deduplicate items based on filter
  const filteredItems = useMemo(() => {
    const itemMap = new Map<string, GroceryItem & { reasons: string[] }>();

    if (filter === 'all' || filter === 'lowStock') {
      lowStockItems.forEach(item => {
        if (!itemMap.has(item.id)) {
          itemMap.set(item.id, { ...item, reasons: [] });
        }
        itemMap.get(item.id)!.reasons.push('lowStock');
      });
    }

    if (filter === 'all' || filter === 'expiring') {
      expiringItems.forEach(item => {
        if (!itemMap.has(item.id)) {
          itemMap.set(item.id, { ...item, reasons: [] });
        }
        const existing = itemMap.get(item.id)!;
        if (!existing.reasons.includes('expiring')) {
          existing.reasons.push('expiring');
        }
      });
    }

    return Array.from(itemMap.values());
  }, [lowStockItems, expiringItems, filter]);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Unknown';
  };

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.color || '#9E9E9E';
  };

  const getExpirationStatus = (item: GroceryItem) => {
    if (!item.expirationDate) return null;

    const now = Date.now();
    const timeUntilExpiration = item.expirationDate - now;
    const daysUntilExpiration = Math.ceil(timeUntilExpiration / (24 * 60 * 60 * 1000));

    if (timeUntilExpiration <= 0) {
      return { text: 'Expired', color: '#F44336', days: daysUntilExpiration };
    } else if (daysUntilExpiration <= 3) {
      return { 
        text: `Expires in ${daysUntilExpiration} day${daysUntilExpiration === 1 ? '' : 's'}`, 
        color: '#FFC107',
        days: daysUntilExpiration
      };
    }
    return null;
  };

  const formatExpirationDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Notifications</h2>
        <p className="text-sm text-gray-500 mt-1">
          Items needing attention
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="p-4 border-b border-gray-200 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({lowStockItems.length + expiringItems.length - 
            lowStockItems.filter(item => expiringItems.some(e => e.id === item.id)).length})
        </button>
        <button
          onClick={() => setFilter('lowStock')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'lowStock'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Low Stock ({lowStockItems.length})
        </button>
        <button
          onClick={() => setFilter('expiring')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'expiring'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Expiring ({expiringItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Loading notifications...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="w-16 h-16 mx-auto text-gray-300 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 font-medium">No items need attention</p>
            <p className="text-sm text-gray-400 mt-1">
              {filter === 'all' && 'All items are well stocked and fresh'}
              {filter === 'lowStock' && 'No items are low on stock'}
              {filter === 'expiring' && 'No items are expiring soon'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map(item => {
              const expirationStatus = getExpirationStatus(item);
              const categoryColor = getCategoryColor(item.categoryId);
              const isLowStock = item.reasons.includes('lowStock');
              const isExpiring = item.reasons.includes('expiring');

              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-gray-800">
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: categoryColor }}
                        >
                          {getCategoryName(item.categoryId)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stock Level */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm text-gray-600">
                      Stock: <span className="font-semibold">{item.stockLevel} {item.unit}</span>
                    </span>
                    {isLowStock && (
                      <span className="text-xs text-gray-500">
                        (threshold: {item.restockThreshold} {item.unit})
                      </span>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-wrap gap-2">
                    {isLowStock && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200">
                        <svg
                          className="w-4 h-4 text-orange-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-sm font-medium text-orange-800">
                          Low Stock
                        </span>
                      </div>
                    )}

                    {isExpiring && expirationStatus && (
                      <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border"
                        style={{
                          backgroundColor: expirationStatus.color === '#F44336' ? '#FFEBEE' : '#FFF9C4',
                          borderColor: expirationStatus.color === '#F44336' ? '#FFCDD2' : '#FFF59D',
                        }}
                      >
                        <svg
                          className="w-4 h-4"
                          style={{ color: expirationStatus.color }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span
                          className="text-sm font-medium"
                          style={{ color: expirationStatus.color === '#F44336' ? '#C62828' : '#F57F17' }}
                        >
                          {expirationStatus.text}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Expiration Date */}
                  {item.expirationDate && (
                    <div className="mt-2 text-xs text-gray-500">
                      Expiration date: {formatExpirationDate(item.expirationDate)}
                    </div>
                  )}

                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-2 text-sm text-gray-600 italic">
                      {item.notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
