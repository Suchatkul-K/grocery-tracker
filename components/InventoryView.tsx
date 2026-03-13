'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { inventoryService } from '@/services/database/services/inventory.service';
import { CategorySection } from '@/components/CategorySection';
import { ItemForm } from '@/components/ItemForm';
import { ItemHistoryModal } from '@/components/ItemHistoryModal';
import type { GroceryItemInput } from '@/types';

/**
 * InventoryView Component
 * 
 * Main view for displaying the household's grocery inventory.
 * Groups items by category, displays stock levels with visual indicators
 * for low stock and expiration status, and provides quick action buttons
 * for adding or using stock.
 * 
 * Items can have multiple status indicators simultaneously (e.g., both
 * low stock and expiring).
 * 
 * Requirements: 3.4, 5.1, 5.4, 8.6, 8.7, 8.8
 */
export function InventoryView() {
  const {
    currentHousehold,
    categories,
    groceryItems,
    isLoading,
    error,
    viewItemHistory,
    createGroceryItem,
  } = useApp();

  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state management for ItemHistoryModal
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemName, setSelectedItemName] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Handle viewing item history
  const handleViewHistory = React.useCallback((itemId: string, itemName: string) => {
    setSelectedItemId(itemId);
    setSelectedItemName(itemName);
    setShowHistoryModal(true);
  }, []);

  // Handle closing history modal
  const handleCloseHistory = React.useCallback(() => {
    setShowHistoryModal(false);
    setSelectedItemId(null);
    setSelectedItemName('');
  }, []);

  // Handle adding new item
  const handleAddItem = async (item: GroceryItemInput) => {
    try {
      await createGroceryItem(item);
      setShowAddItemForm(false);
    } catch (err) {
      console.error('Failed to create item:', err);
      throw err; // Re-throw to let ItemForm handle the error
    }
  };

  // Group items by category and calculate notification status
  const itemsByCategory = useMemo(() => {
    if (!groceryItems || groceryItems.length === 0) {
      return new Map();
    }

    // Filter items by search query
    const filteredItems = searchQuery.trim()
      ? groceryItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : groceryItems;

    const grouped = new Map();

    filteredItems.forEach(item => {
      const status = inventoryService.calculateNotificationStatus(item.id);
      const itemWithStatus = { ...item, status };

      if (!grouped.has(item.categoryId)) {
        grouped.set(item.categoryId, []);
      }
      grouped.get(item.categoryId)!.push(itemWithStatus);
    });

    return grouped;
  }, [groceryItems, searchQuery]);

  // Sort categories by name for consistent display
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }, [categories]);

  if (!currentHousehold) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <p className="text-gray-500 text-lg">No household selected</p>
          <p className="text-gray-400 text-sm mt-2">
            Select or create a household to view inventory
          </p>
        </div>
      </div>
    );
  }

  if (isLoading && groceryItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-red-800 font-semibold">Error loading inventory</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (groceryItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
          <p className="text-gray-500 text-lg mb-4">No items in inventory</p>
          <button
            onClick={() => setShowAddItemForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Your First Item
          </button>
        </div>

        {/* Add Item Modal */}
        {showAddItemForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <ItemForm
                  categories={categories}
                  householdId={currentHousehold.id}
                  onSubmit={handleAddItem}
                  onCancel={() => setShowAddItemForm(false)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">
            {currentHousehold.name} Inventory
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {groceryItems.length} {groceryItems.length === 1 ? 'item' : 'items'} across{' '}
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </p>
        </div>

        {/* Add Item Button */}
        <button
          onClick={() => setShowAddItemForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search items..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Categories and Items */}
      <div className="space-y-6">
        {sortedCategories.map(category => {
          const items = itemsByCategory.get(category.id) || [];
          if (items.length === 0 && searchQuery) {
            return null; // Hide empty categories when searching
          }
          return (
            <CategorySection
              key={category.id}
              category={category}
              items={items}
              onViewHistory={handleViewHistory}
            />
          );
        })}
        
        {searchQuery && Array.from(itemsByCategory.values()).flat().length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-500 text-lg">No items found</p>
            <p className="text-gray-400 text-sm mt-2">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <ItemForm
                categories={categories}
                householdId={currentHousehold.id}
                onSubmit={handleAddItem}
                onCancel={() => setShowAddItemForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Item History Modal */}
      {showHistoryModal && selectedItemId && (
        <ItemHistoryModal
          itemId={selectedItemId}
          itemName={selectedItemName}
          isOpen={showHistoryModal}
          onClose={handleCloseHistory}
        />
      )}
    </div>
  );
}
