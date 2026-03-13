'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { db } from '@/services/database';
import type { User } from '@/types';

/**
 * MembershipPanel Component
 * 
 * Comprehensive management interface for household owners:
 * - Display pending membership requests with accept/reject actions
 * - Show current household members
 * - Allow direct member addition by user ID
 * - Provide ownership transfer functionality
 * - Include household deletion option with confirmation
 * 
 * All owner-only features are conditionally rendered based on user role.
 * 
 * Requirements: 1.1.1, 1.2.1, 1.2.5, 2.1.4, 2.1.5, 2.1.7
 */
export function MembershipPanel() {
  const {
    currentHousehold,
    currentUser,
    currentUserRole,
    pendingMembershipRequests,
    acceptMembershipRequest,
    rejectMembershipRequest,
    addMemberDirectly,
    transferOwnership,
    deleteHousehold,
    refreshData,
  } = useApp();

  // State for members list
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // State for pending requests with user details
  const [pendingRequestsWithUsers, setPendingRequestsWithUsers] = useState<
    Array<{ membershipId: string; user: User; createdAt: number }>
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  // State for add member form
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberMessage, setAddMemberMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for transfer ownership
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedNewOwnerId, setSelectedNewOwnerId] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // State for delete household
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Load household members
  useEffect(() => {
    const loadMembers = async () => {
      if (!currentHousehold) return;

      setLoadingMembers(true);
      try {
        const householdMembers = await db.membership.getHouseholdMembers(currentHousehold.id);
        setMembers(householdMembers);
      } catch (error) {
        console.error('Error loading members:', error);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [currentHousehold, pendingMembershipRequests]);

  // Load pending requests with user details
  useEffect(() => {
    const loadPendingRequestsWithUsers = async () => {
      if (!currentHousehold || currentUserRole !== 'owner') return;

      setLoadingRequests(true);
      try {
        const requestsWithUsers = await Promise.all(
          pendingMembershipRequests.map(async (request) => {
            const user = await db.user.get(request.userId);
            return {
              membershipId: request.id,
              user: user!,
              createdAt: request.createdAt,
            };
          })
        );
        setPendingRequestsWithUsers(requestsWithUsers.filter(r => r.user));
      } catch (error) {
        console.error('Error loading pending requests:', error);
      } finally {
        setLoadingRequests(false);
      }
    };

    loadPendingRequestsWithUsers();
  }, [currentHousehold, currentUserRole, pendingMembershipRequests]);

  // Handle accept membership request
  const handleAcceptRequest = async (membershipId: string) => {
    try {
      await acceptMembershipRequest(membershipId);
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  // Handle reject membership request
  const handleRejectRequest = async (membershipId: string) => {
    try {
      await rejectMembershipRequest(membershipId);
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  // Handle add member directly
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMemberUserId.trim()) {
      setAddMemberMessage({ type: 'error', text: 'Please enter a user ID' });
      return;
    }

    setIsAddingMember(true);
    setAddMemberMessage(null);

    try {
      await addMemberDirectly(newMemberUserId.trim());
      setAddMemberMessage({ type: 'success', text: 'Member added successfully!' });
      setNewMemberUserId('');
    } catch (error) {
      setAddMemberMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to add member',
      });
    } finally {
      setIsAddingMember(false);
    }
  };

  // Handle transfer ownership
  const handleTransferOwnership = async () => {
    if (!selectedNewOwnerId) return;

    setIsTransferring(true);
    try {
      await transferOwnership(selectedNewOwnerId);
      setShowTransferDialog(false);
      setSelectedNewOwnerId('');
    } catch (error) {
      console.error('Error transferring ownership:', error);
      alert(error instanceof Error ? error.message : 'Failed to transfer ownership');
    } finally {
      setIsTransferring(false);
    }
  };

  // Handle delete household
  const handleDeleteHousehold = async () => {
    if (deleteConfirmation !== currentHousehold?.name) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteHousehold();
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    } catch (error) {
      console.error('Error deleting household:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete household');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!currentHousehold || !currentUser) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-gray-500">No household selected</p>
      </div>
    );
  }

  const isOwner = currentUserRole === 'owner';
  const eligibleMembers = members.filter(m => m.id !== currentUser.id && m.id !== currentHousehold.ownerId);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">Membership Management</h2>
        <p className="text-sm text-gray-600 mt-1">
          {currentHousehold.name}
        </p>
      </div>

      <div className="p-4 space-y-6">
        {/* Pending Membership Requests (Owner Only) */}
        {isOwner && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Pending Requests
              {pendingRequestsWithUsers.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                  {pendingRequestsWithUsers.length}
                </span>
              )}
            </h3>

            {loadingRequests ? (
              <p className="text-sm text-gray-500">Loading requests...</p>
            ) : pendingRequestsWithUsers.length === 0 ? (
              <p className="text-sm text-gray-500">No pending requests</p>
            ) : (
              <div className="space-y-2">
                {pendingRequestsWithUsers.map(({ membershipId, user, createdAt }) => (
                  <div
                    key={membershipId}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        User ID: {user.id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Requested: {new Date(createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptRequest(membershipId)}
                        className="px-3 py-1 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectRequest(membershipId)}
                        className="px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add Member Directly (Owner Only) */}
        {isOwner && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">Add Member Directly</h3>
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label htmlFor="newMemberUserId" className="block text-sm font-medium text-gray-700 mb-1">
                  User ID
                </label>
                <input
                  id="newMemberUserId"
                  type="text"
                  value={newMemberUserId}
                  onChange={(e) => setNewMemberUserId(e.target.value)}
                  placeholder="Enter user ID to add"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isAddingMember}
                />
              </div>

              {addMemberMessage && (
                <div
                  className={`p-2 rounded-md text-sm ${
                    addMemberMessage.type === 'success'
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {addMemberMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isAddingMember}
                className={`w-full px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  isAddingMember
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isAddingMember ? 'Adding...' : 'Add Member'}
              </button>
            </form>
          </div>
        )}

        {/* Current Members */}
        <div>
          <h3 className="text-md font-semibold text-gray-800 mb-3">
            Current Members
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({members.length})
            </span>
          </h3>

          {loadingMembers ? (
            <p className="text-sm text-gray-500">Loading members...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-500">No members</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isMemberOwner = member.id === currentHousehold.ownerId;
                const isCurrentUser = member.id === currentUser.id;

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {isMemberOwner && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                            Owner
                          </span>
                        )}
                        {isCurrentUser && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">User ID: {member.id}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transfer Ownership (Owner Only) */}
        {isOwner && eligibleMembers.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">Transfer Ownership</h3>
            <button
              onClick={() => setShowTransferDialog(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md transition-colors"
            >
              Transfer Ownership
            </button>
          </div>
        )}

        {/* Delete Household (Owner Only) */}
        {isOwner && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">Delete Household</h3>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors"
            >
              Delete Household
            </button>
          </div>
        )}
      </div>

      {/* Transfer Ownership Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">Transfer Ownership</h3>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600">
                Select a member to transfer ownership to. You will become a regular member after the transfer.
              </p>

              <div>
                <label htmlFor="newOwner" className="block text-sm font-medium text-gray-700 mb-2">
                  New Owner
                </label>
                <select
                  id="newOwner"
                  value={selectedNewOwnerId}
                  onChange={(e) => setSelectedNewOwnerId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a member...</option>
                  {eligibleMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowTransferDialog(false);
                    setSelectedNewOwnerId('');
                  }}
                  disabled={isTransferring}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransferOwnership}
                  disabled={!selectedNewOwnerId || isTransferring}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    !selectedNewOwnerId || isTransferring
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  {isTransferring ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Household Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-red-600">Delete Household</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">Warning: This action cannot be undone!</p>
                <p className="text-sm text-red-700 mt-1">
                  All household data including categories, items, and stock history will be permanently deleted.
                  All members will be notified.
                </p>
              </div>

              <div>
                <label htmlFor="deleteConfirmation" className="block text-sm font-medium text-gray-700 mb-2">
                  Type the household name to confirm: <span className="font-semibold">{currentHousehold.name}</span>
                </label>
                <input
                  id="deleteConfirmation"
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="Enter household name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={isDeleting}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setDeleteConfirmation('');
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteHousehold}
                  disabled={deleteConfirmation !== currentHousehold.name || isDeleting}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                    deleteConfirmation !== currentHousehold.name || isDeleting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Household'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
