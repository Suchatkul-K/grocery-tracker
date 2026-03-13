# Product Overview

Grocery Tracker is a local-first web application for tracking household grocery inventory. It runs entirely in the browser with no external servers or cloud dependencies.

## Core Capabilities

- Household management with owner/member roles
- Grocery item tracking with categories and stock levels
- Restock and expiration notifications
- Item history and transaction tracking
- Multi-household support per user

## Key Principles

- **Privacy-first**: All data stored locally in browser (IndexedDB)
- **No external dependencies**: Fully offline-capable
- **Multi-user**: Support for household owners and members
- **Visual and intuitive**: Colorful UI with clear status indicators

## User Roles

- **Owner**: Creates household, manages members, can transfer ownership or delete household
- **Member**: Can view and update inventory, added by owner via reference code

## Data Model

- Users can belong to multiple households
- Each household has categories and grocery items
- Items track stock levels, restock thresholds, and optional expiration dates
- All transactions (add/use stock) are logged with timestamp and user
