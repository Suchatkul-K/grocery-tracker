'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { HouseholdSelector } from '@/components/HouseholdSelector';
import { NotificationCenter } from '@/components/NotificationCenter';
import { InventoryView } from '@/components/InventoryView';
import { NotificationsPanel } from '@/components/NotificationsPanel';
import { MembershipPanel } from '@/components/MembershipPanel';
import { JoinHouseholdForm } from '@/components/JoinHouseholdForm';
import { HouseholdManagement } from '@/components/HouseholdManagement';

/**
 * Home Page Component
 * 
 * Integrates all UI components into a cohesive application:
 * - Navigation bar with household selector and notification center
 * - Main inventory view as default content
 * - Support for navigation between different views
 * - Settings menu for household management
 * 
 * Requirements: 11.3
 */

type ViewType = 'inventory' | 'notifications' | 'membership' | 'join';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('inventory');
  const { currentHousehold, deselectHousehold } = useApp();

  const handleGoToLandingPage = () => {
    // Navigate to landing page by clearing current household
    deselectHousehold();
  };

  // Show landing page if no household is selected
  if (!currentHousehold) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Simple Header */}
        <nav className="bg-white shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <h1 className="text-2xl font-bold text-gray-800">
                🛒 Grocery Tracker
              </h1>
            </div>
          </div>
        </nav>

        {/* Landing Page Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Grocery Tracker
            </h2>
            <p className="text-xl text-gray-600">
              Manage your household grocery inventory with ease
            </p>
          </div>

          {/* Household Management */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <HouseholdManagement />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                🛒 Grocery Tracker
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentView('inventory')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'inventory'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Inventory
              </button>
              <button
                onClick={() => setCurrentView('notifications')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'notifications'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Alerts
              </button>
              <button
                onClick={() => setCurrentView('membership')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'membership'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Members
              </button>
              <button
                onClick={() => setCurrentView('join')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'join'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                Join
              </button>

              {/* Household Settings Button */}
              <button
                onClick={handleGoToLandingPage}
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                title="Household Settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Notification Center */}
              <NotificationCenter />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Household Selector */}
          <aside className="lg:col-span-1">
            <HouseholdSelector />
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {currentView === 'inventory' && <InventoryView />}
            {currentView === 'notifications' && <NotificationsPanel />}
            {currentView === 'membership' && <MembershipPanel />}
            {currentView === 'join' && <JoinHouseholdForm />}
          </main>
        </div>
      </div>
    </div>
  );
}
