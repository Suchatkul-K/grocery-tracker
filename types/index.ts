// Core entity interfaces matching database schema

export interface Household {
  id: string;
  name: string;
  referenceCode: string;
  ownerId: string;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  createdAt: number;
}

export interface HouseholdMembership {
  id: string;
  userId: string;
  householdId: string;
  role: 'owner' | 'member';
  status: 'active' | 'pending';
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  householdId: string;
  createdAt: number;
}

export interface GroceryItem {
  id: string;
  name: string;
  categoryId: string;
  householdId: string;
  restockThreshold: number;
  unit: string;
  notes?: string;
  expirationDate?: number; // Unix timestamp
  stockLevel: number;
  createdAt: number;
  updatedAt: number;
}

export interface StockTransaction {
  id: string;
  groceryItemId: string;
  userId: string;
  transactionType: 'add' | 'use';
  quantity: number;
  timestamp: number;
}

export interface Notification {
  id: string;
  userId: string;
  householdId?: string;
  type: 'ownership_transfer' | 'household_deletion' | 'membership_approved';
  message: string;
  isRead: boolean;
  createdAt: number;
}

// Input types for creating entities

export interface GroceryItemInput {
  name: string;
  categoryId: string;
  householdId: string;
  restockThreshold?: number;
  unit?: string;
  notes?: string;
  expirationDate?: number;
  initialStockLevel?: number;
}

// Helper types for queries and views

export interface StockTransactionWithUser {
  transaction: StockTransaction;
  user: User;
}

export interface ItemHistory {
  itemCreatedAt: number;
  transactions: StockTransactionWithUser[];
}

export interface NotificationStatus {
  isLowStock: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiration?: number;
}

export interface HouseholdWithRole {
  household: Household;
  role: 'owner' | 'member';
}

export interface PendingRequestWithHousehold {
  membership: HouseholdMembership;
  household: Household;
}
