'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { db } from '@/services/database';
import type {
  Household,
  User,
  HouseholdWithRole,
  Category,
  GroceryItem,
  HouseholdMembership,
  Notification,
  ItemHistory,
  GroceryItemInput,
  PendingRequestWithHousehold,
} from '@/types';

/**
 * AppContext value interface
 * Provides global state and actions for the entire application
 */
interface AppContextValue {
  // State
  currentHousehold: Household | null;
  currentUser: User | null;
  userHouseholds: HouseholdWithRole[];
  currentUserRole: 'owner' | 'member' | null;
  categories: Category[];
  groceryItems: GroceryItem[];
  lowStockItems: GroceryItem[];
  expiringItems: GroceryItem[];
  pendingMembershipRequests: HouseholdMembership[];
  userPendingRequests: PendingRequestWithHousehold[];
  notifications: Notification[];
  unreadNotificationCount: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  switchHousehold: (householdId: string) => Promise<void>;
  deselectHousehold: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  transferOwnership: (newOwnerId: string) => Promise<void>;
  deleteHousehold: () => Promise<void>;
  requestJoinHousehold: (referenceCode: string) => Promise<void>;
  acceptMembershipRequest: (membershipId: string) => Promise<void>;
  rejectMembershipRequest: (membershipId: string) => Promise<void>;
  addMemberDirectly: (userId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  addStock: (itemId: string, quantity: number) => Promise<void>;
  useStock: (itemId: string, quantity: number) => Promise<void>;
  viewItemHistory: (itemId: string) => Promise<ItemHistory>;
  createGroceryItem: (item: GroceryItemInput) => Promise<void>;
  updateGroceryItem: (id: string, updates: Partial<GroceryItemInput>) => Promise<void>;
  deleteGroceryItem: (id: string) => Promise<void>;
  createCategory: (name: string) => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

/**
 * AppContext Provider Props
 */
interface AppProviderProps {
  children: ReactNode;
}

/**
 * AppContext Provider Component
 * Manages global application state and provides actions to update it
 */
export function AppProvider({ children }: AppProviderProps) {
  // State
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userHouseholds, setUserHouseholds] = useState<HouseholdWithRole[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'owner' | 'member' | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<GroceryItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<GroceryItem[]>([]);
  const [pendingMembershipRequests, setPendingMembershipRequests] = useState<HouseholdMembership[]>([]);
  const [userPendingRequests, setUserPendingRequests] = useState<PendingRequestWithHousehold[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load household-specific data
   * Called when switching households or refreshing data
   */
  const loadHouseholdData = useCallback(async (householdId: string, userId: string) => {
    try {
      // Load categories
      const cats = await db.category.getAll(householdId);
      setCategories(cats);

      // Load grocery items
      const items = await db.groceryItem.getAll(householdId);
      setGroceryItems(items);

      // Load low stock items
      const lowStock = await db.inventory.getLowStockItems(householdId);
      setLowStockItems(lowStock);

      // Load expiring items (3 days ahead)
      const expiring = await db.inventory.getExpiringItems(householdId, 3);
      setExpiringItems(expiring);

      // Load user role
      const role = await db.membership.getUserRole(userId, householdId);
      setCurrentUserRole(role);

      // Load pending membership requests (if owner)
      if (role === 'owner') {
        const pending = await db.membership.getPendingRequests(householdId);
        setPendingMembershipRequests(pending);
      } else {
        setPendingMembershipRequests([]);
      }
    } catch (err) {
      console.error('Error loading household data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load household data');
    }
  }, []);

  /**
   * Load user-specific data
   * Called on initialization and when user data changes
   */
  const loadUserData = useCallback(async (userId: string) => {
    try {
      // Load user's households
      const households = await db.membership.getUserHouseholds(userId);
      setUserHouseholds(households);

      // Load user's pending requests (requests they sent) with household details
      const userPending = await db.membership.getUserPendingRequestsWithHousehold(userId);
      setUserPendingRequests(userPending);

      // Load notifications
      const userNotifications = await db.notification.getUserNotifications(userId);
      setNotifications(userNotifications);

      // Load unread notification count
      const unreadCount = await db.notification.getUnreadCount(userId);
      setUnreadNotificationCount(unreadCount);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
    }
  }, []);

  /**
   * Initialize database and load initial data
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check browser compatibility
        const compatibility = db.checkCompatibility();
        if (!compatibility.compatible) {
          setError(compatibility.errors.join(', ') || 'Browser not compatible');
          setIsLoading(false);
          return;
        }

        // Initialize database
        await db.initialize();

        // For demo purposes, get or create a default user
        // In a real app, this would come from authentication
        let user = await db.user.get('default-user');
        if (!user) {
          user = await db.user.create('Default User');
        }
        setCurrentUser(user);

        // Load user data
        await loadUserData(user.id);

        // Load user's households
        const households = await db.membership.getUserHouseholds(user.id);
        
        // Set first household as current (if any exist)
        if (households.length > 0) {
          const firstHousehold = households[0].household;
          setCurrentHousehold(firstHousehold);
          await loadHouseholdData(firstHousehold.id, user.id);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing app:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize application');
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadUserData, loadHouseholdData]);

  /**
   * Switch to a different household
   */
  const switchHousehold = useCallback(async (householdId: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      setIsLoading(true);
      const household = await db.household.get(householdId);
      if (!household) {
        throw new Error('Household not found');
      }

      setCurrentHousehold(household);
      await loadHouseholdData(householdId, currentUser.id);
      setIsLoading(false);
    } catch (err) {
      console.error('Error switching household:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch household');
      setIsLoading(false);
      throw err;
    }
  }, [currentUser, loadHouseholdData]);

  /**
   * Clear the selected household
   */
  const deselectHousehold = useCallback(async () => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      setIsLoading(true);
      setCurrentHousehold(null);

      // reset state
      setCategories([]);
      setGroceryItems([]);
      setLowStockItems([]);
      setExpiringItems([]);
      setCurrentUserRole(null);

      setIsLoading(false);
    } catch (err) {
      console.error('Error switching household:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch household');
      setIsLoading(false);
      throw err;
    }
  }, [currentUser]);

  /**
   * Switch to a different user
   */
  const switchUser = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const user = await db.user.get(userId);
      if (!user) {
        throw new Error('User not found');
      }

      setCurrentUser(user);
      await loadUserData(user.id);

      // Load user's households
      const households = await db.membership.getUserHouseholds(user.id);
      
      // Set first household as current (if any exist)
      if (households.length > 0) {
        const firstHousehold = households[0].household;
        setCurrentHousehold(firstHousehold);
        await loadHouseholdData(firstHousehold.id, user.id);
      } else {
        // Clear household if user has none
        setCurrentHousehold(null);
        setCategories([]);
        setGroceryItems([]);
        setLowStockItems([]);
        setExpiringItems([]);
        setPendingMembershipRequests([]);
        setCurrentUserRole(null);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Error switching user:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch user');
      setIsLoading(false);
      throw err;
    }
  }, [loadUserData, loadHouseholdData]);

  /**
   * Refresh all data for current household and user
   */
  const refreshData = useCallback(async () => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      await loadUserData(currentUser.id);
      
      if (currentHousehold) {
        await loadHouseholdData(currentHousehold.id, currentUser.id);
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
      throw err;
    }
  }, [currentUser, currentHousehold, loadUserData, loadHouseholdData]);

  /**
   * Transfer ownership of current household
   */
  const transferOwnership = useCallback(async (newOwnerId: string) => {
    if (!currentHousehold || !currentUser) {
      throw new Error('No current household or user');
    }

    try {
      await db.household.transferOwnership(currentHousehold.id, newOwnerId);
      await refreshData();
    } catch (err) {
      console.error('Error transferring ownership:', err);
      setError(err instanceof Error ? err.message : 'Failed to transfer ownership');
      throw err;
    }
  }, [currentHousehold, currentUser, refreshData]);

  /**
   * Delete current household
   */
  const deleteHousehold = useCallback(async () => {
    if (!currentHousehold || !currentUser) {
      throw new Error('No current household or user');
    }

    try {
      await db.household.delete(currentHousehold.id);
      
      // Clear current household
      setCurrentHousehold(null);
      setCategories([]);
      setGroceryItems([]);
      setLowStockItems([]);
      setExpiringItems([]);
      setPendingMembershipRequests([]);
      setCurrentUserRole(null);
      
      // Refresh user data to update household list
      await loadUserData(currentUser.id);
    } catch (err) {
      console.error('Error deleting household:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete household');
      throw err;
    }
  }, [currentHousehold, currentUser, loadUserData]);

  /**
   * Request to join a household using reference code
   */
  const requestJoinHousehold = useCallback(async (referenceCode: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      await db.membership.requestJoin(currentUser.id, referenceCode);
      await loadUserData(currentUser.id);
    } catch (err) {
      console.error('Error requesting to join household:', err);
      setError(err instanceof Error ? err.message : 'Failed to request joining household');
      throw err;
    }
  }, [currentUser, loadUserData]);

  /**
   * Accept a pending membership request
   */
  const acceptMembershipRequest = useCallback(async (membershipId: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      await db.membership.acceptRequest(membershipId);
      await refreshData();
    } catch (err) {
      console.error('Error accepting membership request:', err);
      setError(err instanceof Error ? err.message : 'Failed to accept membership request');
      throw err;
    }
  }, [currentUser, refreshData]);

  /**
   * Reject a pending membership request
   */
  const rejectMembershipRequest = useCallback(async (membershipId: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      await db.membership.rejectRequest(membershipId);
      await refreshData();
    } catch (err) {
      console.error('Error rejecting membership request:', err);
      setError(err instanceof Error ? err.message : 'Failed to reject membership request');
      throw err;
    }
  }, [currentUser, refreshData]);

  /**
   * Add a member directly to current household
   */
  const addMemberDirectly = useCallback(async (userId: string) => {
    if (!currentHousehold || !currentUser) {
      throw new Error('No current household or user');
    }

    try {
      await db.membership.addMemberDirectly(currentHousehold.id, userId);
      await refreshData();
    } catch (err) {
      console.error('Error adding member:', err);
      setError(err instanceof Error ? err.message : 'Failed to add member');
      throw err;
    }
  }, [currentHousehold, currentUser, refreshData]);

  /**
   * Mark a notification as read
   */
  const markNotificationAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      await db.notification.markAsRead(notificationId);
      await loadUserData(currentUser.id);
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
      throw err;
    }
  }, [currentUser, loadUserData]);

  /**
   * Add stock to a grocery item
   */
  const addStock = useCallback(async (itemId: string, quantity: number) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.stock.add(itemId, quantity, currentUser.id);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error adding stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to add stock');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * Use stock from a grocery item
   */
  const useStock = useCallback(async (itemId: string, quantity: number) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.stock.use(itemId, quantity, currentUser.id);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error using stock:', err);
      setError(err instanceof Error ? err.message : 'Failed to use stock');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * View item history
   */
  const viewItemHistory = useCallback(async (itemId: string): Promise<ItemHistory> => {
    try {
      return await db.stock.getItemHistory(itemId);
    } catch (err) {
      console.error('Error viewing item history:', err);
      setError(err instanceof Error ? err.message : 'Failed to view item history');
      throw err;
    }
  }, []);

  /**
   * Create a new grocery item
   */
  const createGroceryItem = useCallback(async (item: GroceryItemInput) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.groceryItem.create(item, currentUser.id);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error creating grocery item:', err);
      setError(err instanceof Error ? err.message : 'Failed to create grocery item');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * Update a grocery item
   */
  const updateGroceryItem = useCallback(async (id: string, updates: Partial<GroceryItemInput>) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.groceryItem.update(id, updates);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error updating grocery item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update grocery item');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * Delete a grocery item
   */
  const deleteGroceryItem = useCallback(async (id: string) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.groceryItem.delete(id);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error deleting grocery item:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete grocery item');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * Create a new category
   */
  const createCategory = useCallback(async (name: string) => {
    if (!currentUser || !currentHousehold) {
      throw new Error('No current user or household');
    }

    try {
      await db.category.create(name, currentHousehold.id);
      await loadHouseholdData(currentHousehold.id, currentUser.id);
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'Failed to create category');
      throw err;
    }
  }, [currentUser, currentHousehold, loadHouseholdData]);

  /**
   * Create a new household
   */
  const createHousehold = useCallback(async (name: string) => {
    if (!currentUser) {
      throw new Error('No current user');
    }

    try {
      const household = await db.household.create(name, currentUser.id);
      setCurrentHousehold(household);
      await loadUserData(currentUser.id);
      await loadHouseholdData(household.id, currentUser.id);
    } catch (err) {
      console.error('Error creating household:', err);
      setError(err instanceof Error ? err.message : 'Failed to create household');
      throw err;
    }
  }, [currentUser, loadUserData, loadHouseholdData]);

  const value: AppContextValue = {
    // State
    currentHousehold,
    currentUser,
    userHouseholds,
    currentUserRole,
    categories,
    groceryItems,
    lowStockItems,
    expiringItems,
    pendingMembershipRequests,
    userPendingRequests,
    notifications,
    unreadNotificationCount,
    isLoading,
    error,

    // Actions
    switchHousehold,
    deselectHousehold,
    switchUser,
    refreshData,
    transferOwnership,
    deleteHousehold,
    requestJoinHousehold,
    acceptMembershipRequest,
    rejectMembershipRequest,
    addMemberDirectly,
    markNotificationAsRead,
    addStock,
    useStock,
    viewItemHistory,
    createGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    createCategory,
    createHousehold,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/**
 * Hook to use AppContext
 * Throws error if used outside of AppProvider
 */
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
