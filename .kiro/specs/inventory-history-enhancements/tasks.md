# Implementation Plan: Inventory History Enhancements

## Overview

This implementation plan converts the approved design into discrete coding tasks. The feature enhances inventory history by tracking initial stock as transactions and integrating the ItemHistoryModal into the UI. Each task builds incrementally, with property-based tests validating correctness properties throughout.

## Tasks

- [ ] 1. Modify repository layer for initial stock tracking
  - [x] 1.1 Update StockRepository.addStock to accept optional timestamp parameter
    - Modify the addStock method signature to include `timestamp?: number`
    - Use `timestamp ?? Date.now()` to default to current time if not provided
    - Update the transaction INSERT statement to use the provided/default timestamp
    - Ensure backward compatibility (existing calls without timestamp continue to work)
    - _Requirements: 1.3, 3.4, 3.5_
  
  - [ ]* 1.2 Write property test for timestamp parameter
    - **Property 5: Normal Transactions Use Current Timestamp**
    - **Validates: Requirements 3.4**
    - Generate random stock operations without timestamp parameter
    - Assert transaction timestamp is within 1 second of Date.now()
    - _Requirements: 3.4_
  
  - [x] 1.3 Update GroceryItemRepository.createGroceryItem to accept userId parameter
    - Add `userId: string` parameter to createGroceryItem method signature
    - Update method to capture timestamp once at the start (const now = Date.now())
    - Add conditional logic: if initialStockLevel > 0, call stockRepository.addStock
    - Pass itemId, initialStockLevel, userId, and captured timestamp to addStock
    - Use dynamic import to avoid circular dependency: `await import('./stock.repository')`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.4 Write property test for initial stock transaction completeness
    - **Property 1: Initial Stock Transaction Completeness**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5, 3.1, 3.5**
    - Generate random grocery items with initialStockLevel > 0
    - Create item and fetch history
    - Assert history contains exactly one "add" transaction
    - Assert transaction quantity equals initialStockLevel
    - Assert transaction userId matches creator userId
    - Assert transaction timestamp matches item createdAt
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 3.5_
  
  - [ ]* 1.5 Write property test for zero initial stock
    - **Property 2: Zero Initial Stock Creates No Transaction**
    - **Validates: Requirements 1.4**
    - Generate random grocery items with initialStockLevel = 0 or undefined
    - Create item and fetch history
    - Assert history contains zero transactions
    - _Requirements: 1.4_
  
  - [ ]* 1.6 Write unit tests for repository layer
    - Test createGroceryItem with initialStockLevel = 5 creates transaction with quantity 5
    - Test createGroceryItem with initialStockLevel = 0 creates no transaction
    - Test createGroceryItem with undefined initialStockLevel creates no transaction
    - Test initial stock transaction timestamp matches item createdAt
    - Test addStock without timestamp uses current time
    - Test addStock with timestamp uses provided time
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.4, 3.5_

- [x] 2. Checkpoint - Verify repository layer changes
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Integrate ItemHistoryModal into InventoryView
  - [x] 3.1 Add modal state management to InventoryView component
    - Add state: `selectedItemId: string | null`
    - Add state: `selectedItemName: string`
    - Add state: `showHistoryModal: boolean`
    - Create handleViewHistory function that sets selectedItemId, selectedItemName, and showHistoryModal
    - Create handleCloseHistory function that resets all modal state
    - _Requirements: 2.1, 2.4_
  
  - [x] 3.2 Render ItemHistoryModal in InventoryView
    - Add conditional rendering: `{showHistoryModal && selectedItemId && <ItemHistoryModal ... />}`
    - Pass props: itemId={selectedItemId}, itemName={selectedItemName}, isOpen={showHistoryModal}, onClose={handleCloseHistory}
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 3.3 Update CategorySection to pass itemName to callback
    - Update CategorySectionProps interface: `onViewHistory: (itemId: string, itemName: string) => void`
    - Update GroceryItemCard callback: `onViewHistory={() => onViewHistory(item.id, item.name)}`
    - _Requirements: 2.2_
  
  - [x] 3.4 Update GroceryItemCard to pass itemName to callback
    - Update GroceryItemCardProps interface: `onViewHistory?: (itemId: string, itemName: string) => void`
    - Update handleViewHistory: `onViewHistory(item.id, item.name)`
    - _Requirements: 2.2_
  
  - [ ]* 3.5 Write unit tests for UI integration
    - Test clicking "View History" opens ItemHistoryModal
    - Test modal receives correct itemId and itemName props
    - Test closing modal resets state (selectedItemId = null, showHistoryModal = false)
    - Test modal displays "No transactions yet" for items with no transactions
    - Test modal displays error message when fetch fails
    - _Requirements: 2.1, 2.2, 2.4, 4.1, 4.3_

- [x] 4. Checkpoint - Verify UI integration
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement property-based tests for transaction integrity
  - [ ]* 5.1 Write property test for transaction history ordering
    - **Property 3: Transaction History Ordering**
    - **Validates: Requirements 2.6, 3.2**
    - Generate random item with random sequence of add/use operations
    - Perform operations and fetch history
    - Assert all transactions sorted by timestamp descending
    - Assert for any two consecutive transactions, first.timestamp >= second.timestamp
    - _Requirements: 2.6, 3.2_
  
  - [ ]* 5.2 Write property test for transaction data integrity
    - **Property 4: Transaction Data Integrity**
    - **Validates: Requirements 3.3**
    - Generate random stock transactions
    - Create transactions and fetch from database
    - Assert transaction has non-empty ID
    - Assert transaction has valid groceryItemId that exists
    - Assert transaction has valid userId that exists
    - Assert transactionType is "add" or "use"
    - Assert quantity is positive
    - Assert timestamp is valid Unix timestamp
    - _Requirements: 3.3_
  
  - [ ]* 5.3 Write property test for user attribution correctness
    - **Property 6: User Attribution Correctness**
    - **Validates: Requirements 4.4**
    - Generate random sequence of operations by different users
    - Perform operations and fetch history
    - Assert each transaction.userId matches the user who performed the operation
    - _Requirements: 4.4_
  
  - [ ]* 5.4 Write property test for stock level invariant
    - **Property 7: Stock Level Invariant (Round-Trip)**
    - **Validates: General correctness of stock tracking system**
    - Generate random sequence of add/use operations
    - Perform operations and fetch current stock level
    - Calculate sum of all "add" quantities minus sum of all "use" quantities
    - Assert current stock level equals calculated sum
    - _Requirements: General correctness_

- [ ] 6. Update AppContext to pass userId to createGroceryItem
  - [x] 6.1 Modify createGroceryItem call in AppContext
    - Locate the createGroceryItem call in AppContext
    - Add currentUser.id as the second parameter
    - Ensure currentUser is available in context (should already be)
    - _Requirements: 1.2_
  
  - [ ]* 6.2 Write integration test for end-to-end flow
    - Test: Create item with initial stock, view history, verify transaction appears
    - Test: Create item, add stock, use stock, view history, verify all transactions
    - Test: Multiple users perform operations, verify correct attribution
    - _Requirements: 1.1, 1.2, 1.5, 2.1, 2.3, 4.4_

- [x] 7. Final checkpoint - Verify all functionality
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Test backward compatibility and edge cases
  - [ ]* 8.1 Write tests for backward compatibility
    - Create test items without initial stock transactions (simulate old data)
    - Verify getItemHistory works correctly (returns empty transactions)
    - Verify ItemHistoryModal displays correctly
    - Verify subsequent add/use operations work normally
    - _Requirements: 4.2_
  
  - [ ]* 8.2 Write tests for edge cases
    - Test ItemHistoryModal with 100+ transactions (performance)
    - Test concurrent stock operations (data consistency)
    - Test items created before feature implementation
    - Test error handling in ItemHistoryModal (fetch failures)
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The design uses TypeScript, so all implementation should use TypeScript
- Existing components (ItemHistoryModal, GroceryItemCard) already have the necessary UI elements
- The StockRepository.getItemHistory method already exists and works correctly
- No database schema changes are required

## Test Data Generators

For property-based tests, use these fast-check generators:

```typescript
// Generate random grocery item input
const groceryItemInputArbitrary = fc.record({
  name: fc.string({ minLength: 1, maxLength: 50 }),
  categoryId: fc.uuid(),
  householdId: fc.uuid(),
  restockThreshold: fc.option(fc.double({ min: 0, max: 100 })),
  unit: fc.option(fc.constantFrom('pieces', 'kg', 'liters', 'boxes')),
  notes: fc.option(fc.string({ maxLength: 200 })),
  expirationDate: fc.option(fc.integer({ min: Date.now(), max: Date.now() + 365 * 24 * 60 * 60 * 1000 })),
  initialStockLevel: fc.double({ min: 0, max: 100 }),
});

// Generate random stock operation
const stockOperationArbitrary = fc.record({
  type: fc.constantFrom('add', 'use'),
  quantity: fc.double({ min: 0.1, max: 50 }),
  userId: fc.uuid(),
});

// Generate random sequence of operations
const operationSequenceArbitrary = fc.array(stockOperationArbitrary, { minLength: 1, maxLength: 20 });
```
