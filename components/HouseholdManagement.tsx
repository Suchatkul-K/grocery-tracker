'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { JoinHouseholdForm } from '@/components/JoinHouseholdForm';

/**
 * HouseholdManagement Component
 * 
 * Dedicated page for managing households:
 * - Create new household
 * - Join existing household
 * - View all households with details
 * - Switch between households
 * - Delete household (for owners)
 * - Transfer ownership (for owners)
 */
export function HouseholdManagement() {
  const {
    currentHousehold,
    userHouseholds,
    pendingMembershipRequests,
    userPendingRequests,
    createHousehold,
    deleteHousehold,
    switchHousehold,
    isLoading,
  } = useApp();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreateHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newHouseholdName.trim()) {
      return;
    }

    try {
      setIsCreating(true);
      await createHousehold(newHouseholdName.trim());
      setNewHouseholdName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create household:', error);
      alert('Failed to create household. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteHousehold = async (householdId: string) => {
    try {
      setIsDeleting(true);
      await switchHousehold(householdId);
      await deleteHousehold();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete household:', error);
      alert('Failed to delete household. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <p className="text-gray-500 text-center">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Household Management</h1>
        <p className="text-gray-600">Create a new household or join an existing one</p>
      </div>

      {/* Create or Join Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Household */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Household</h2>
          
          {!showCreateForm ? (
            <div>
              <p className="text-sm text-gray-600 mb-4">
                Start a new household and invite others to join
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Create New Household
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateHousehold} className="space-y-4">
              <div>
                <label htmlFor="household-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Household Name
                </label>
                <input
                  id="household-name"
                  type="text"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  placeholder="e.g., Smith Family, Apartment 4B"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                  disabled={isCreating}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  type="submit"
                  disabled={isCreating || !newHouseholdName.trim()}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                >
                  {isCreating ? 'Creating...' : 'Create Household'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewHouseholdName('');
                  }}
                  disabled={isCreating}
                  className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Join Existing Household */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Join Existing Household</h2>
          <p className="text-sm text-gray-600 mb-4">
            Enter a reference code to request joining a household
          </p>
          <JoinHouseholdForm />
        </div>
      </div>

      {/* My Households Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">My Households</h2>
          <p className="text-sm text-gray-600 mt-1">
            {userHouseholds.length} {userHouseholds.length === 1 ? 'household' : 'households'}
          </p>
        </div>

        {userHouseholds.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">You don't have any households yet.</p>
            <p className="text-sm text-gray-400 mt-2">Create your first household above to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {userHouseholds.map(({ household, role }) => {
              const isActive = currentHousehold?.id === household.id;
              const pendingCount = role === 'owner' 
                ? pendingMembershipRequests.filter(m => m.householdId === household.id).length 
                : 0;

              return (
                <div
                  key={household.id}
                  className={`p-6 ${isActive ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {household.name}
                        </h3>
                        <span
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            role === 'owner'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {role === 'owner' ? 'Owner' : 'Member'}
                        </span>
                        {isActive && (
                          <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Created:</span>
                          <span className="text-gray-700">
                            {new Date(household.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {role === 'owner' && (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">Reference Code:</span>
                              <code className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                                {household.referenceCode}
                              </code>
                              <span className="text-xs text-gray-400">
                                (Share this with others to invite them)
                              </span>
                            </div>
                            
                            {pendingCount > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">Pending Requests:</span>
                                <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                  {pendingCount}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3 mt-4">
                        {!isActive && (
                          <button
                            onClick={() => switchHousehold(household.id)}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
                          >
                            Switch to This Household
                          </button>
                        )}

                        {role === 'owner' && (
                          <>
                            {showDeleteConfirm === household.id ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDeleteHousehold(household.id)}
                                  disabled={isDeleting}
                                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-gray-300"
                                >
                                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                </button>
                                <button
                                  onClick={() => setShowDeleteConfirm(null)}
                                  disabled={isDeleting}
                                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setShowDeleteConfirm(household.id)}
                                className="px-4 py-2 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors font-medium"
                              >
                                Delete Household
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending Requests Section */}
      {userPendingRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Pending Join Requests</h2>
            <p className="text-sm text-gray-600 mt-1">
              Requests you've sent to join households
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {userPendingRequests.map(({ membership, household }) => (
              <div key={membership.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {household.name}
                      </h3>
                      <span className="px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                        Pending Approval
                      </span>
                    </div>

                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Requested:</span>
                        <span className="text-gray-700">
                          {new Date(membership.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Reference Code:</span>
                        <code className="px-2 py-1 text-xs font-mono bg-gray-100 rounded">
                          {household.referenceCode}
                        </code>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 mt-3">
                      Waiting for the household owner to approve your request
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
