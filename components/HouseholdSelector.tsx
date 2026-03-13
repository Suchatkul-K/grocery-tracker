'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

/**
 * HouseholdSelector Component
 * 
 * Displays a list of households the current user can access, showing:
 * - User's role (owner/member) for each household
 * - Ability to switch between households
 * - Reference code for households where user is owner
 * - Count of pending membership requests for owners
 * 
 * Requirements: 1.4, 1.5, 2.1.4
 */
export function HouseholdSelector() {
  const {
    currentHousehold,
    userHouseholds,
    pendingMembershipRequests,
    switchHousehold,
    isLoading,
  } = useApp();

  const handleSwitchHousehold = async (householdId: string) => {
    if (householdId === currentHousehold?.id) {
      return; // Already on this household
    }

    try {
      await switchHousehold(householdId);
    } catch (error) {
      console.error('Failed to switch household:', error);
    }
  };

  if (isLoading && userHouseholds.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500">Loading households...</p>
      </div>
    );
  }

  if (userHouseholds.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-gray-500 text-sm">No households available</p>
        <p className="text-xs text-gray-400 mt-2">Go to Households page to create one</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">My Households</h2>
      </div>
      
      <div className="divide-y divide-gray-200">
        {userHouseholds.map(({ household, role }) => {
          const isActive = currentHousehold?.id === household.id;
          const pendingCount = isActive && role === 'owner' 
            ? pendingMembershipRequests.length 
            : 0;

          return (
            <div
              key={household.id}
              className={`p-4 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-blue-50 border-l-4 border-blue-500'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => handleSwitchHousehold(household.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">
                      {household.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        role === 'owner'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {role === 'owner' ? 'Owner' : 'Member'}
                    </span>
                  </div>

                  {role === 'owner' && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Reference Code:
                        </span>
                        <code className="px-2 py-0.5 text-xs font-mono bg-gray-100 rounded">
                          {household.referenceCode}
                        </code>
                      </div>
                      
                      {pendingCount > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Pending Requests:
                          </span>
                          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            {pendingCount}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {isActive && (
                  <div className="ml-2">
                    <svg
                      className="w-5 h-5 text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
