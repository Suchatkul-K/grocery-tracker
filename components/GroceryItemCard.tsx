'use client';

import React, { useState } from 'react';
import { GroceryItem, NotificationStatus } from '@/types';
import { useApp } from '@/context/AppContext';
import { AddStockModal } from '@/components/AddStockModal';

/**
 * GroceryItemCard Component
 * 
 * Displays an individual grocery item with stock level, status indicators,
 * and quick action buttons for stock operations.
 * 
 * Requirements: 4.1, 5.1, 6.1.1
 */
interface GroceryItemCardProps {
  item: GroceryItem & { status: NotificationStatus };
  onViewHistory?: (itemId: string, itemName: string) => void;
}

export function GroceryItemCard({ item, onViewHistory }: GroceryItemCardProps) {
  const appContext = useApp();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUsing, setIsUsing] = useState(false);

  const handleAddStock = async (quantity: number, expirationDate?: number) => {
    try {
      await appContext.addStock(item.id, quantity);
      
      // If expiration date is provided and is earlier than current, update item
      if (expirationDate && (!item.expirationDate || expirationDate < item.expirationDate)) {
        await appContext.updateGroceryItem(item.id, { expirationDate });
      }
      
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add stock:', error);
      throw error;
    }
  };

  const handleUseStock = async () => {
    setIsUsing(true);
    try {
      await appContext.useStock(item.id, 1);
    } catch (error) {
      console.error('Failed to use stock:', error);
    } finally {
      setIsUsing(false);
    }
  };

  const handleViewHistory = () => {
    if (onViewHistory) {
      onViewHistory(item.id, item.name);
    }
  };

  const getStatusColor = () => {
    if (item.status.isExpired) {
      return '#F44336'; // Red
    }
    if (item.status.isExpiringSoon) {
      return '#FFC107'; // Amber
    }
    if (item.status.isLowStock) {
      return '#FF9800'; // Orange
    }
    return '#4CAF50'; // Green (normal)
  };

  const getStatusText = () => {
    const statuses: string[] = [];
    
    if (item.status.isExpired) {
      statuses.push('Expired');
    } else if (item.status.isExpiringSoon) {
      statuses.push(`Expires in ${item.status.daysUntilExpiration} day${item.status.daysUntilExpiration === 1 ? '' : 's'}`);
    }
    
    if (item.status.isLowStock) {
      statuses.push('Low stock');
    }

    return statuses.length > 0 ? statuses.join(' • ') : 'In stock';
  };

  const statusColor = getStatusColor();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Item Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-800 truncate">
            {item.name}
          </h4>
          {item.notes && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.notes}
            </p>
          )}
        </div>
      </div>

      {/* Stock Level */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-800">
            {item.stockLevel}
          </span>
          <span className="text-sm text-gray-500">{item.unit}</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Restock at {item.restockThreshold} {item.unit}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="mb-3">
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: statusColor }}
          />
          {getStatusText()}
        </div>
      </div>

      {/* Expiration Date */}
      {item.expirationDate && (
        <div className="text-xs text-gray-500 mb-3">
          Expires: {new Date(item.expirationDate).toLocaleDateString()}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add
        </button>
        <button
          onClick={handleUseStock}
          disabled={isUsing || item.stockLevel === 0}
          className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
        >
          {isUsing ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Use
            </>
          )}
        </button>
      </div>

      {/* View History Button */}
      <button
        onClick={handleViewHistory}
        className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        View History
      </button>

      {/* Add Stock Modal */}
      {showAddModal && (
        <AddStockModal
          item={item}
          onAdd={handleAddStock}
          onCancel={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
