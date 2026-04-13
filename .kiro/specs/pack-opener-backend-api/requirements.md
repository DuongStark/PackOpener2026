# Requirements Document

## Introduction

This document specifies the requirements for the Pack Opener Game Backend API, a NestJS-based REST API with WebSocket support for a card pack opening game. The system enables players to register accounts, purchase card packs with virtual coins, open packs to receive random player cards, manage their card inventory, sell cards for coins, and view transaction history. The backend uses Prisma ORM with PostgreSQL for data persistence and Socket.IO for real-time pack opening experiences.

## Glossary

- **System**: The Pack Opener Game Backend API
- **User**: A registered player account with authentication credentials
- **Card**: A static player card entity with metadata (name, overall rating, rarity, position, stats, sell price)
- **Pack**: A purchasable container that yields a fixed number of random cards when opened
- **Pack_Definition**: The configuration template for a pack type (name, price, card count, active status)
- **User_Pack**: An instance of a purchased pack owned by a user (status: PENDING or OPENED)
- **Inventory**: The aggregated collection of cards owned by a user (user_id + card_id + quantity)
- **Transaction**: An immutable record of coin balance changes (types: BUY_PACK, SELL_CARD, INITIAL_CREDIT)
- **Pack_Opening_Result**: An immutable snapshot of cards received from opening a specific user pack
- **Pack_Card_Pool**: The weighted random pool defining which cards can appear in each pack type
- **Coin**: The virtual currency used to purchase packs and earned by selling cards
- **Rarity**: The scarcity classification of a card (e.g., COMMON, RARE, EPIC, LEGENDARY)
- **JWT**: JSON Web Token used for authentication
- **Weighted_Random**: A random selection algorithm where each card has a probability weight
- **Idempotent**: An operation that produces the same result when executed multiple times
- **Atomic_Transaction**: A database operation where all steps succeed or all fail together
- **WebSocket**: A bidirectional communication protocol for real-time events
- **Socket_Room**: A Socket.IO channel for user-specific event broadcasting

## Requirements

### Requirement 1: User Registration and Authentication

**User Story:** As a new player, I want to register an account with email and password, so that I can access the game and maintain my progress.

#### Acceptance Criteria

1. WHEN a registration request is received with valid email and password, THE System SHALL create a new user account with 1000 initial coins
2. WHEN a registration request is received with valid email and password, THE System SHALL create an INITIAL_CREDIT transaction record for the 1000 coins
3. WHEN a registration request is received with an email that already exists, THE System SHALL return a 409 Conflict error
4. THE System SHALL hash passwords using bcrypt with a cost factor of at least 12
5. THE System SHALL validate that passwords contain at least 6 characters
6. THE System SHALL validate that email addresses follow valid email format
7. WHEN a login request is received with valid credentials, THE System SHALL return a JWT token with 24-hour expiration
8. WHEN a login request is received with invalid credentials, THE System SHALL return a 401 Unauthorized error
9. THE System SHALL ensure email addresses are unique in the database
10. THE System SHALL execute user creation and initial coin credit within a single atomic transaction

### Requirement 2: User Profile Management

**User Story:** As a player, I want to view and update my profile information, so that I can manage my account details and track my coin balance.

#### Acceptance Criteria

1. WHEN an authenticated user requests their profile, THE System SHALL return user information including id, email, username, and current coin balance
2. WHEN an unauthenticated request is made to the profile endpoint, THE System SHALL return a 401 Unauthorized error
3. WHEN an authenticated user updates their profile, THE System SHALL validate and save the changes
4. THE System SHALL not expose password hashes in any response
5. THE System SHALL verify JWT token validity before processing profile requests

### Requirement 3: Pack Catalog and Details

**User Story:** As a player, I want to view available packs for purchase with their details and odds, so that I can make informed purchasing decisions.

#### Acceptance Criteria

1. WHEN a pack catalog request is received, THE System SHALL return all pack definitions where is_active equals true
2. THE System SHALL sort pack catalog results by price in ascending order
3. WHEN a pack details request is received for a specific pack, THE System SHALL return pack information including name, price, card_count, and card drop odds
4. THE System SHALL calculate card drop odds from the Pack_Card_Pool weighted probabilities
5. THE System SHALL allow unauthenticated access to pack catalog and details endpoints
6. WHEN a pack details request is received for a non-existent pack, THE System SHALL return a 404 Not Found error

### Requirement 4: Pack Purchase

**User Story:** As a player, I want to purchase card packs using my coins, so that I can open them and receive random cards.

#### Acceptance Criteria

1. WHEN an authenticated user purchases a pack, THE System SHALL verify the user has sufficient coins
2. WHEN an authenticated user purchases a pack with sufficient coins, THE System SHALL deduct the pack price from the user balance
3. WHEN an authenticated user purchases a pack with sufficient coins, THE System SHALL create a User_Pack record with PENDING status
4. WHEN an authenticated user purchases a pack with sufficient coins, THE System SHALL create a BUY_PACK transaction record
5. THE System SHALL execute coin deduction, User_Pack creation, and transaction logging within a single atomic transaction
6. WHEN a user attempts to purchase a pack with insufficient coins, THE System SHALL return a 402 Payment Required error
7. WHEN a user attempts to purchase a pack that is not active, THE System SHALL return a 400 Bad Request error
8. WHEN a user attempts to purchase a non-existent pack, THE System SHALL return a 404 Not Found error
9. THE System SHALL require JWT authentication for pack purchase requests

### Requirement 5: Pack Opening with Weighted Random Distribution

**User Story:** As a player, I want to open purchased packs and receive random cards based on rarity odds, so that I can build my card collection.

#### Acceptance Criteria

1. WHEN an authenticated user opens a User_Pack with PENDING status, THE System SHALL generate random cards using weighted random selection from Pack_Card_Pool
2. WHEN an authenticated user opens a User_Pack with PENDING status, THE System SHALL generate exactly the number of cards specified in the pack definition
3. WHEN an authenticated user opens a User_Pack with PENDING status, THE System SHALL update the User_Pack status to OPENED
4. WHEN an authenticated user opens a User_Pack with PENDING status, THE System SHALL create Pack_Opening_Result records with card snapshots in JSONB format
5. WHEN an authenticated user opens a User_Pack with PENDING status, THE System SHALL update or create Inventory records for each card received
6. WHEN an authenticated user opens a User_Pack that is already OPENED, THE System SHALL return the existing Pack_Opening_Result records
7. THE System SHALL allow duplicate cards to be received in a single pack opening
8. WHEN a user attempts to open a User_Pack they do not own, THE System SHALL return a 403 Forbidden error
9. WHEN a user attempts to open a non-existent User_Pack, THE System SHALL return a 404 Not Found error
10. THE System SHALL require JWT authentication for pack opening requests

### Requirement 6: Inventory Management with Filtering and Pagination

**User Story:** As a player, I want to view my card collection with filtering, sorting, and pagination options, so that I can easily find and manage my cards.

#### Acceptance Criteria

1. WHEN an authenticated user requests their inventory, THE System SHALL return all cards with quantity greater than zero
2. WHERE a rarity filter is provided, THE System SHALL return only cards matching the specified rarity
3. WHERE a position filter is provided, THE System SHALL return only cards matching the specified position
4. WHERE a search term is provided, THE System SHALL return only cards where the name contains the search term
5. WHERE a sort parameter is provided, THE System SHALL sort results by the specified field (overall, name, or rarity)
6. THE System SHALL support pagination with limit parameter (default 20, maximum 100)
7. THE System SHALL support pagination with offset parameter for result skipping
8. THE System SHALL return total count of matching inventory items for pagination
9. THE System SHALL require JWT authentication for inventory requests
10. WHEN an authenticated user requests inventory summary, THE System SHALL return aggregated statistics (total cards, total unique cards, cards by rarity)

### Requirement 7: Inventory Item Details

**User Story:** As a player, I want to view detailed information about a specific card in my inventory, so that I can see its stats and decide whether to keep or sell it.

#### Acceptance Criteria

1. WHEN an authenticated user requests details for a card in their inventory, THE System SHALL return the card metadata and quantity owned
2. WHEN an authenticated user requests details for a card not in their inventory, THE System SHALL return a 404 Not Found error
3. THE System SHALL include card attributes (name, overall, rarity, position, stats, sell_price) in the response
4. THE System SHALL require JWT authentication for inventory detail requests

### Requirement 8: Card Selling

**User Story:** As a player, I want to sell cards from my inventory for coins, so that I can earn currency to purchase more packs.

#### Acceptance Criteria

1. WHEN an authenticated user sells a card, THE System SHALL verify the user owns the card with sufficient quantity
2. WHEN an authenticated user sells a card with sufficient quantity, THE System SHALL decrease the inventory quantity by the sell amount
3. WHEN an authenticated user sells a card with sufficient quantity, THE System SHALL increase the user coin balance by (card sell_price multiplied by quantity)
4. WHEN an authenticated user sells a card with sufficient quantity, THE System SHALL create a SELL_CARD transaction record
5. THE System SHALL execute inventory decrease, coin increase, and transaction logging within a single atomic transaction
6. WHEN the inventory quantity reaches zero after a sell operation, THE System SHALL delete the inventory record
7. WHEN a user attempts to sell a card they do not own, THE System SHALL return a 404 Not Found error
8. WHEN a user attempts to sell more cards than they own, THE System SHALL return a 400 Bad Request error
9. THE System SHALL require JWT authentication for card selling requests
10. THE System SHALL return the coins earned and new balance in the response

### Requirement 9: Transaction History

**User Story:** As a player, I want to view my coin transaction history, so that I can track my earnings and spending.

#### Acceptance Criteria

1. WHEN an authenticated user requests transaction history, THE System SHALL return all transactions for that user
2. THE System SHALL sort transaction history by created_at timestamp in descending order (newest first)
3. WHERE a transaction type filter is provided, THE System SHALL return only transactions matching the specified type
4. THE System SHALL support pagination for transaction history with limit and offset parameters
5. THE System SHALL include transaction details (id, type, amount, balance_after, created_at) in the response
6. THE System SHALL require JWT authentication for transaction history requests
7. THE System SHALL ensure transaction records are immutable (no updates or deletes allowed)

### Requirement 10: Pack Opening History

**User Story:** As a player, I want to view my pack opening history with the cards I received, so that I can review my past openings.

#### Acceptance Criteria

1. WHEN an authenticated user requests pack opening history, THE System SHALL return all opened User_Pack records for that user
2. THE System SHALL include Pack_Opening_Result records with card snapshots for each opened pack
3. THE System SHALL sort pack opening history by opened_at timestamp in descending order (newest first)
4. THE System SHALL support pagination for pack opening history with limit and offset parameters
5. THE System SHALL include pack details (pack name, opened_at) and card details from snapshots in the response
6. THE System SHALL require JWT authentication for pack opening history requests
7. THE System SHALL ensure Pack_Opening_Result records are immutable (no updates or deletes allowed)

### Requirement 11: Card Catalog

**User Story:** As a player, I want to browse all available cards in the game with filtering options, so that I can learn about cards I might receive.

#### Acceptance Criteria

1. WHEN a card catalog request is received, THE System SHALL return all cards in the database
2. WHERE a rarity filter is provided, THE System SHALL return only cards matching the specified rarity
3. WHERE a position filter is provided, THE System SHALL return only cards matching the specified position
4. WHERE a search term is provided, THE System SHALL return only cards where the name contains the search term
5. THE System SHALL support sorting by overall rating, name, or rarity
6. THE System SHALL support pagination with limit and offset parameters
7. THE System SHALL allow unauthenticated access to the card catalog endpoint
8. WHEN a card details request is received for a specific card, THE System SHALL return complete card information including all stats

### Requirement 12: User Pack Listing

**User Story:** As a player, I want to view all packs I have purchased, so that I can see which packs are available to open.

#### Acceptance Criteria

1. WHEN an authenticated user requests their pack list, THE System SHALL return all User_Pack records for that user
2. THE System SHALL include pack status (PENDING or OPENED) for each User_Pack
3. THE System SHALL include pack definition details (name, card_count) for each User_Pack
4. THE System SHALL support filtering by status (PENDING or OPENED)
5. THE System SHALL sort user packs by purchased_at timestamp in descending order (newest first)
6. THE System SHALL support pagination with limit and offset parameters
7. THE System SHALL require JWT authentication for user pack listing requests

### Requirement 13: Health Check

**User Story:** As a system administrator, I want a health check endpoint, so that I can monitor the API and database connectivity.

#### Acceptance Criteria

1. WHEN a health check request is received, THE System SHALL return the application status
2. WHEN a health check request is received, THE System SHALL verify database connectivity
3. WHEN the database is connected, THE System SHALL return status "ok" with database "connected"
4. WHEN the database is not connected, THE System SHALL return status "error" with database "disconnected"
5. THE System SHALL allow unauthenticated access to the health check endpoint

### Requirement 14: WebSocket Pack Opening Real-Time Experience

**User Story:** As a player, I want to experience pack opening in real-time with card reveals, so that I can enjoy the excitement of discovering cards one by one.

#### Acceptance Criteria

1. WHEN a user connects to the WebSocket /game namespace, THE System SHALL authenticate the connection using JWT token
2. WHEN a user connects with an invalid JWT token, THE System SHALL reject the connection
3. WHEN an authenticated user emits pack:open_request with a User_Pack id, THE System SHALL validate pack ownership
4. WHEN an authenticated user opens a pack via WebSocket, THE System SHALL emit pack:open_started event to the user room
5. WHEN an authenticated user opens a pack via WebSocket, THE System SHALL emit pack:card_revealed events for each card with 500ms delay between reveals
6. WHEN an authenticated user opens a pack via WebSocket, THE System SHALL emit pack:open_completed event after all cards are revealed
7. WHEN an authenticated user opens a pack via WebSocket, THE System SHALL emit balance:updated event with new coin balance
8. THE System SHALL create a Socket room for each user using format "room-{userId}"
9. THE System SHALL continue pack opening processing if the client disconnects during opening
10. WHEN a WebSocket error occurs, THE System SHALL emit an error event with a specific error code
11. THE System SHALL rate limit WebSocket emissions to 10 events per second per user
12. WHEN a user opens an already OPENED pack via WebSocket, THE System SHALL return existing results without re-randomizing

### Requirement 15: Input Validation and Security

**User Story:** As a system administrator, I want all API inputs validated and secured, so that the system is protected from malicious requests.

#### Acceptance Criteria

1. THE System SHALL validate all request body parameters using class-validator decorators
2. THE System SHALL validate all query parameters for type and format correctness
3. THE System SHALL validate all path parameters for type and format correctness
4. WHEN invalid input is received, THE System SHALL return a 400 Bad Request error with validation details
5. THE System SHALL sanitize all string inputs to prevent injection attacks
6. THE System SHALL implement rate limiting on authentication endpoints to prevent brute-force attacks
7. THE System SHALL not expose sensitive information (passwords, internal errors) in error responses
8. THE System SHALL log all authentication failures with user identifier and timestamp

### Requirement 16: Global Error Handling

**User Story:** As a developer, I want consistent error responses across all endpoints, so that clients can handle errors uniformly.

#### Acceptance Criteria

1. THE System SHALL use a global exception filter for all HTTP exceptions
2. WHEN an error occurs, THE System SHALL return a consistent error response format with statusCode, message, and timestamp
3. WHEN a validation error occurs, THE System SHALL include validation details in the error response
4. WHEN an unexpected error occurs, THE System SHALL log the full error stack trace
5. WHEN an unexpected error occurs, THE System SHALL return a 500 Internal Server Error without exposing internal details
6. THE System SHALL include a request ID in error responses for tracing

### Requirement 17: Request Logging and Observability

**User Story:** As a system administrator, I want comprehensive request logging, so that I can monitor system behavior and troubleshoot issues.

#### Acceptance Criteria

1. THE System SHALL log all incoming HTTP requests with method, path, and request ID
2. THE System SHALL log all outgoing HTTP responses with status code and duration
3. THE System SHALL include user ID in logs for authenticated requests
4. THE System SHALL log all database transaction starts and completions
5. THE System SHALL log all pack opening operations with user ID, pack ID, and cards received
6. THE System SHALL log all coin balance changes with user ID, amount, and transaction type
7. THE System SHALL use structured logging format (JSON) for log aggregation

### Requirement 18: Database Schema and Constraints

**User Story:** As a developer, I want a well-defined database schema with proper constraints, so that data integrity is maintained.

#### Acceptance Criteria

1. THE System SHALL use UUID as primary key for all tables
2. THE System SHALL enforce unique constraint on users.email
3. THE System SHALL enforce unique constraint on cards.sofifa_id
4. THE System SHALL enforce unique constraint on inventory (user_id, card_id) combination
5. THE System SHALL set default value of 1000 for users.coin_balance
6. THE System SHALL use enum type for user_packs.status (PENDING, OPENED)
7. THE System SHALL use enum type for transactions.type (BUY_PACK, SELL_CARD, INITIAL_CREDIT)
8. THE System SHALL use JSONB type for pack_opening_results.card_snapshot
9. THE System SHALL enforce foreign key constraints for all relationships
10. THE System SHALL set created_at and updated_at timestamps automatically

### Requirement 19: Performance Requirements

**User Story:** As a player, I want fast API responses, so that I can enjoy a smooth gaming experience.

#### Acceptance Criteria

1. WHEN a read endpoint is called under normal load, THE System SHALL respond within 300ms at P95
2. WHEN a pack opening endpoint is called under normal load, THE System SHALL respond within 700ms at P95
3. THE System SHALL use database indexes on frequently queried fields (user_id, card_id, status)
4. THE System SHALL use connection pooling for database connections
5. THE System SHALL implement query optimization for inventory listing with filters

### Requirement 20: Route Ordering for NestJS

**User Story:** As a developer, I want proper route ordering in controllers, so that specific routes are not shadowed by parameterized routes.

#### Acceptance Criteria

1. THE System SHALL define /inventory/summary route before /inventory/:cardId route in the controller
2. THE System SHALL define all static routes before parameterized routes in all controllers
3. WHEN route ordering conflicts exist, THE System SHALL prioritize more specific routes first

