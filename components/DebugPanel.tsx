'use client';

import { useEffect, useState } from 'react';
import { db } from '@/services/database';
import { useApp } from '@/context/AppContext';
import type { User, Household, Category, GroceryItem, Notification } from '@/types';

export default function DebugPanel() {
  const { currentUser, switchUser } = useApp();
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'households' | 'categories' | 'items' | 'notifications'>('users');
  const [data, setData] = useState<{
    users: User[];
    households: Household[];
    categories: Category[];
    items: GroceryItem[];
    notifications: Notification[];
  }>({
    users: [],
    households: [],
    categories: [],
    items: [],
    notifications: [],
  });

  useEffect(() => {
    // Expose debug_mode function to window
    (window as any).debug_mode = () => {
      setIsVisible(prev => !prev);
      console.log('Debug mode toggled');
    };

    return () => {
      delete (window as any).debug_mode;
    };
  }, []);

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible]);

  const loadData = async () => {
    try {
      const users = await db.user.getAll();
      const households = await db.household.getAll();
      
      // Get all categories and items from all households
      const allCategories: Category[] = [];
      const allItems: GroceryItem[] = [];
      
      for (const household of households) {
        const categories = await db.category.getAll(household.id);
        const items = await db.groceryItem.getAll(household.id);
        allCategories.push(...categories);
        allItems.push(...items);
      }

      // Get notifications for all users
      const allNotifications: Notification[] = [];
      for (const user of users) {
        const notifications = await db.notification.getUserNotifications(user.id);
        allNotifications.push(...notifications);
      }

      setData({
        users,
        households,
        categories: allCategories,
        items: allItems,
        notifications: allNotifications,
      });
    } catch (error) {
      console.error('Failed to load debug data:', error);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset the database? This will delete ALL data!')) {
      return;
    }

    try {
      await db.schema.reset();
      await loadData();
      alert('Database reset successfully!');
      window.location.reload(); // Reload to reinitialize app state
    } catch (error) {
      console.error('Failed to reset database:', error);
      alert('Failed to reset database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSeedDatabase = async () => {
    try {
      await db.sampleData.populateSampleData();
      await loadData();
      alert('Sample data populated successfully!');
      window.location.reload(); // Reload to reinitialize app state
    } catch (error) {
      console.error('Failed to seed database:', error);
      alert('Failed to seed database: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      await switchUser(userId);
      setIsVisible(false); // Close debug panel after switching
    } catch (error) {
      console.error('Failed to switch user:', error);
      alert('Failed to switch user: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (!isVisible) return null;

  const tabs = [
    { id: 'users' as const, label: 'Users', count: data.users.length },
    { id: 'households' as const, label: 'Households', count: data.households.length },
    { id: 'categories' as const, label: 'Categories', count: data.categories.length },
    { id: 'items' as const, label: 'Items', count: data.items.length },
    { id: 'notifications' as const, label: 'Notifications', count: data.notifications.length },
  ];

  return (
    <div className="fixed bottom-4 right-4 w-[600px] max-h-[600px] bg-white border-2 border-gray-800 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 flex items-center justify-between rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold">🐛 Debug Panel</span>
          <button
            onClick={loadData}
            className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleSeedDatabase}
            className="text-xs bg-green-700 hover:bg-green-600 px-2 py-1 rounded transition-colors"
          >
            Seed Data
          </button>
          <button
            onClick={handleResetDatabase}
            className="text-xs bg-red-700 hover:bg-red-600 px-2 py-1 rounded transition-colors"
          >
            Reset DB
          </button>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-white hover:text-red-400 text-xl font-bold transition-colors"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === 'users' && (
          <div className="space-y-2">
            {data.users.length === 0 ? (
              <p className="text-gray-500 text-sm">No users found</p>
            ) : (
              data.users.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSwitchUser(user.id)}
                  className={`w-full text-left bg-gray-50 p-3 rounded border transition-colors ${
                    currentUser?.id === user.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-mono text-xs text-gray-500 mb-1">{user.id}</div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        Created: {new Date(user.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {currentUser?.id === user.id && (
                      <div className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                        Active
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {activeTab === 'households' && (
          <div className="space-y-2">
            {data.households.length === 0 ? (
              <p className="text-gray-500 text-sm">No households found</p>
            ) : (
              data.households.map(household => (
                <div key={household.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="font-mono text-xs text-gray-500 mb-1">{household.id}</div>
                  <div className="font-semibold">{household.name}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Owner: <span className="font-mono">{household.ownerId}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Reference: <span className="font-mono">{household.referenceCode}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Created: {new Date(household.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="space-y-2">
            {data.categories.length === 0 ? (
              <p className="text-gray-500 text-sm">No categories found</p>
            ) : (
              data.categories.map(category => (
                <div key={category.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="font-semibold">{category.name}</div>
                  </div>
                  <div className="font-mono text-xs text-gray-500 mt-1">{category.id}</div>
                  <div className="text-xs text-gray-600">
                    Household: <span className="font-mono">{category.householdId}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'items' && (
          <div className="space-y-2">
            {data.items.length === 0 ? (
              <p className="text-gray-500 text-sm">No items found</p>
            ) : (
              data.items.map(item => (
                <div key={item.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="font-semibold">{item.name}</div>
                  <div className="font-mono text-xs text-gray-500 mb-1">{item.id}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                    <div>Stock: {item.stockLevel}</div>
                    <div>Restock at: {item.restockThreshold}</div>
                    <div>Category: <span className="font-mono">{item.categoryId}</span></div>
                    <div>Household: <span className="font-mono">{item.householdId}</span></div>
                  </div>
                  {item.expirationDate && (
                    <div className="text-xs text-orange-600 mt-1">
                      Expires: {new Date(item.expirationDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-2">
            {data.notifications.length === 0 ? (
              <p className="text-gray-500 text-sm">No notifications found</p>
            ) : (
              data.notifications.map(notification => (
                <div key={notification.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      notification.type === 'ownership_transfer' ? 'bg-purple-100 text-purple-800' :
                      notification.type === 'household_deletion' ? 'bg-red-100 text-red-800' :
                      notification.type === 'membership_approved' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {notification.type}
                    </span>
                    {notification.isRead && (
                      <span className="text-xs text-gray-500">✓ Read</span>
                    )}
                  </div>
                  <div className="text-sm">{notification.message}</div>
                  <div className="font-mono text-xs text-gray-500 mt-1">{notification.id}</div>
                  <div className="text-xs text-gray-600">
                    User: <span className="font-mono">{notification.userId}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Created: {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-2 text-xs text-gray-600 border-t border-gray-200 rounded-b-lg">
        Type <code className="bg-gray-200 px-1 rounded">debug_mode()</code> in console to toggle
      </div>
    </div>
  );
}
