'use client';

import React, { useState, useEffect } from 'react';
import { GroceryItem, Category, GroceryItemInput } from '@/types';

/**
 * ItemForm Component
 * 
 * Form for creating new grocery items or editing existing ones.
 * Includes validation for required fields and provides clear error messages.
 * 
 * Requirements: 4.1, 4.5
 */
interface ItemFormProps {
  item?: GroceryItem; // If provided, form is in edit mode
  categories: Category[];
  householdId: string;
  onSubmit: (item: GroceryItemInput) => Promise<void>;
  onCancel: () => void;
}

export function ItemForm({ item, categories, householdId, onSubmit, onCancel }: ItemFormProps) {
  const isEditMode = !!item;

  // Form state
  const [name, setName] = useState(item?.name || '');
  const [categoryId, setCategoryId] = useState(item?.categoryId || '');
  const [unit, setUnit] = useState(item?.unit || 'pieces');
  const [restockThreshold, setRestockThreshold] = useState(
    item?.restockThreshold?.toString() || '1'
  );
  const [notes, setNotes] = useState(item?.notes || '');
  const [expirationDate, setExpirationDate] = useState(
    item?.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : ''
  );
  const [initialStockLevel, setInitialStockLevel] = useState('0');

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when item prop changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategoryId(item.categoryId);
      setUnit(item.unit);
      setRestockThreshold(item.restockThreshold.toString());
      setNotes(item.notes || '');
      setExpirationDate(
        item.expirationDate ? new Date(item.expirationDate).toISOString().split('T')[0] : ''
      );
    }
  }, [item]);

  /**
   * Validate form fields
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name is required
    if (!name.trim()) {
      newErrors.name = 'Item name is required';
    }

    // Category is required
    if (!categoryId) {
      newErrors.categoryId = 'Category is required';
    }

    // Restock threshold must be non-negative
    const thresholdNum = parseFloat(restockThreshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      newErrors.restockThreshold = 'Restock threshold must be a non-negative number';
    }

    // Initial stock level must be non-negative (only for new items)
    if (!isEditMode) {
      const stockNum = parseFloat(initialStockLevel);
      if (isNaN(stockNum) || stockNum < 0) {
        newErrors.initialStockLevel = 'Initial stock level must be a non-negative number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const itemInput: GroceryItemInput = {
        name: name.trim(),
        categoryId,
        householdId,
        unit: unit.trim() || 'pieces',
        restockThreshold: parseFloat(restockThreshold),
        notes: notes.trim() || undefined,
        expirationDate: expirationDate ? new Date(expirationDate).getTime() : undefined,
      };

      // Add initial stock level only for new items
      if (!isEditMode) {
        itemInput.initialStockLevel = parseFloat(initialStockLevel);
      }

      await onSubmit(itemInput);
    } catch (error) {
      console.error('Failed to submit form:', error);
      setErrors({ submit: 'Failed to save item. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Title */}
      <h3 className="text-lg font-semibold text-gray-800">
        {isEditMode ? 'Edit Item' : 'Add New Item'}
      </h3>

      {/* Item Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Item Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., Milk, Eggs, Apples"
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Category Selection */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.categoryId ? 'border-red-500' : 'border-gray-300'
          }`}
          disabled={isSubmitting}
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
      </div>

      {/* Unit of Measurement */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
          Unit of Measurement
        </label>
        <input
          type="text"
          id="unit"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., pieces, kg, liters"
          disabled={isSubmitting}
        />
      </div>

      {/* Restock Threshold */}
      <div>
        <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-1">
          Restock Threshold <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="threshold"
          value={restockThreshold}
          onChange={(e) => setRestockThreshold(e.target.value)}
          step="0.1"
          min="0"
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.restockThreshold ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="e.g., 1"
          disabled={isSubmitting}
        />
        {errors.restockThreshold && (
          <p className="text-red-500 text-xs mt-1">{errors.restockThreshold}</p>
        )}
        <p className="text-gray-500 text-xs mt-1">
          You&apos;ll be notified when stock falls to or below this level
        </p>
      </div>

      {/* Initial Stock Level (only for new items) */}
      {!isEditMode && (
        <div>
          <label htmlFor="initialStock" className="block text-sm font-medium text-gray-700 mb-1">
            Initial Stock Level
          </label>
          <input
            type="number"
            id="initialStock"
            value={initialStockLevel}
            onChange={(e) => setInitialStockLevel(e.target.value)}
            step="0.1"
            min="0"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.initialStockLevel ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 0"
            disabled={isSubmitting}
          />
          {errors.initialStockLevel && (
            <p className="text-red-500 text-xs mt-1">{errors.initialStockLevel}</p>
          )}
        </div>
      )}

      {/* Expiration Date */}
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
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes (Optional)
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Add any additional information about this item"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{errors.submit}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>{isEditMode ? 'Update Item' : 'Add Item'}</>
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
  );
}
