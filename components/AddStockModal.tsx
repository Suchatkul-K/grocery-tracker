'use client';

import React, { useState } from 'react';
import { GroceryItem } from '@/types';

/**
 * AddStockModal Component
 * 
 * Modal for adding stock to a grocery item with:
 * - Quantity input
 * - Optional expiration date for the new batch
 */
interface AddStockModalProps {
  item: GroceryItem;
  onAdd: (quantity: number, expirationDate?: number) => Promise<void>;
  onCancel: () => void;
}

export function AddStockModal({ item, onAdd, onCancel }: AddStockModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [expirationDate, setExpirationDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      setError('Quantity must be a positive number');
      return;
    }

    try {
      setIsSubmitting(true);
      const expirationTimestamp = expirationDate 
        ? new Date(expirationDate).getTime() 
        : undefined;
      
      await onAdd(quantityNum, expirationTimestamp);
    } catch (err) {
      console.error('Failed to add stock:', err);
      setError('Failed to add stock. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Add Stock: {item.name}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Stock Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm text-gray-600">Current Stock</div>
              <div className="text-2xl font-bold text-gray-800">
                {item.stockLevel} {item.unit}
              </div>
            </div>

            {/* Quantity Input */}
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity to Add <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.1"
                min="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 1, 2.5"
                disabled={isSubmitting}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                New total will be: {(item.stockLevel + parseFloat(quantity || '0')).toFixed(1)} {item.unit}
              </p>
            </div>

            {/* Expiration Date (Optional) */}
            <div>
              <label htmlFor="expiration" className="block text-sm font-medium text-gray-700 mb-1">
                Expiration Date (Optional)
              </label>
              <input
                type="date"
                id="expiration"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Set expiration date for this batch (will update item{`&apos;`}s expiration if earlier)
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>Add Stock</>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
