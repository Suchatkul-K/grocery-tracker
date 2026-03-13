# Requirements Document: Inventory History Enhancements

## Introduction

This feature enhances the existing inventory history functionality by ensuring complete transaction tracking and providing a user interface to view item history. Currently, when grocery items are created with initial stock, this stock is not recorded as a transaction, resulting in incomplete history. Additionally, while an ItemHistoryModal component exists, it is not integrated into the user interface, preventing users from viewing transaction history.

## Glossary

- **Grocery_Item**: An item tracked in the household inventory with properties including name, stock level, and creation timestamp
- **Stock_Transaction**: A record of stock changes (additions or uses) including quantity, user, timestamp, and transaction type
- **Initial_Stock**: The stock quantity set when a grocery item is first created
- **Item_History**: The complete record of a grocery item including its creation timestamp and all stock transactions
- **Transaction_Type**: Either "add" (stock added) or "use" (stock consumed)
- **Stock_Repository**: The service layer component responsible for stock operations and transaction tracking
- **Grocery_Item_Repository**: The service layer component responsible for grocery item CRUD operations
- **ItemHistoryModal**: The React component that displays item history in a modal dialog

## Requirements

### Requirement 1: Track Initial Stock as Transaction

**User Story:** As a user, I want initial stock amounts to be recorded in the transaction history, so that I have a complete record of all stock changes from the moment an item is created.

#### Acceptance Criteria

1. WHEN a grocery item is created with an initial stock level greater than zero, THE Grocery_Item_Repository SHALL record a stock transaction of type "add" with the initial quantity
2. THE Stock_Repository SHALL create the initial stock transaction with the user who created the item as the transaction user
3. THE Stock_Repository SHALL set the transaction timestamp to match the item creation timestamp
4. WHEN a grocery item is created with zero or no initial stock, THE Grocery_Item_Repository SHALL NOT create a stock transaction
5. THE Initial_Stock transaction SHALL appear in the item history alongside other stock transactions

### Requirement 2: Integrate History Modal into UI

**User Story:** As a user, I want to click a "View History" button on grocery items, so that I can see the complete transaction history in a modal dialog.

#### Acceptance Criteria

1. WHEN a user clicks the "View History" button on a grocery item card, THE InventoryView SHALL open the ItemHistoryModal component
2. THE InventoryView SHALL pass the item ID and item name to the ItemHistoryModal
3. WHEN the ItemHistoryModal is opened, THE ItemHistoryModal SHALL fetch and display the complete item history
4. WHEN a user closes the ItemHistoryModal, THE InventoryView SHALL hide the modal and return to the inventory view
5. THE ItemHistoryModal SHALL display the item creation timestamp
6. THE ItemHistoryModal SHALL display all stock transactions in reverse chronological order (newest first)
7. FOR EACH transaction, THE ItemHistoryModal SHALL display the transaction type, quantity, user name, and timestamp

### Requirement 3: Maintain Transaction History Integrity

**User Story:** As a user, I want the transaction history to accurately reflect all stock changes, so that I can trust the history data for inventory auditing.

#### Acceptance Criteria

1. FOR ALL grocery items created after this feature is implemented, THE Item_History SHALL include the initial stock transaction if initial stock was greater than zero
2. WHEN viewing item history, THE ItemHistoryModal SHALL display transactions sorted by timestamp in descending order
3. THE Stock_Repository SHALL ensure all stock transactions include a valid user ID, item ID, quantity, transaction type, and timestamp
4. WHEN a stock transaction is created, THE Stock_Repository SHALL use the current timestamp for the transaction
5. THE Initial_Stock transaction SHALL use the item creation timestamp, not the current timestamp

### Requirement 4: Handle Edge Cases

**User Story:** As a user, I want the history feature to handle all scenarios gracefully, so that I have a reliable experience regardless of item state.

#### Acceptance Criteria

1. WHEN viewing history for an item with no transactions, THE ItemHistoryModal SHALL display a message indicating no transactions exist
2. WHEN viewing history for an item that was created before this feature was implemented, THE ItemHistoryModal SHALL display only the transactions that exist without errors
3. IF the item history fails to load, THEN THE ItemHistoryModal SHALL display an error message with a retry option
4. WHEN multiple users add or use stock from the same item, THE Item_History SHALL correctly attribute each transaction to the appropriate user
5. THE ItemHistoryModal SHALL handle items with large transaction histories (100+ transactions) without performance degradation

## Notes

### Existing Implementation

The following components already exist and should be leveraged:

- **ItemHistoryModal component** (`components/ItemHistoryModal.tsx`): Fully implemented modal that displays item history with proper formatting, icons, and user information
- **Stock repository** (`services/database/repositories/stock.repository.ts`): Contains `addStock()` method that creates stock transactions and `getItemHistory()` method that retrieves complete history
- **Grocery item repository** (`services/database/repositories/grocery-item.repository.ts`): Contains `createGroceryItem()` method that needs modification to track initial stock
- **GroceryItemCard component** (`components/GroceryItemCard.tsx`): Already has a "View History" button that calls `onViewHistory` callback

### Implementation Approach

The implementation should:

1. Modify `groceryItemRepository.createGroceryItem()` to call `stockRepository.addStock()` when `initialStockLevel > 0`
2. Update `InventoryView` component to manage ItemHistoryModal state (open/close, selected item)
3. Connect the existing "View History" button callback to open the modal
4. Ensure the initial stock transaction uses the item creation timestamp for consistency

### Testing Considerations

Property-based testing should verify:

- Round-trip property: Creating an item with initial stock N should result in a history showing one "add" transaction with quantity N
- Invariant: The sum of all "add" transactions minus all "use" transactions should equal the current stock level
- Ordering property: Transactions in history should always be sorted by timestamp descending
