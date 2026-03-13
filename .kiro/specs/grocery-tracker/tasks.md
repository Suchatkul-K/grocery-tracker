# Implementation Plan: Grocery Tracker

## Overview

This plan implements a local-first web application using Next.js, TypeScript, and SQLite (via sql.js) that runs entirely in the browser. The application enables household members to track grocery inventory with complete privacy through IndexedDB persistence. Implementation follows an incremental approach, building core infrastructure first, then layering features with testing at each step.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Initialize Next.js project with TypeScript
  - Install dependencies: sql.js, fast-check (for property testing)
  - Configure Next.js for static export (client-side only)
  - Set up project directory structure (src/services, src/context, src/components, src/types)
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 2. Implement database layer foundation
  - [x] 2.1 Create TypeScript type definitions
    - Define all interfaces (Household, User, Category, GroceryItem, etc.)
    - Define input types and helper types
    - _Requirements: 12.2_
  
  - [x] 2.2 Implement database service initialization
    - Initialize sql.js with WebAssembly
    - Create database schema (all tables and indexes)
    - Implement IndexedDB persistence (save/load methods)
    - Handle browser compatibility checks
    - _Requirements: 9.1, 9.3, 9.5, 12.3_
  
  - [x] 2.3 Refactor to modular architecture
    - Extract core layer (connection, query-executor, schema)
    - Create repository layer (base, user, household, membership)
    - Create service layer (household, membership)
    - Create facade layer with backward compatibility
    - Extract utilities (id-generator)
    - _Requirements: 12.2, 12.3_
  
  - [ ]* 2.4 Write property test for database initialization
    - **Property 24: Database reinitialization**
    - **Validates: Requirements 9.3, 9.4**

- [x] 3. Implement user and household management
  - [x] 3.1 Implement user operations
    - Create user account with unique ID
    - Store user in database
    - Retrieve user by ID
    - Implemented in user.repository.ts
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 3.2 Write property test for user creation
    - **Property 1: Entity creation uniqueness (users)**
    - **Property 2: Data persistence round-trip (users)**
    - **Validates: Requirements 2.1, 2.2_
  
  - [x] 3.3 Implement household operations
    - Create household with unique ID and reference code
    - Assign creating user as owner
    - Store household in database
    - Retrieve household by ID and by reference code
    - Implemented in household.repository.ts and household.service.ts
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 3.4 Write property tests for household creation
    - **Property 1: Entity creation uniqueness (households)**
    - **Property 2: Data persistence round-trip (households)**
    - **Property 3.1: Household reference code uniqueness**
    - **Property 3.2: Owner assignment**
    - **Validates: Requirements 1.1, 1.2, 1.3_

- [x] 4. Implement household membership system
  - [x] 4.1 Implement membership operations
    - Create membership records (active and pending)
    - Query user's households with roles
    - Query household members
    - Get user role for specific household
    - Implemented in membership.repository.ts
    - _Requirements: 1.4, 1.5, 2.3, 2.4_
  
  - [x] 4.2 Implement membership request workflow
    - Request to join household by reference code
    - Get pending membership requests for household
    - Accept membership request (change status to active)
    - Reject membership request (delete record)
    - Add member directly by user ID
    - Implemented in membership.service.ts
    - _Requirements: 2.1.1, 2.1.2, 2.1.3, 2.1.4, 2.1.5, 2.1.6, 2.1.7_
  
  - [ ]* 4.3 Write property tests for membership system
    - **Property 3: User-household association**
    - **Property 3.3: Multiple household access**
    - **Property 3.4: Pending membership request**
    - **Property 3.5: Membership approval**
    - **Property 3.6: Role tracking**
    - **Property 4: User household invariant**
    - **Validates: Requirements 1.4, 1.5, 2.1.2, 2.1.3, 2.1.5, 2.1.6, 2.3, 2.4_

- [x] 5. Implement ownership transfer and household deletion
  - [x] 5.1 Implement ownership transfer
    - Transfer ownership to existing member
    - Update roles in database (previous owner to member, new member to owner)
    - Create notifications for all members
    - Implement in household.service.ts (partially done, needs notification integration)
    - _Requirements: 1.1.1, 1.1.2, 1.1.3, 1.1.4, 1.1.5_
  
  - [x] 5.2 Implement household deletion
    - Verify owner permission
    - Create notifications for all members
    - Delete all associated data (categories, items, transactions, memberships)
    - Delete household record
    - Implement in household.service.ts (partially done, needs notification and cascade integration)
    - _Requirements: 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5_
  
  - [ ]* 5.3 Write property tests for ownership and deletion
    - **Property 3.7: Ownership transfer**
    - **Property 3.8: Ownership transfer notification**
    - **Property 3.9: Household deletion cascade**
    - **Property 3.10: Household deletion notification**
    - **Validates: Requirements 1.1.1, 1.1.2, 1.1.3, 1.1.4, 1.1.5, 1.2.1, 1.2.2, 1.2.3, 1.2.4_

- [x] 6. Implement notification system
  - [x] 6.1 Implement notification operations
    - Create notification with type and message
    - Get user notifications
    - Mark notification as read
    - Get unread notification count
    - Create notification.repository.ts and notification.service.ts
    - _Requirements: 1.1.4, 1.2.2, 2.1.4_
  
  - [ ]* 6.2 Write unit tests for notification system
    - Test notification creation for different types
    - Test marking notifications as read
    - Test unread count calculation
    - _Requirements: 1.1.4, 1.2.2_

- [x] 7. Checkpoint - Ensure core user/household system works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Implement category management
  - [x] 8.1 Implement category operations
    - Create category with name, color, and household association
    - Store category in database
    - Retrieve categories for household
    - Enforce unique category names per household
    - Create category.repository.ts
    - _Requirements: 3.1, 3.2_
  
  - [x] 8.2 Implement category color assignment
    - Define color palette constant
    - Assign colors to categories
    - _Requirements: 3.5, 11.4_
  
  - [ ]* 8.3 Write property tests for categories
    - **Property 1: Entity creation uniqueness (categories)**
    - **Property 2: Data persistence round-trip (categories)**
    - **Property 5: Category name uniqueness**
    - **Property 8: Category color assignment**
    - **Property 25: Distinct category colors**
    - **Validates: Requirements 3.1, 3.2, 3.5, 11.4_

- [x] 9. Implement grocery item management
  - [x] 9.1 Implement grocery item CRUD operations
    - Create grocery item with all required fields (name, category, restock threshold, unit)
    - Support optional fields (notes, expiration date, initial stock level)
    - Update grocery item metadata
    - Delete grocery item
    - Retrieve grocery items for household
    - Create grocery-item.repository.ts
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 9.2 Write property tests for grocery items
    - **Property 1: Entity creation uniqueness (grocery items)**
    - **Property 2: Data persistence round-trip (grocery items)**
    - **Property 9: Grocery item required fields**
    - **Property 10: Stock level initialization**
    - **Property 11: Item household association**
    - **Property 12: Item metadata update**
    - **Property 13: Item deletion**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [x] 9.3 Implement category assignment
    - Assign category to grocery item
    - Validate category exists
    - _Requirements: 3.3_
  
  - [ ]* 9.4 Write property test for category assignment
    - **Property 6: Category assignment**
    - **Property 7: Items grouped by category**
    - **Validates: Requirements 3.3, 3.4, 5.4_

- [x] 10. Implement stock level tracking
  - [x] 10.1 Implement stock operations
    - Add stock to grocery item
    - Use stock from grocery item
    - Handle negative stock (set to zero with warning)
    - Get current stock level
    - Record stock transactions with user and timestamp
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 10.2 Write property tests for stock operations
    - **Property 14: Stock level retrieval**
    - **Property 15: Stock addition**
    - **Property 16: Stock usage**
    - **Property 17: Stock transaction recording**
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.4, 7.1, 7.2, 7.3_
  
  - [ ]* 10.3 Write unit test for negative stock edge case
    - Test using more stock than available sets level to zero
    - Verify warning is generated
    - _Requirements: 7.4_

- [x] 11. Implement item history tracking
  - [x] 11.1 Implement history operations
    - Get all stock transactions for an item
    - Include user information for each transaction
    - Sort transactions by timestamp (descending)
    - Include item creation timestamp
    - _Requirements: 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5, 6.1.6, 6.1.7_
  
  - [ ]* 11.2 Write property tests for item history
    - **Property 17.1: Item history completeness**
    - **Property 17.2: Transaction user attribution**
    - **Property 17.3: Transaction timestamp accuracy**
    - **Property 17.4: Transaction details preservation**
    - **Property 17.5: Item creation timestamp**
    - **Validates: Requirements 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5, 6.1.6, 6.1.7_

- [x] 12. Checkpoint - Ensure data layer is complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement restock and expiration notifications
  - [x] 13.1 Implement notification queries
    - Identify items with stock level at or below restock threshold
    - Identify items expired or expiring within 3 days
    - Return low stock items list
    - Return expiring items list
    - Calculate notification status for each item
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [x] 13.2 Implement status indicators
    - Add low stock indicator flag to item status
    - Add expiration indicator flag to item status
    - Support multiple indicators on same item
    - _Requirements: 8.6, 8.7, 8.8_
  
  - [ ]* 13.3 Write property tests for notifications
    - **Property 18: Low stock identification**
    - **Property 19: Expiration identification**
    - **Property 20: Notification filtering**
    - **Property 21: Low stock status indicator**
    - **Property 22: Expiration status indicator**
    - **Property 23: Multiple status indicators**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 14. Implement sample data population
  - [x] 14.1 Create sample data generator
    - Define sample categories with colors
    - Define sample grocery items with varied stock levels
    - Include items demonstrating low stock scenarios
    - Include items with expiration dates
    - _Requirements: 10.1, 10.2, 10.3_
  
  - [x] 14.2 Implement first-use detection and population
    - Check if database is empty on initialization
    - Populate with sample data if empty
    - Create default user and household for sample data
    - _Requirements: 10.1, 10.4_
  
  - [ ]* 14.3 Write unit test for sample data population
    - Test empty database triggers sample data creation
    - Verify sample data includes multiple categories
    - Verify sample data includes varied stock levels
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 15. Implement React Context for state management
  - [x] 15.1 Create AppContext with state and actions
    - Define context value interface
    - Implement context provider component
    - Initialize database service in context
    - Load initial data on mount
    - _Requirements: 5.3, 9.3_
  
  - [x] 15.2 Implement state update methods
    - Implement all action methods (switchHousehold, refreshData, etc.)
    - Ensure UI updates within 1 second of data changes
    - Trigger re-renders on state changes
    - _Requirements: 5.3, 11.5_
  
  - [ ]* 15.3 Write integration tests for context
    - Test context initialization
    - Test state updates trigger re-renders
    - Test action methods update state correctly
    - _Requirements: 5.3, 11.5_

- [x] 16. Checkpoint - Ensure state management works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Implement household management UI components
  - [x] 17.1 Create HouseholdSelector component
    - Display list of user's households
    - Show user role for each household
    - Allow switching between households
    - Display reference code for owners
    - Show pending membership request count
    - _Requirements: 1.4, 1.5, 2.1.4_
  
  - [x] 17.2 Create JoinHouseholdForm component
    - Input field for reference code
    - Submit button to request joining
    - Display success/error messages
    - _Requirements: 2.1.1, 2.1.2_
  
  - [x] 17.3 Create MembershipPanel component
    - List pending membership requests (owner only)
    - Show user information for each request
    - Provide accept/reject buttons
    - Allow adding members directly by user ID
    - List current household members
    - Provide transfer ownership option (owner only)
    - Provide delete household option with confirmation (owner only)
    - _Requirements: 1.1.1, 1.2.1, 1.2.5, 2.1.4, 2.1.5, 2.1.7_

- [x] 18. Implement notification UI components
  - [x] 18.1 Create NotificationCenter component
    - Display unread notification count badge
    - List all notifications for current user
    - Show notification type and message
    - Allow marking notifications as read
    - Highlight unread notifications
    - _Requirements: 1.1.4, 1.2.2_

- [x] 19. Implement inventory UI components
  - [x] 19.1 Create InventoryView component
    - Display all grocery items grouped by category
    - Show stock levels with visual indicators
    - Highlight low stock items with distinct color
    - Highlight expired/expiring items with distinct color
    - Show both indicators when item has multiple issues
    - Provide quick actions for adding/using stock
    - _Requirements: 3.4, 5.1, 5.4, 8.6, 8.7, 8.8_
  
  - [x] 19.2 Create CategorySection component
    - Display items within a single category
    - Use category color for visual distinction
    - Show category name and item count
    - _Requirements: 3.4, 3.5, 11.4_
  
  - [x] 19.3 Create GroceryItemCard component
    - Display individual item details
    - Show stock level, unit, and status indicators
    - Provide buttons for stock operations (add/use)
    - Display expiration date if present
    - Provide button to view item history
    - _Requirements: 4.1, 5.1, 6.1.1_

- [x] 20. Implement item management UI components
  - [x] 20.1 Create ItemForm component
    - Form for creating/editing grocery items
    - Category selection dropdown
    - Input fields for all metadata (name, unit, threshold, notes, expiration)
    - Validation for required fields
    - _Requirements: 4.1, 4.5_
  
  - [x] 20.2 Create ItemHistoryModal component
    - Display item creation timestamp
    - List all stock transactions in reverse chronological order
    - Show transaction type (added/used), quantity, user name, timestamp
    - Provide visual distinction between add and use transactions
    - Format dates and times for readability
    - _Requirements: 6.1.1, 6.1.2, 6.1.3, 6.1.4, 6.1.5, 6.1.6, 6.1.7_

- [x] 21. Implement notifications panel UI component
  - [x] 21.1 Create NotificationsPanel component
    - List items needing restock
    - List expired or expiring items
    - Allow filtering by notification type (low stock, expiring, or both)
    - Use distinct colors for different notification types
    - _Requirements: 8.3, 8.4, 8.5, 8.6, 8.7_

- [x] 22. Implement main application layout and styling
  - [x] 22.1 Create main layout component
    - Set up navigation between views
    - Display household selector
    - Display notification center
    - Show main inventory view as default
    - _Requirements: 11.3_
  
  - [x] 22.2 Implement colorful visual styling
    - Apply color palette to categories
    - Apply status colors to indicators
    - Ensure colorful styling throughout interface
    - Ensure visual feedback within 200ms for interactions
    - Display interface in English
    - _Requirements: 11.1, 11.2, 11.4, 11.5_
  
  - [ ]* 22.3 Write UI interaction tests
    - Test visual feedback timing
    - Test color application
    - Test navigation between views
    - _Requirements: 11.5_

- [x] 23. Final integration and testing
  - [x] 23.1 Test complete user workflows
    - Test household creation and management flow
    - Test membership invitation and approval flow
    - Test grocery item creation and management flow
    - Test stock operations and history flow
    - Test notification system flow
    - _Requirements: All_
  
  - [x] 23.2 Test error handling and edge cases
    - Test browser compatibility checks
    - Test IndexedDB unavailable scenario
    - Test database corruption recovery
    - Test negative stock handling
    - _Requirements: 7.4, 9.1, 9.2_
  
  - [x] 23.3 Verify all requirements are met
    - Review requirements document
    - Verify each acceptance criterion is satisfied
    - Test with sample data
    - Test with user-created data
    - _Requirements: All_

- [x] 24. Final checkpoint - Complete application ready
  - Ensure all tests pass, ask the user if questions arise.