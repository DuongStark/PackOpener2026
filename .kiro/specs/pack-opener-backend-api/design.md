# Design Document: Pack Opener Game Backend API

## Overview

The Pack Opener Game Backend API is a NestJS-based REST API with WebSocket support that enables players to experience a card pack opening game. The system provides complete functionality for user authentication, pack purchasing, card collection management, and real-time pack opening experiences.

### System Architecture

The application follows a modular monolithic architecture using NestJS framework patterns:

- **Presentation Layer**: REST controllers and WebSocket gateways handling HTTP/WS requests
- **Business Logic Layer**: Service classes implementing game mechanics and business rules
- **Data Access Layer**: Prisma ORM managing PostgreSQL database interactions
- **Cross-Cutting Concerns**: Guards, interceptors, filters, and decorators for authentication, logging, and error handling

### Technology Stack

- **Framework**: NestJS 11.x (Node.js/TypeScript)
- **Database**: PostgreSQL 14+ with Prisma ORM 7.x
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Real-time**: Socket.IO for WebSocket communication
- **Validation**: class-validator and class-transformer
- **Testing**: Jest for unit and e2e tests

### Key Design Principles

1. **Atomic Transactions**: All coin-related operations execute within database transactions
2. **Idempotency**: Pack opening operations return cached results for already-opened packs
3. **Immutability**: Transaction and pack opening result records are never modified after creation
4. **Separation of Concerns**: Clear boundaries between modules with single responsibility
5. **Security First**: JWT authentication, input validation, and secure password storage: Pack Opener Game Backend API

## Overview

The Pack Opener Game Backend API is a NestJS-based REST API with WebSocket support that enables players to experience a card pack opening game. The system provides authentication, pack purchasing, real-time pack opening with weighted random card distribution, inventory management, card selling, and transaction history tracking.

### Core Features

- **Authentication**: JWT-based user registration and login
- **Pack Management**: Browse, purchase, and open card packs
- **Real-Time Experience**: WebSocket-based pack opening with card-by-card reveals
- **Inventory System**: View, filter, sort, and manage card collections
- **Economy**: Virtual coin system with buying and selling mechanics
- **Transaction Tracking**: Immutable audit trail of all coin movements
- **Weighted Random**: Fair card distribution based on rarity probabilities

### Technology Stack

- **Framework**: NestJS (Node.js)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **WebSocket**: Socket.IO
- **Validation**: class-validator
- **Password Hashing**: bcrypt

## Architecture

### High-Level Architecture

```mermaid
graph TB
    Client[Client Application]
    Gateway[API Gateway / Load Balancer]
    
    subgraph "NestJS Application"
        HTTP[HTTP Controllers]
        WS[WebSocket Gateway]
        Auth[Auth Middleware]
        Services[Business Services]
        Prisma[Prisma ORM]
    end
    
    DB[(PostgreSQL Database)]
    
    Client -->|HTTP/REST| Gateway
    Client -->|WebSocket| Gateway
    Gateway --> HTTP
    Gateway --> WS
    HTTP --> Auth
    WS --> Auth
    Auth --> Services
    Services --> Prisma
    Prisma --> DB
```

### Module Structure

The application follows NestJS modular architecture with clear separation of concerns:

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── common/                          # Cross-cutting concerns
│   ├── constants/
│   │   └── enum.ts                  # Shared enums
│   ├── decorators/
│   │   └── current-user.decorator.ts # Extract user from JWT
│   ├── filters/
│   │   └── http-exception.filter.ts  # Global error handling
│   ├── guards/
│   │   └── jwt-auth.guard.ts        # JWT authentication guard
│   └── interceptors/
│       └── logging.interceptor.ts    # Request/response logging
├── core/                            # Core infrastructure
│   ├── config/
│   │   ├── config.module.ts
│   │   └── config.service.ts        # Environment configuration
│   ├── database/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts        # Prisma client wrapper
│   └── random/
│       ├── random.module.ts
│       └── random.service.ts        # Weighted random algorithm
└── modules/                         # Domain modules
    ├── auth/                        # Authentication
    ├── user/                        # User management
    ├── pack/                        # Pack operations
    ├── card/                        # Card catalog
    ├── inventory/                   # Inventory management
    └── transaction/                 # Transaction history
```

### Request Flow

#### HTTP Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Guard
    participant Service
    participant Prisma
    participant DB
    
    Client->>Controller: HTTP Request
    Controller->>Guard: Validate JWT
    Guard->>Controller: User Context
    Controller->>Service: Business Logic
    Service->>Prisma: Database Query
    Prisma->>DB: SQL Query
    DB->>Prisma: Result
    Prisma->>Service: Mapped Data
    Service->>Controller: Response Data
    Controller->>Client: HTTP Response
```

#### WebSocket Event Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Service
    participant DB
    
    Client->>Gateway: Connect with JWT
    Gateway->>Auth: Validate Token
    Auth->>Gateway: User Context
    Gateway->>Client: Connection Established
    
    Client->>Gateway: pack:open_request
    Gateway->>Service: Open Pack
    Service->>DB: Begin Transaction
    Service->>Service: Weighted Random
    Service->>DB: Save Results
    DB->>Service: Commit
    Service->>Gateway: Cards Data
    Gateway->>Client: pack:open_started
    loop For each card
        Gateway->>Client: pack:card_revealed
        Note over Gateway,Client: 500ms delay
    end
    Gateway->>Client: pack:open_completed
    Gateway->>Client: balance:updated
```

## Components and Interfaces

### 1. Authentication Module

**Responsibilities:**
- User registration with email/password
- User login with JWT token generation
- Password hashing and verification
- Token validation

**Key Components:**

```typescript
// AuthService
class AuthService {
  async register(email: string, password: string): Promise<User>
  async login(email: string, password: string): Promise<{ accessToken: string }>
  async validateUser(email: string, password: string): Promise<User | null>
  async generateToken(user: User): Promise<string>
}

// AuthController
@Controller('auth')
class AuthController {
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<UserResponse>
  
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResponse>
}
```

**DTOs:**

```typescript
class RegisterDto {
  @IsEmail()
  email: string;
  
  @MinLength(6)
  password: string;
  
  @IsOptional()
  @IsString()
  username?: string;
}

class LoginDto {
  @IsEmail()
  email: string;
  
  @IsString()
  password: string;
}
```

### 2. User Module

**Responsibilities:**
- User profile retrieval
- User profile updates
- Coin balance management

**Key Components:**

```typescript
// UserService
class UserService {
  async findById(id: string): Promise<User>
  async findByEmail(email: string): Promise<User | null>
  async updateProfile(id: string, data: UpdateUserDto): Promise<User>
  async updateCoinBalance(id: string, amount: number): Promise<User>
}

// UserController
@Controller('users')
class UserController {
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: User): Promise<UserResponse>
  
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<UserResponse>
}
```

### 3. Pack Module

**Responsibilities:**
- Pack catalog listing
- Pack purchase with coin deduction
- Pack opening with weighted random
- User pack listing

**Key Components:**

```typescript
// PackService
class PackService {
  async getActivePacks(): Promise<PackDefinition[]>
  async getPackDetails(packId: string): Promise<PackWithOdds>
  async purchasePack(userId: string, packId: string): Promise<UserPack>
  async openPack(userId: string, userPackId: string): Promise<PackOpeningResult[]>
  async getUserPacks(userId: string, status?: PackStatus): Promise<UserPack[]>
}

// PackController
@Controller('packs')
class PackController {
  @Get()
  async getActivePacks(): Promise<PackDefinitionResponse[]>
  
  @Get(':id')
  async getPackDetails(@Param('id') id: string): Promise<PackDetailsResponse>
  
  @Post(':id/buy')
  @UseGuards(JwtAuthGuard)
  async purchasePack(@CurrentUser() user: User, @Param('id') packId: string): Promise<PurchaseResponse>
  
  @Post('user-packs/:id/open')
  @UseGuards(JwtAuthGuard)
  async openPack(@CurrentUser() user: User, @Param('id') userPackId: string): Promise<OpenPackResponse>
}
```

### 4. Inventory Module

**Responsibilities:**
- Inventory listing with filters
- Inventory item details
- Inventory summary statistics
- Card selling

**Key Components:**

```typescript
// InventoryService
class InventoryService {
  async getInventory(userId: string, filters: InventoryFilters): Promise<PaginatedInventory>
  async getInventoryItem(userId: string, cardId: string): Promise<InventoryItem>
  async getInventorySummary(userId: string): Promise<InventorySummary>
  async sellCard(userId: string, cardId: string, quantity: number): Promise<SellResult>
  async addCards(userId: string, cards: CardQuantity[]): Promise<void>
  async removeCards(userId: string, cardId: string, quantity: number): Promise<void>
}

// InventoryController
@Controller('inventory')
@UseGuards(JwtAuthGuard)
class InventoryController {
  @Get()
  async getInventory(@CurrentUser() user: User, @Query() filters: InventoryFiltersDto): Promise<InventoryResponse>
  
  @Get('summary')
  async getSummary(@CurrentUser() user: User): Promise<InventorySummaryResponse>
  
  @Get(':cardId')
  async getInventoryItem(@CurrentUser() user: User, @Param('cardId') cardId: string): Promise<InventoryItemResponse>
  
  @Post('sell')
  async sellCard(@CurrentUser() user: User, @Body() dto: SellCardDto): Promise<SellResponse>
}
```

### 5. Transaction Module

**Responsibilities:**
- Transaction history retrieval
- Transaction creation (internal)
- Pack opening history

**Key Components:**

```typescript
// TransactionService
class TransactionService {
  async createTransaction(userId: string, type: TransactionType, amount: number, balanceAfter: number, metadata?: any): Promise<Transaction>
  async getTransactionHistory(userId: string, filters: TransactionFilters): Promise<PaginatedTransactions>
  async getPackOpeningHistory(userId: string, pagination: Pagination): Promise<PaginatedPackOpenings>
}

// TransactionController
@Controller('transactions')
@UseGuards(JwtAuthGuard)
class TransactionController {
  @Get()
  async getTransactionHistory(@CurrentUser() user: User, @Query() filters: TransactionFiltersDto): Promise<TransactionHistoryResponse>
  
  @Get('pack-openings')
  async getPackOpeningHistory(@CurrentUser() user: User, @Query() pagination: PaginationDto): Promise<PackOpeningHistoryResponse>
}
```

### 6. Card Module

**Responsibilities:**
- Card catalog listing
- Card details retrieval
- Card search and filtering

**Key Components:**

```typescript
// CardService
class CardService {
  async getCards(filters: CardFilters): Promise<PaginatedCards>
  async getCardById(cardId: string): Promise<Card>
  async searchCards(query: string): Promise<Card[]>
}

// CardController
@Controller('cards')
class CardController {
  @Get()
  async getCards(@Query() filters: CardFiltersDto): Promise<CardCatalogResponse>
  
  @Get(':id')
  async getCardDetails(@Param('id') id: string): Promise<CardDetailsResponse>
}
```

### 7. Random Service (Core)

**Responsibilities:**
- Weighted random selection algorithm
- Card pool probability calculations

**Key Components:**

```typescript
// RandomService
class RandomService {
  weightedRandom<T>(items: WeightedItem<T>[]): T
  selectMultiple<T>(items: WeightedItem<T>[], count: number): T[]
  calculateOdds(pool: PackCardPool[]): CardOdds[]
}

interface WeightedItem<T> {
  item: T;
  weight: number;
}
```

### 8. WebSocket Gateway

**Responsibilities:**
- Real-time pack opening experience
- User-specific event broadcasting
- Connection authentication
- Rate limiting

**Key Components:**

```typescript
// GameGateway
@WebSocketGateway({ namespace: '/game' })
class GameGateway {
  @WebSocketServer()
  server: Server;
  
  async handleConnection(client: Socket): Promise<void>
  async handleDisconnect(client: Socket): Promise<void>
  
  @SubscribeMessage('pack:open_request')
  async handlePackOpen(client: Socket, payload: OpenPackPayload): Promise<void>
  
  private async emitCardReveal(userId: string, card: Card, index: number): Promise<void>
  private async emitBalanceUpdate(userId: string, balance: number): Promise<void>
}
```

## Data Models

### Database Schema

```mermaid
erDiagram
    users ||--o{ user_packs : owns
    users ||--o{ inventory : has
    users ||--o{ transactions : records
    pack_definitions ||--o{ user_packs : defines
    pack_definitions ||--o{ pack_card_pool : contains
    cards ||--o{ inventory : stored_in
    cards ||--o{ pack_card_pool : available_in
    user_packs ||--|| pack_opening_results : produces
    
    users {
        uuid id PK
        string email UK
        string password_hash
        string username
        int coin_balance
        timestamp created_at
        timestamp updated_at
    }
    
    cards {
        uuid id PK
        int sofifa_id UK
        string name
        int overall
        string rarity
        string position
        jsonb stats
        int sell_price
        timestamp created_at
    }
    
    pack_definitions {
        uuid id PK
        string name
        int price
        int card_count
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    user_packs {
        uuid id PK
        uuid user_id FK
        uuid pack_id FK
        string status
        timestamp purchased_at
        timestamp opened_at
    }
    
    pack_opening_results {
        uuid id PK
        uuid user_pack_id FK
        uuid card_id FK
        jsonb card_snapshot
        int reveal_order
        timestamp created_at
    }
    
    inventory {
        uuid id PK
        uuid user_id FK
        uuid card_id FK
        int quantity
        timestamp created_at
        timestamp updated_at
    }
    
    transactions {
        uuid id PK
        uuid user_id FK
        string type
        int amount
        int balance_after
        jsonb metadata
        timestamp created_at
    }
    
    pack_card_pool {
        uuid id PK
        uuid pack_id FK
        uuid card_id FK
        int weight
        timestamp created_at
    }
```

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  passwordHash  String   @map("password_hash")
  username      String?
  coinBalance   Int      @default(1000) @map("coin_balance")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  userPacks     UserPack[]
  inventory     Inventory[]
  transactions  Transaction[]
  
  @@map("users")
}

model Card {
  id          String   @id @default(uuid()) @db.Uuid
  sofifaId    Int      @unique @map("sofifa_id")
  name        String
  overall     Int
  rarity      String
  position    String
  stats       Json
  sellPrice   Int      @map("sell_price")
  createdAt   DateTime @default(now()) @map("created_at")
  
  inventory   Inventory[]
  packCardPool PackCardPool[]
  
  @@map("cards")
  @@index([rarity])
  @@index([position])
}

model PackDefinition {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  price       Int
  cardCount   Int      @map("card_count")
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  userPacks   UserPack[]
  packCardPool PackCardPool[]
  
  @@map("pack_definitions")
  @@index([isActive])
}

enum PackStatus {
  PENDING
  OPENED
}

model UserPack {
  id          String     @id @default(uuid()) @db.Uuid
  userId      String     @map("user_id") @db.Uuid
  packId      String     @map("pack_id") @db.Uuid
  status      PackStatus @default(PENDING)
  purchasedAt DateTime   @default(now()) @map("purchased_at")
  openedAt    DateTime?  @map("opened_at")
  
  user        User       @relation(fields: [userId], references: [id])
  pack        PackDefinition @relation(fields: [packId], references: [id])
  openingResults PackOpeningResult[]
  
  @@map("user_packs")
  @@index([userId, status])
}

model PackOpeningResult {
  id           String   @id @default(uuid()) @db.Uuid
  userPackId   String   @map("user_pack_id") @db.Uuid
  cardId       String   @map("card_id") @db.Uuid
  cardSnapshot Json     @map("card_snapshot")
  revealOrder  Int      @map("reveal_order")
  createdAt    DateTime @default(now()) @map("created_at")
  
  userPack     UserPack @relation(fields: [userPackId], references: [id])
  
  @@map("pack_opening_results")
  @@index([userPackId])
}

model Inventory {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  cardId    String   @map("card_id") @db.Uuid
  quantity  Int      @default(1)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  user      User     @relation(fields: [userId], references: [id])
  card      Card     @relation(fields: [cardId], references: [id])
  
  @@unique([userId, cardId])
  @@map("inventory")
  @@index([userId])
}

enum TransactionType {
  BUY_PACK
  SELL_CARD
  INITIAL_CREDIT
}

model Transaction {
  id           String          @id @default(uuid()) @db.Uuid
  userId       String          @map("user_id") @db.Uuid
  type         TransactionType
  amount       Int
  balanceAfter Int             @map("balance_after")
  metadata     Json?
  createdAt    DateTime        @default(now()) @map("created_at")
  
  user         User            @relation(fields: [userId], references: [id])
  
  @@map("transactions")
  @@index([userId, createdAt])
  @@index([type])
}

model PackCardPool {
  id        String   @id @default(uuid()) @db.Uuid
  packId    String   @map("pack_id") @db.Uuid
  cardId    String   @map("card_id") @db.Uuid
  weight    Int
  createdAt DateTime @default(now()) @map("created_at")
  
  pack      PackDefinition @relation(fields: [packId], references: [id])
  card      Card     @relation(fields: [cardId], references: [id])
  
  @@unique([packId, cardId])
  @@map("pack_card_pool")
  @@index([packId])
}
```

### Database Indexes

**Performance-Critical Indexes:**

1. `users.email` - Unique index for login lookups
2. `cards.sofifa_id` - Unique index for external ID mapping
3. `cards.rarity` - Filter index for card catalog
4. `cards.position` - Filter index for card catalog
5. `pack_definitions.is_active` - Filter index for active packs
6. `user_packs(user_id, status)` - Composite index for user pack queries
7. `inventory.user_id` - Index for inventory lookups
8. `inventory(user_id, card_id)` - Unique composite index
9. `transactions(user_id, created_at)` - Composite index for history queries
10. `pack_card_pool.pack_id` - Index for weighted random selection

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before defining properties, I need to analyze the acceptance criteria to determine which are suitable for property-based testing.



## Architecture

### Module Structure

The application is organized into the following NestJS modules:

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── core/                            # Core infrastructure modules
│   ├── config/                      # Configuration management
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   ├── database/                    # Database connection
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   └── random/                      # Weighted random service
│       ├── random.module.ts
│       └── random.service.ts
├── common/                          # Shared utilities
│   ├── decorators/                  # Custom decorators
│   │   └── current-user.decorator.ts
│   ├── guards/                      # Authentication guards
│   │   └── jwt-auth.guard.ts
│   ├── filters/                     # Exception filters
│   │   └── http-exception.filter.ts
│   ├── interceptors/                # Request interceptors
│   │   └── logging.interceptor.ts
│   └── constants/                   # Enums and constants
│       └── enum.ts
└── modules/                         # Feature modules
    ├── auth/                        # Authentication
    │   ├── auth.module.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   ├── strategies/
    │   │   └── jwt.strategy.ts
    │   └── dto/
    │       ├── register.dto.ts
    │       ├── login.dto.ts
    │       └── auth-response.dto.ts
    ├── user/                        # User management
    │   ├── user.module.ts
    │   ├── user.controller.ts
    │   ├── user.service.ts
    │   └── dto/
    │       └── user-profile.dto.ts
    ├── pack/                        # Pack management
    │   ├── pack.module.ts
    │   ├── pack.controller.ts
    │   ├── pack.service.ts
    │   └── dto/
    │       ├── pack-list.dto.ts
    │       ├── pack-details.dto.ts
    │       └── buy-pack.dto.ts
    ├── user-pack/                   # User pack operations
    │   ├── user-pack.module.ts
    │   ├── user-pack.controller.ts
    │   ├── user-pack.service.ts
    │   └── dto/
    │       ├── user-pack-list.dto.ts
    │       └── open-pack.dto.ts
    ├── card/                        # Card catalog
    │   ├── card.module.ts
    │   ├── card.controller.ts
    │   ├── card.service.ts
    │   └── dto/
    │       ├── card-list.dto.ts
    │       └── card-details.dto.ts
    ├── inventory/                   # Inventory management
    │   ├── inventory.module.ts
    │   ├── inventory.controller.ts
    │   ├── inventory.service.ts
    │   └── dto/
    │       ├── inventory-list.dto.ts
    │       ├── inventory-summary.dto.ts
    │       └── sell-card.dto.ts
    ├── transaction/                 # Transaction history
    │   ├── transaction.module.ts
    │   ├── transaction.controller.ts
    │   ├── transaction.service.ts
    │   └── dto/
    │       └── transaction-list.dto.ts
    ├── history/                     # Pack opening history
    │   ├── history.module.ts
    │   ├── history.controller.ts
    │   ├── history.service.ts
    │   └── dto/
    │       └── opening-history.dto.ts
    ├── health/                      # Health check
    │   ├── health.module.ts
    │   └── health.controller.ts
    └── game-gateway/                # WebSocket gateway
        ├── game-gateway.module.ts
        ├── game.gateway.ts
        └── dto/
            └── pack-open-request.dto.ts
```

### Module Dependencies

```mermaid
graph TD
    A[AppModule] --> B[CoreModule]
    A --> C[CommonModule]
    A --> D[AuthModule]
    A --> E[UserModule]
    A --> F[PackModule]
    A --> G[UserPackModule]
    A --> H[CardModule]
    A --> I[InventoryModule]
    A --> J[TransactionModule]
    A --> K[HistoryModule]
    A --> L[HealthModule]
    A --> M[GameGatewayModule]
    
    B --> N[ConfigModule]
    B --> O[PrismaModule]
    B --> P[RandomModule]
    
    D --> E
    D --> J
    G --> F
    G --> H
    G --> I
    G --> J
    G --> P
    I --> H
    I --> J
    K --> G
    M --> G
    M --> D
```

### Request Flow

#### REST API Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Controller
    participant Guard
    participant Service
    participant Prisma
    participant DB

    Client->>Controller: HTTP Request
    Controller->>Guard: Validate JWT
    Guard-->>Controller: User Context
    Controller->>Service: Business Logic
    Service->>Prisma: Query/Mutation
    Prisma->>DB: SQL
    DB-->>Prisma: Result
    Prisma-->>Service: Data
    Service-->>Controller: Response DTO
    Controller-->>Client: HTTP Response
```

#### WebSocket Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway
    participant Guard
    participant Service
    participant Prisma
    participant DB

    Client->>Gateway: WS Connect (JWT)
    Gateway->>Guard: Validate JWT
    Guard-->>Gateway: User Context
    Gateway-->>Client: Connected
    
    Client->>Gateway: pack:open_request
    Gateway->>Service: Open Pack
    Service->>Prisma: Transaction Start
    Service->>Prisma: Random Cards
    Service->>Prisma: Update Inventory
    Service->>Prisma: Transaction Commit
    Prisma-->>Service: Results
    
    loop For Each Card
        Gateway-->>Client: pack:card_revealed
    end
    
    Gateway-->>Client: pack:open_completed
    Gateway-->>Client: balance:updated
```



## Components and Interfaces

### Core Components

#### PrismaService

Manages database connections and provides Prisma client instance.

```typescript
class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void>
  async onModuleDestroy(): Promise<void>
  async enableShutdownHooks(app: INestApplication): Promise<void>
}
```

#### ConfigService

Provides type-safe access to environment variables.

```typescript
class ConfigService {
  get<T>(key: string): T
  getDatabaseUrl(): string
  getJwtSecret(): string
  getJwtExpiresIn(): string
  getPort(): number
}
```

#### RandomService

Implements weighted random selection algorithm for card drops.

```typescript
class RandomService {
  /**
   * Selects items from a weighted pool
   * @param pool Array of items with weight property
   * @param count Number of items to select
   * @returns Array of selected items (duplicates allowed)
   */
  selectWeighted<T extends { weight: number }>(pool: T[], count: number): T[]
}
```

**Algorithm**: Weighted Random Selection
1. Calculate total weight: `totalWeight = sum(pool.map(item => item.weight))`
2. For each selection:
   - Generate random number: `random = Math.random() * totalWeight`
   - Iterate through pool accumulating weights
   - Select item when accumulated weight >= random
3. Allow duplicates (do not remove selected items from pool)

### Authentication Components

#### JwtStrategy

Passport strategy for JWT token validation.

```typescript
class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService, userService: UserService)
  async validate(payload: JwtPayload): Promise<User>
}

interface JwtPayload {
  sub: string      // User ID
  email: string
  iat: number      // Issued at
  exp: number      // Expiration
}
```

#### JwtAuthGuard

Guard that protects routes requiring authentication.

```typescript
@Injectable()
class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>
  handleRequest(err: any, user: any, info: any): any
}
```

#### CurrentUser Decorator

Extracts authenticated user from request context.

```typescript
const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest()
    return request.user
  }
)
```

### Service Layer Interfaces

#### AuthService

```typescript
class AuthService {
  async register(email: string, password: string): Promise<AuthResponse>
  async login(email: string, password: string): Promise<AuthResponse>
  async validateUser(email: string, password: string): Promise<User | null>
  private async hashPassword(password: string): Promise<string>
  private async comparePassword(password: string, hash: string): Promise<boolean>
  private generateToken(user: User): string
}

interface AuthResponse {
  accessToken: string
  user: {
    id: string
    email: string
    username: string
    coinBalance: number
  }
}
```

#### UserService

```typescript
class UserService {
  async findById(id: string): Promise<User | null>
  async findByEmail(email: string): Promise<User | null>
  async create(data: CreateUserDto): Promise<User>
  async updateProfile(id: string, data: UpdateUserDto): Promise<User>
  async getProfile(id: string): Promise<UserProfile>
}
```

#### PackService

```typescript
class PackService {
  async findAllActive(): Promise<PackDefinition[]>
  async findById(id: string): Promise<PackDefinition | null>
  async getPackDetails(id: string): Promise<PackDetailsDto>
  async calculateDropOdds(packId: string): Promise<CardDropOdds[]>
}

interface CardDropOdds {
  cardId: string
  cardName: string
  rarity: string
  probability: number  // Percentage (0-100)
}
```

#### UserPackService

```typescript
class UserPackService {
  async purchasePack(userId: string, packId: string): Promise<UserPack>
  async openPack(userId: string, userPackId: string): Promise<OpenPackResult>
  async findUserPacks(userId: string, filters: UserPackFilters): Promise<PaginatedUserPacks>
  private async executePackPurchase(userId: string, packId: string, price: number): Promise<UserPack>
  private async executePackOpening(userPack: UserPack, cards: Card[]): Promise<OpenPackResult>
}

interface OpenPackResult {
  userPackId: string
  packName: string
  cards: CardSnapshot[]
  openedAt: Date
}

interface CardSnapshot {
  cardId: string
  name: string
  overall: number
  rarity: string
  position: string
  stats: Record<string, number>
  sellPrice: number
}
```

#### InventoryService

```typescript
class InventoryService {
  async findUserInventory(userId: string, filters: InventoryFilters): Promise<PaginatedInventory>
  async getInventorySummary(userId: string): Promise<InventorySummary>
  async getInventoryItem(userId: string, cardId: string): Promise<InventoryItem | null>
  async sellCard(userId: string, cardId: string, quantity: number): Promise<SellResult>
  private async executeSellTransaction(userId: string, cardId: string, quantity: number, totalPrice: number): Promise<SellResult>
}

interface InventorySummary {
  totalCards: number
  totalUniqueCards: number
  cardsByRarity: Record<string, number>
}

interface SellResult {
  coinsEarned: number
  newBalance: number
  cardsSold: number
}
```

#### TransactionService

```typescript
class TransactionService {
  async createTransaction(data: CreateTransactionDto): Promise<Transaction>
  async findUserTransactions(userId: string, filters: TransactionFilters): Promise<PaginatedTransactions>
}

enum TransactionType {
  BUY_PACK = 'BUY_PACK',
  SELL_CARD = 'SELL_CARD',
  INITIAL_CREDIT = 'INITIAL_CREDIT'
}
```

#### HistoryService

```typescript
class HistoryService {
  async findPackOpeningHistory(userId: string, filters: HistoryFilters): Promise<PaginatedHistory>
}

interface PackOpeningHistoryItem {
  userPackId: string
  packName: string
  openedAt: Date
  cards: CardSnapshot[]
}
```

### WebSocket Gateway

#### GameGateway

```typescript
@WebSocketGateway({ namespace: '/game', cors: true })
class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket): Promise<void>
  
  async handleDisconnect(client: Socket): Promise<void>
  
  @SubscribeMessage('pack:open_request')
  async handlePackOpen(
    @MessageBody() data: PackOpenRequestDto,
    @ConnectedSocket() client: Socket
  ): Promise<void>
  
  private async emitCardReveals(client: Socket, cards: CardSnapshot[]): Promise<void>
  private getUserRoom(userId: string): string
}

interface PackOpenRequestDto {
  userPackId: string
}

// WebSocket Events (Server -> Client)
interface PackOpenStartedEvent {
  userPackId: string
  packName: string
  cardCount: number
}

interface CardRevealedEvent {
  cardIndex: number
  card: CardSnapshot
}

interface PackOpenCompletedEvent {
  userPackId: string
  totalCards: number
  openedAt: Date
}

interface BalanceUpdatedEvent {
  newBalance: number
}

interface ErrorEvent {
  code: string
  message: string
}
```

### Cross-Cutting Components

#### HttpExceptionFilter

Global exception filter for consistent error responses.

```typescript
@Catch()
class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void
}

interface ErrorResponse {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
  requestId?: string
}
```

#### LoggingInterceptor

Logs all HTTP requests and responses.

```typescript
@Injectable()
class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>
}

interface LogEntry {
  requestId: string
  method: string
  path: string
  userId?: string
  statusCode: number
  duration: number
  timestamp: string
}
```



## Data Models

### Database Schema

The system uses 8 tables to manage users, cards, packs, inventory, and transactions.

#### Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o{ user_packs : owns
    users ||--o{ inventory : has
    users ||--o{ transactions : records
    pack_definitions ||--o{ user_packs : defines
    pack_definitions ||--o{ pack_card_pool : contains
    cards ||--o{ inventory : stored_in
    cards ||--o{ pack_card_pool : available_in
    user_packs ||--|| pack_opening_results : produces

    users {
        uuid id PK
        string email UK
        string password_hash
        string username
        int coin_balance
        timestamp created_at
        timestamp updated_at
    }

    cards {
        uuid id PK
        int sofifa_id UK
        string name
        int overall
        string rarity
        string position
        jsonb stats
        int sell_price
        timestamp created_at
    }

    pack_definitions {
        uuid id PK
        string name
        int price
        int card_count
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    user_packs {
        uuid id PK
        uuid user_id FK
        uuid pack_id FK
        enum status
        timestamp purchased_at
        timestamp opened_at
    }

    pack_opening_results {
        uuid id PK
        uuid user_pack_id FK
        jsonb card_snapshot
        timestamp created_at
    }

    inventory {
        uuid id PK
        uuid user_id FK
        uuid card_id FK
        int quantity
        timestamp created_at
        timestamp updated_at
    }

    transactions {
        uuid id PK
        uuid user_id FK
        enum type
        int amount
        int balance_after
        jsonb metadata
        timestamp created_at
    }

    pack_card_pool {
        uuid id PK
        uuid pack_id FK
        uuid card_id FK
        int weight
        timestamp created_at
    }
```

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String        @id @default(uuid()) @db.Uuid
  email         String        @unique
  passwordHash  String        @map("password_hash")
  username      String
  coinBalance   Int           @default(1000) @map("coin_balance")
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  userPacks     UserPack[]
  inventory     Inventory[]
  transactions  Transaction[]

  @@map("users")
}

model Card {
  id          String    @id @default(uuid()) @db.Uuid
  sofifaId    Int       @unique @map("sofifa_id")
  name        String
  overall     Int
  rarity      String
  position    String
  stats       Json      @db.JsonB
  sellPrice   Int       @map("sell_price")
  createdAt   DateTime  @default(now()) @map("created_at")

  inventory   Inventory[]
  packCardPool PackCardPool[]

  @@map("cards")
}

model PackDefinition {
  id          String    @id @default(uuid()) @db.Uuid
  name        String
  price       Int
  cardCount   Int       @map("card_count")
  isActive    Boolean   @default(true) @map("is_active")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  userPacks   UserPack[]
  packCardPool PackCardPool[]

  @@map("pack_definitions")
}

enum UserPackStatus {
  PENDING
  OPENED
}

model UserPack {
  id            String          @id @default(uuid()) @db.Uuid
  userId        String          @map("user_id") @db.Uuid
  packId        String          @map("pack_id") @db.Uuid
  status        UserPackStatus  @default(PENDING)
  purchasedAt   DateTime        @default(now()) @map("purchased_at")
  openedAt      DateTime?       @map("opened_at")

  user          User            @relation(fields: [userId], references: [id])
  pack          PackDefinition  @relation(fields: [packId], references: [id])
  openingResult PackOpeningResult?

  @@index([userId])
  @@index([status])
  @@map("user_packs")
}

model PackOpeningResult {
  id            String    @id @default(uuid()) @db.Uuid
  userPackId    String    @unique @map("user_pack_id") @db.Uuid
  cardSnapshot  Json      @map("card_snapshot") @db.JsonB
  createdAt     DateTime  @default(now()) @map("created_at")

  userPack      UserPack  @relation(fields: [userPackId], references: [id])

  @@map("pack_opening_results")
}

model Inventory {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  cardId      String    @map("card_id") @db.Uuid
  quantity    Int       @default(1)
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user        User      @relation(fields: [userId], references: [id])
  card        Card      @relation(fields: [cardId], references: [id])

  @@unique([userId, cardId])
  @@index([userId])
  @@map("inventory")
}

enum TransactionType {
  BUY_PACK
  SELL_CARD
  INITIAL_CREDIT
}

model Transaction {
  id            String          @id @default(uuid()) @db.Uuid
  userId        String          @map("user_id") @db.Uuid
  type          TransactionType
  amount        Int
  balanceAfter  Int             @map("balance_after")
  metadata      Json?           @db.JsonB
  createdAt     DateTime        @default(now()) @map("created_at")

  user          User            @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([type])
  @@map("transactions")
}

model PackCardPool {
  id          String          @id @default(uuid()) @db.Uuid
  packId      String          @map("pack_id") @db.Uuid
  cardId      String          @map("card_id") @db.Uuid
  weight      Int
  createdAt   DateTime        @default(now()) @map("created_at")

  pack        PackDefinition  @relation(fields: [packId], references: [id])
  card        Card            @relation(fields: [cardId], references: [id])

  @@unique([packId, cardId])
  @@index([packId])
  @@map("pack_card_pool")
}
```

### Data Model Constraints

#### Business Rules Enforced by Schema

1. **Email Uniqueness**: `users.email` has unique constraint
2. **Card Uniqueness**: `cards.sofifa_id` has unique constraint
3. **Inventory Uniqueness**: Composite unique constraint on `(user_id, card_id)`
4. **Default Coin Balance**: New users start with 1000 coins
5. **Pack Status**: Enum constraint ensures only PENDING or OPENED values
6. **Transaction Type**: Enum constraint ensures only valid transaction types
7. **Foreign Key Integrity**: All relationships enforced with foreign keys
8. **Timestamps**: Automatic `created_at` and `updated_at` management

#### Indexes for Performance

- `user_packs.user_id`: Fast lookup of user's packs
- `user_packs.status`: Filter packs by status
- `inventory.user_id`: Fast inventory queries
- `transactions.user_id`: Fast transaction history queries
- `transactions.type`: Filter transactions by type
- `pack_card_pool.pack_id`: Fast card pool lookup for pack opening

### Data Validation Rules

#### User Model

- `email`: Valid email format, max 255 characters
- `password`: Min 6 characters (validated before hashing)
- `username`: Min 3 characters, max 50 characters
- `coinBalance`: Non-negative integer

#### Card Model

- `sofifaId`: Positive integer
- `name`: Min 1 character, max 100 characters
- `overall`: Integer between 1-99
- `rarity`: Enum (COMMON, RARE, EPIC, LEGENDARY)
- `position`: Valid football position (GK, DEF, MID, ATT)
- `stats`: JSON object with numeric values
- `sellPrice`: Positive integer

#### PackDefinition Model

- `name`: Min 1 character, max 100 characters
- `price`: Positive integer
- `cardCount`: Positive integer (typically 3-11)
- `isActive`: Boolean

#### Inventory Model

- `quantity`: Positive integer

#### Transaction Model

- `amount`: Integer (negative for deductions, positive for credits)
- `balanceAfter`: Non-negative integer
- `metadata`: Optional JSON for additional context

#### PackCardPool Model

- `weight`: Positive integer (higher = more likely to drop)



### API Endpoints

The system exposes 21 REST endpoints organized by functional domain.

#### Authentication Endpoints

**POST /auth/register**
- Description: Register a new user account
- Authentication: None (public)
- Request Body:
  ```typescript
  {
    email: string      // Valid email format
    password: string   // Min 6 characters
    username: string   // Min 3 characters
  }
  ```
- Response (201):
  ```typescript
  {
    accessToken: string
    user: {
      id: string
      email: string
      username: string
      coinBalance: number  // Always 1000 for new users
    }
  }
  ```
- Error Responses:
  - 400: Invalid input (validation errors)
  - 409: Email already exists

**POST /auth/login**
- Description: Authenticate user and receive JWT token
- Authentication: None (public)
- Request Body:
  ```typescript
  {
    email: string
    password: string
  }
  ```
- Response (200):
  ```typescript
  {
    accessToken: string
    user: {
      id: string
      email: string
      username: string
      coinBalance: number
    }
  }
  ```
- Error Responses:
  - 400: Invalid input
  - 401: Invalid credentials

#### User Endpoints

**GET /users/me**
- Description: Get current authenticated user profile
- Authentication: JWT required
- Response (200):
  ```typescript
  {
    id: string
    email: string
    username: string
    coinBalance: number
    createdAt: string
  }
  ```
- Error Responses:
  - 401: Unauthorized (invalid/missing token)

**PATCH /users/me**
- Description: Update current user profile
- Authentication: JWT required
- Request Body:
  ```typescript
  {
    username?: string  // Optional, min 3 characters
  }
  ```
- Response (200):
  ```typescript
  {
    id: string
    email: string
    username: string
    coinBalance: number
    updatedAt: string
  }
  ```
- Error Responses:
  - 400: Invalid input
  - 401: Unauthorized

#### Pack Endpoints

**GET /packs**
- Description: List all active packs available for purchase
- Authentication: None (public)
- Query Parameters: None
- Response (200):
  ```typescript
  {
    packs: [
      {
        id: string
        name: string
        price: number
        cardCount: number
        isActive: boolean
      }
    ]
  }
  ```
- Sorting: Results sorted by price ascending

**GET /packs/:id**
- Description: Get detailed information about a specific pack including drop odds
- Authentication: None (public)
- Path Parameters:
  - `id`: Pack UUID
- Response (200):
  ```typescript
  {
    id: string
    name: string
    price: number
    cardCount: number
    isActive: boolean
    dropOdds: [
      {
        cardId: string
        cardName: string
        rarity: string
        probability: number  // Percentage (0-100)
      }
    ]
  }
  ```
- Error Responses:
  - 404: Pack not found

**POST /packs/:id/buy**
- Description: Purchase a pack with coins
- Authentication: JWT required
- Path Parameters:
  - `id`: Pack UUID
- Response (201):
  ```typescript
  {
    userPack: {
      id: string
      packId: string
      packName: string
      status: 'PENDING'
      purchasedAt: string
    }
    newBalance: number
  }
  ```
- Error Responses:
  - 400: Pack not active
  - 402: Insufficient coins
  - 404: Pack not found
  - 401: Unauthorized

#### User Pack Endpoints

**GET /user-packs**
- Description: List user's purchased packs
- Authentication: JWT required
- Query Parameters:
  - `status?: 'PENDING' | 'OPENED'` - Filter by status
  - `limit?: number` - Default 20, max 100
  - `offset?: number` - Default 0
- Response (200):
  ```typescript
  {
    userPacks: [
      {
        id: string
        packId: string
        packName: string
        cardCount: number
        status: 'PENDING' | 'OPENED'
        purchasedAt: string
        openedAt: string | null
      }
    ]
    total: number
    limit: number
    offset: number
  }
  ```
- Error Responses:
  - 401: Unauthorized

**POST /user-packs/:id/open**
- Description: Open a purchased pack and receive random cards
- Authentication: JWT required
- Path Parameters:
  - `id`: UserPack UUID
- Response (200):
  ```typescript
  {
    userPackId: string
    packName: string
    cards: [
      {
        cardId: string
        name: string
        overall: number
        rarity: string
        position: string
        stats: Record<string, number>
        sellPrice: number
      }
    ]
    openedAt: string
    isNewOpening: boolean  // false if already opened
  }
  ```
- Error Responses:
  - 403: User does not own this pack
  - 404: User pack not found
  - 401: Unauthorized
- Note: Idempotent - returns cached results for already-opened packs

#### Card Endpoints

**GET /cards**
- Description: Browse all cards in the game
- Authentication: None (public)
- Query Parameters:
  - `rarity?: string` - Filter by rarity
  - `position?: string` - Filter by position
  - `search?: string` - Search by name (case-insensitive)
  - `sortBy?: 'overall' | 'name' | 'rarity'` - Default 'overall'
  - `sortOrder?: 'asc' | 'desc'` - Default 'desc'
  - `limit?: number` - Default 20, max 100
  - `offset?: number` - Default 0
- Response (200):
  ```typescript
  {
    cards: [
      {
        id: string
        sofifaId: number
        name: string
        overall: number
        rarity: string
        position: string
        stats: Record<string, number>
        sellPrice: number
      }
    ]
    total: number
    limit: number
    offset: number
  }
  ```

**GET /cards/:id**
- Description: Get detailed information about a specific card
- Authentication: None (public)
- Path Parameters:
  - `id`: Card UUID
- Response (200):
  ```typescript
  {
    id: string
    sofifaId: number
    name: string
    overall: number
    rarity: string
    position: string
    stats: Record<string, number>
    sellPrice: number
    createdAt: string
  }
  ```
- Error Responses:
  - 404: Card not found

#### Inventory Endpoints

**GET /inventory**
- Description: View user's card collection
- Authentication: JWT required
- Query Parameters:
  - `rarity?: string` - Filter by rarity
  - `position?: string` - Filter by position
  - `search?: string` - Search by card name
  - `sortBy?: 'overall' | 'name' | 'rarity' | 'quantity'` - Default 'overall'
  - `sortOrder?: 'asc' | 'desc'` - Default 'desc'
  - `limit?: number` - Default 20, max 100
  - `offset?: number` - Default 0
- Response (200):
  ```typescript
  {
    inventory: [
      {
        cardId: string
        cardName: string
        overall: number
        rarity: string
        position: string
        quantity: number
        sellPrice: number
        totalValue: number  // sellPrice * quantity
      }
    ]
    total: number
    limit: number
    offset: number
  }
  ```
- Error Responses:
  - 401: Unauthorized

**GET /inventory/summary**
- Description: Get aggregated inventory statistics
- Authentication: JWT required
- Response (200):
  ```typescript
  {
    totalCards: number
    totalUniqueCards: number
    totalValue: number
    cardsByRarity: {
      COMMON: number
      RARE: number
      EPIC: number
      LEGENDARY: number
    }
  }
  ```
- Error Responses:
  - 401: Unauthorized

**GET /inventory/:cardId**
- Description: Get details of a specific card in user's inventory
- Authentication: JWT required
- Path Parameters:
  - `cardId`: Card UUID
- Response (200):
  ```typescript
  {
    cardId: string
    cardName: string
    overall: number
    rarity: string
    position: string
    stats: Record<string, number>
    quantity: number
    sellPrice: number
    totalValue: number
  }
  ```
- Error Responses:
  - 404: Card not in inventory
  - 401: Unauthorized

**POST /inventory/sell**
- Description: Sell cards for coins
- Authentication: JWT required
- Request Body:
  ```typescript
  {
    cardId: string
    quantity: number  // Must be positive
  }
  ```
- Response (200):
  ```typescript
  {
    cardId: string
    cardName: string
    quantitySold: number
    coinsEarned: number
    newBalance: number
    remainingQuantity: number
  }
  ```
- Error Responses:
  - 400: Invalid quantity or quantity exceeds owned amount
  - 404: Card not in inventory
  - 401: Unauthorized

#### Transaction Endpoints

**GET /transactions**
- Description: View coin transaction history
- Authentication: JWT required
- Query Parameters:
  - `type?: 'BUY_PACK' | 'SELL_CARD' | 'INITIAL_CREDIT'` - Filter by type
  - `limit?: number` - Default 20, max 100
  - `offset?: number` - Default 0
- Response (200):
  ```typescript
  {
    transactions: [
      {
        id: string
        type: 'BUY_PACK' | 'SELL_CARD' | 'INITIAL_CREDIT'
        amount: number  // Negative for deductions, positive for credits
        balanceAfter: number
        metadata: Record<string, any> | null
        createdAt: string
      }
    ]
    total: number
    limit: number
    offset: number
  }
  ```
- Sorting: Results sorted by createdAt descending (newest first)
- Error Responses:
  - 401: Unauthorized

#### History Endpoints

**GET /history/pack-openings**
- Description: View pack opening history with card snapshots
- Authentication: JWT required
- Query Parameters:
  - `limit?: number` - Default 20, max 100
  - `offset?: number` - Default 0
- Response (200):
  ```typescript
  {
    history: [
      {
        userPackId: string
        packName: string
        cardCount: number
        cards: [
          {
            cardId: string
            name: string
            overall: number
            rarity: string
            position: string
            sellPrice: number
          }
        ]
        openedAt: string
      }
    ]
    total: number
    limit: number
    offset: number
  }
  ```
- Sorting: Results sorted by openedAt descending (newest first)
- Error Responses:
  - 401: Unauthorized

#### Health Endpoints

**GET /health**
- Description: Check API and database health
- Authentication: None (public)
- Response (200):
  ```typescript
  {
    status: 'ok' | 'error'
    timestamp: string
    uptime: number  // Seconds
    database: {
      status: 'connected' | 'disconnected'
      responseTime: number  // Milliseconds
    }
  }
  ```

### WebSocket Events

#### Client -> Server Events

**pack:open_request**
- Description: Request to open a pack via WebSocket
- Payload:
  ```typescript
  {
    userPackId: string
  }
  ```
- Authentication: JWT token in handshake
- Validation: User must own the pack

#### Server -> Client Events

**pack:open_started**
- Description: Pack opening process has begun
- Payload:
  ```typescript
  {
    userPackId: string
    packName: string
    cardCount: number
  }
  ```

**pack:card_revealed**
- Description: A card has been revealed (emitted for each card with 500ms delay)
- Payload:
  ```typescript
  {
    cardIndex: number  // 0-based index
    card: {
      cardId: string
      name: string
      overall: number
      rarity: string
      position: string
      stats: Record<string, number>
      sellPrice: number
    }
  }
  ```

**pack:open_completed**
- Description: All cards have been revealed
- Payload:
  ```typescript
  {
    userPackId: string
    totalCards: number
    openedAt: string
  }
  ```

**balance:updated**
- Description: User's coin balance has changed
- Payload:
  ```typescript
  {
    newBalance: number
  }
  ```

**error**
- Description: An error occurred during WebSocket operation
- Payload:
  ```typescript
  {
    code: string  // Error code (e.g., 'PACK_NOT_FOUND', 'INSUFFICIENT_COINS')
    message: string
  }
  ```

### API Design Patterns

#### Pagination Pattern

All list endpoints support consistent pagination:
- `limit`: Number of items per page (default 20, max 100)
- `offset`: Number of items to skip (default 0)
- Response includes `total`, `limit`, `offset` for client-side pagination logic

#### Filtering Pattern

List endpoints support query parameter filters:
- Exact match: `?rarity=LEGENDARY`
- Search: `?search=Messi` (case-insensitive partial match)
- Multiple filters can be combined

#### Sorting Pattern

List endpoints support sorting:
- `sortBy`: Field name
- `sortOrder`: 'asc' or 'desc'
- Default sorting varies by endpoint (typically newest first or highest value first)

#### Error Response Pattern

All errors follow consistent structure:
```typescript
{
  statusCode: number
  message: string | string[]  // Array for validation errors
  error: string  // Error type (e.g., 'Bad Request')
  timestamp: string
  path: string
  requestId?: string  // For tracing
}
```



## Business Logic Implementation

### Weighted Random Algorithm

The core algorithm for card selection from pack pools uses weighted random distribution.

#### Algorithm Specification

```typescript
class RandomService {
  /**
   * Weighted random selection algorithm
   * Time Complexity: O(n * m) where n = count, m = pool size
   * Space Complexity: O(1)
   */
  selectWeighted<T extends { weight: number }>(
    pool: T[],
    count: number
  ): T[] {
    // Validate inputs
    if (pool.length === 0) {
      throw new Error('Pool cannot be empty')
    }
    if (count <= 0) {
      throw new Error('Count must be positive')
    }
    if (pool.some(item => item.weight <= 0)) {
      throw new Error('All weights must be positive')
    }

    // Calculate total weight
    const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)
    
    const results: T[] = []
    
    // Select 'count' items
    for (let i = 0; i < count; i++) {
      // Generate random number in range [0, totalWeight)
      const random = Math.random() * totalWeight
      
      // Find selected item using cumulative weight
      let cumulativeWeight = 0
      for (const item of pool) {
        cumulativeWeight += item.weight
        if (random < cumulativeWeight) {
          results.push(item)
          break
        }
      }
    }
    
    return results
  }
}
```

#### Example Calculation

Given a pack with 3 cards to select from this pool:

| Card | Rarity | Weight |
|------|--------|--------|
| Card A | COMMON | 70 |
| Card B | RARE | 25 |
| Card C | LEGENDARY | 5 |

Total Weight = 100

Probabilities:
- Card A: 70/100 = 70%
- Card B: 25/100 = 25%
- Card C: 5/100 = 5%

Selection Process:
1. Generate random number: 0 ≤ r < 100
2. If r < 70: Select Card A
3. Else if r < 95: Select Card B
4. Else: Select Card C
5. Repeat 3 times (duplicates allowed)

### Pack Purchase Transaction Flow

Pack purchase must be atomic to ensure data consistency.

```typescript
async purchasePack(userId: string, packId: string): Promise<UserPack> {
  return await this.prisma.$transaction(async (tx) => {
    // 1. Lock user row for update
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true }
    })
    
    if (!user) {
      throw new NotFoundException('User not found')
    }
    
    // 2. Get pack details
    const pack = await tx.packDefinition.findUnique({
      where: { id: packId }
    })
    
    if (!pack) {
      throw new NotFoundException('Pack not found')
    }
    
    if (!pack.isActive) {
      throw new BadRequestException('Pack is not available')
    }
    
    // 3. Verify sufficient balance
    if (user.coinBalance < pack.price) {
      throw new PaymentRequiredException('Insufficient coins')
    }
    
    // 4. Deduct coins
    const newBalance = user.coinBalance - pack.price
    await tx.user.update({
      where: { id: userId },
      data: { coinBalance: newBalance }
    })
    
    // 5. Create user pack
    const userPack = await tx.userPack.create({
      data: {
        userId,
        packId,
        status: 'PENDING'
      }
    })
    
    // 6. Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'BUY_PACK',
        amount: -pack.price,
        balanceAfter: newBalance,
        metadata: {
          packId,
          packName: pack.name,
          userPackId: userPack.id
        }
      }
    })
    
    return userPack
  })
}
```

**Transaction Guarantees:**
- All operations succeed or all fail (atomicity)
- User balance never goes negative
- UserPack and Transaction records always created together
- No partial state visible to other transactions (isolation)

### Pack Opening Transaction Flow

Pack opening must handle idempotency and atomic inventory updates.

```typescript
async openPack(userId: string, userPackId: string): Promise<OpenPackResult> {
  // 1. Check ownership and status
  const userPack = await this.prisma.userPack.findUnique({
    where: { id: userPackId },
    include: {
      pack: true,
      openingResult: true
    }
  })
  
  if (!userPack) {
    throw new NotFoundException('User pack not found')
  }
  
  if (userPack.userId !== userId) {
    throw new ForbiddenException('You do not own this pack')
  }
  
  // 2. Return cached result if already opened (idempotency)
  if (userPack.status === 'OPENED' && userPack.openingResult) {
    return {
      userPackId: userPack.id,
      packName: userPack.pack.name,
      cards: userPack.openingResult.cardSnapshot as CardSnapshot[],
      openedAt: userPack.openedAt!,
      isNewOpening: false
    }
  }
  
  // 3. Execute opening in transaction
  return await this.prisma.$transaction(async (tx) => {
    // 3a. Get card pool for this pack
    const cardPool = await tx.packCardPool.findMany({
      where: { packId: userPack.packId },
      include: { card: true }
    })
    
    if (cardPool.length === 0) {
      throw new BadRequestException('Pack has no cards configured')
    }
    
    // 3b. Select random cards using weighted algorithm
    const selectedCards = this.randomService.selectWeighted(
      cardPool,
      userPack.pack.cardCount
    )
    
    // 3c. Create card snapshots
    const cardSnapshots: CardSnapshot[] = selectedCards.map(item => ({
      cardId: item.card.id,
      name: item.card.name,
      overall: item.card.overall,
      rarity: item.card.rarity,
      position: item.card.position,
      stats: item.card.stats as Record<string, number>,
      sellPrice: item.card.sellPrice
    }))
    
    // 3d. Update user pack status
    await tx.userPack.update({
      where: { id: userPackId },
      data: {
        status: 'OPENED',
        openedAt: new Date()
      }
    })
    
    // 3e. Save opening result (immutable snapshot)
    await tx.packOpeningResult.create({
      data: {
        userPackId,
        cardSnapshot: cardSnapshots
      }
    })
    
    // 3f. Update inventory for each card
    for (const snapshot of cardSnapshots) {
      await tx.inventory.upsert({
        where: {
          userId_cardId: {
            userId,
            cardId: snapshot.cardId
          }
        },
        create: {
          userId,
          cardId: snapshot.cardId,
          quantity: 1
        },
        update: {
          quantity: { increment: 1 }
        }
      })
    }
    
    return {
      userPackId: userPack.id,
      packName: userPack.pack.name,
      cards: cardSnapshots,
      openedAt: new Date(),
      isNewOpening: true
    }
  })
}
```

**Key Design Decisions:**
- Check status before transaction to avoid unnecessary locks
- Use `cardSnapshot` JSONB to preserve exact card state at opening time
- Use `upsert` for inventory to handle both new and existing cards
- Return `isNewOpening` flag to distinguish cached vs fresh results

### Card Selling Transaction Flow

Card selling must atomically update inventory and balance.

```typescript
async sellCard(
  userId: string,
  cardId: string,
  quantity: number
): Promise<SellResult> {
  if (quantity <= 0) {
    throw new BadRequestException('Quantity must be positive')
  }
  
  return await this.prisma.$transaction(async (tx) => {
    // 1. Get inventory item with lock
    const inventoryItem = await tx.inventory.findUnique({
      where: {
        userId_cardId: { userId, cardId }
      },
      include: { card: true }
    })
    
    if (!inventoryItem) {
      throw new NotFoundException('Card not in inventory')
    }
    
    // 2. Verify sufficient quantity
    if (inventoryItem.quantity < quantity) {
      throw new BadRequestException(
        `Insufficient quantity. You have ${inventoryItem.quantity}, trying to sell ${quantity}`
      )
    }
    
    // 3. Calculate total price
    const totalPrice = inventoryItem.card.sellPrice * quantity
    
    // 4. Update or delete inventory
    const newQuantity = inventoryItem.quantity - quantity
    if (newQuantity === 0) {
      await tx.inventory.delete({
        where: { id: inventoryItem.id }
      })
    } else {
      await tx.inventory.update({
        where: { id: inventoryItem.id },
        data: { quantity: newQuantity }
      })
    }
    
    // 5. Update user balance
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        coinBalance: { increment: totalPrice }
      },
      select: { coinBalance: true }
    })
    
    // 6. Record transaction
    await tx.transaction.create({
      data: {
        userId,
        type: 'SELL_CARD',
        amount: totalPrice,
        balanceAfter: user.coinBalance,
        metadata: {
          cardId,
          cardName: inventoryItem.card.name,
          quantity,
          pricePerCard: inventoryItem.card.sellPrice
        }
      }
    })
    
    return {
      coinsEarned: totalPrice,
      newBalance: user.coinBalance,
      cardsSold: quantity
    }
  })
}
```

**Transaction Guarantees:**
- Inventory quantity never goes negative
- Coins are credited exactly once
- Transaction record always created
- Inventory deleted when quantity reaches zero

### User Registration Flow

User registration must create user and initial credit atomically.

```typescript
async register(
  email: string,
  password: string,
  username: string
): Promise<AuthResponse> {
  // 1. Check if email exists (outside transaction for performance)
  const existingUser = await this.prisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    throw new ConflictException('Email already registered')
  }
  
  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 12)
  
  // 3. Create user and initial transaction atomically
  const user = await this.prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        passwordHash,
        username,
        coinBalance: 1000
      }
    })
    
    await tx.transaction.create({
      data: {
        userId: newUser.id,
        type: 'INITIAL_CREDIT',
        amount: 1000,
        balanceAfter: 1000,
        metadata: {
          reason: 'New user registration bonus'
        }
      }
    })
    
    return newUser
  })
  
  // 4. Generate JWT token
  const accessToken = this.generateToken(user)
  
  return {
    accessToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      coinBalance: user.coinBalance
    }
  }
}
```

### WebSocket Pack Opening Flow

WebSocket pack opening provides real-time card reveal experience.

```typescript
@SubscribeMessage('pack:open_request')
async handlePackOpen(
  @MessageBody() data: PackOpenRequestDto,
  @ConnectedSocket() client: Socket
): Promise<void> {
  try {
    const userId = client.data.userId
    const userRoom = this.getUserRoom(userId)
    
    // 1. Open pack (uses same service as REST endpoint)
    const result = await this.userPackService.openPack(
      userId,
      data.userPackId
    )
    
    // 2. Emit opening started event
    this.server.to(userRoom).emit('pack:open_started', {
      userPackId: result.userPackId,
      packName: result.packName,
      cardCount: result.cards.length
    })
    
    // 3. Emit card reveals with delay
    for (let i = 0; i < result.cards.length; i++) {
      await this.delay(500) // 500ms delay between cards
      
      this.server.to(userRoom).emit('pack:card_revealed', {
        cardIndex: i,
        card: result.cards[i]
      })
    }
    
    // 4. Emit completion event
    this.server.to(userRoom).emit('pack:open_completed', {
      userPackId: result.userPackId,
      totalCards: result.cards.length,
      openedAt: result.openedAt
    })
    
    // 5. Emit updated balance
    const user = await this.userService.findById(userId)
    this.server.to(userRoom).emit('balance:updated', {
      newBalance: user.coinBalance
    })
    
  } catch (error) {
    // Emit error to client
    client.emit('error', {
      code: this.getErrorCode(error),
      message: error.message
    })
  }
}

private delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

private getUserRoom(userId: string): string {
  return `room-${userId}`
}
```

**WebSocket Design Decisions:**
- Each user has a dedicated room for private events
- Card reveals are delayed by 500ms for dramatic effect
- Pack opening continues even if client disconnects
- Errors are emitted to the specific client, not broadcast
- Balance update sent after completion for UI synchronization



## Error Handling

### Error Handling Strategy

The application uses a layered error handling approach with global exception filters and domain-specific error types.

#### Exception Hierarchy

```typescript
// NestJS Built-in Exceptions
BadRequestException          // 400 - Invalid input
UnauthorizedException        // 401 - Authentication required
PaymentRequiredException     // 402 - Insufficient coins
ForbiddenException          // 403 - Access denied
NotFoundException           // 404 - Resource not found
ConflictException           // 409 - Duplicate resource
InternalServerErrorException // 500 - Unexpected error

// Custom Business Exceptions
class InsufficientCoinsException extends PaymentRequiredException {
  constructor(required: number, available: number) {
    super(`Insufficient coins. Required: ${required}, Available: ${available}`)
  }
}

class PackAlreadyOpenedException extends BadRequestException {
  constructor(userPackId: string) {
    super(`Pack ${userPackId} has already been opened`)
  }
}

class InvalidPackConfigurationException extends InternalServerErrorException {
  constructor(packId: string) {
    super(`Pack ${packId} has invalid configuration`)
  }
}
```

### Global Exception Filter

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string | string[] = 'Internal server error'
    let error = 'Internal Server Error'

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      
      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || message
        error = (exceptionResponse as any).error || error
      } else {
        message = exceptionResponse
      }
    }
    
    // Handle Prisma exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const prismaError = this.handlePrismaError(exception)
      status = prismaError.status
      message = prismaError.message
      error = prismaError.error
    }
    
    // Handle validation errors
    else if (exception instanceof Error) {
      message = exception.message
    }

    // Log error details
    this.logger.error({
      statusCode: status,
      message,
      error,
      path: request.url,
      method: request.method,
      userId: (request as any).user?.id,
      timestamp: new Date().toISOString(),
      stack: exception instanceof Error ? exception.stack : undefined
    })

    // Send error response
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
      requestId: (request as any).id
    })
  }

  private handlePrismaError(error: Prisma.PrismaClientKnownRequestError): {
    status: number
    message: string
    error: string
  } {
    switch (error.code) {
      case 'P2002': // Unique constraint violation
        return {
          status: HttpStatus.CONFLICT,
          message: `Duplicate value for ${error.meta?.target}`,
          error: 'Conflict'
        }
      case 'P2025': // Record not found
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Record not found',
          error: 'Not Found'
        }
      case 'P2003': // Foreign key constraint violation
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid reference',
          error: 'Bad Request'
        }
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Database error',
          error: 'Internal Server Error'
        }
    }
  }
}
```

### Error Response Format

All errors follow a consistent structure:

```typescript
interface ErrorResponse {
  statusCode: number
  message: string | string[]  // Array for validation errors
  error: string               // Error type name
  timestamp: string           // ISO 8601 format
  path: string                // Request path
  requestId?: string          // For tracing (optional)
}
```

**Examples:**

Validation Error (400):
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must be at least 6 characters"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/auth/register"
}
```

Insufficient Coins (402):
```json
{
  "statusCode": 402,
  "message": "Insufficient coins. Required: 500, Available: 300",
  "error": "Payment Required",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/packs/abc-123/buy",
  "requestId": "req-xyz-789"
}
```

Not Found (404):
```json
{
  "statusCode": 404,
  "message": "Pack not found",
  "error": "Not Found",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/packs/invalid-id"
}
```

### Validation Error Handling

Input validation uses class-validator decorators with automatic error formatting.

```typescript
// DTO Example
export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsNotEmpty()
  username: string
}

// Validation Pipe Configuration in main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip unknown properties
    forbidNonWhitelisted: true, // Throw error on unknown properties
    transform: true,            // Auto-transform to DTO types
    transformOptions: {
      enableImplicitConversion: true
    }
  })
)
```

### WebSocket Error Handling

WebSocket errors use a different pattern since they don't have HTTP status codes.

```typescript
// WebSocket Error Codes
enum WsErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  PACK_NOT_FOUND = 'PACK_NOT_FOUND',
  PACK_NOT_OWNED = 'PACK_NOT_OWNED',
  INSUFFICIENT_COINS = 'INSUFFICIENT_COINS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

// Error Event Payload
interface WsErrorEvent {
  code: WsErrorCode
  message: string
  timestamp: string
}

// Error Handling in Gateway
@SubscribeMessage('pack:open_request')
async handlePackOpen(
  @MessageBody() data: PackOpenRequestDto,
  @ConnectedSocket() client: Socket
): Promise<void> {
  try {
    // ... business logic
  } catch (error) {
    const errorCode = this.mapErrorToWsCode(error)
    
    client.emit('error', {
      code: errorCode,
      message: error.message,
      timestamp: new Date().toISOString()
    })
    
    this.logger.error({
      event: 'pack:open_request',
      userId: client.data.userId,
      error: error.message,
      stack: error.stack
    })
  }
}

private mapErrorToWsCode(error: Error): WsErrorCode {
  if (error instanceof NotFoundException) {
    return WsErrorCode.PACK_NOT_FOUND
  }
  if (error instanceof ForbiddenException) {
    return WsErrorCode.PACK_NOT_OWNED
  }
  if (error instanceof PaymentRequiredException) {
    return WsErrorCode.INSUFFICIENT_COINS
  }
  if (error instanceof BadRequestException) {
    return WsErrorCode.INVALID_REQUEST
  }
  return WsErrorCode.INTERNAL_ERROR
}
```

### Database Transaction Error Handling

Database transactions automatically rollback on errors.

```typescript
async purchasePack(userId: string, packId: string): Promise<UserPack> {
  try {
    return await this.prisma.$transaction(async (tx) => {
      // All operations here
      // If any operation throws, entire transaction rolls back
    })
  } catch (error) {
    // Transaction already rolled back at this point
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2034') {
        throw new ConflictException('Transaction conflict, please retry')
      }
    }
    
    // Re-throw for global filter to handle
    throw error
  }
}
```

### Retry Strategy for Transient Errors

For operations that may fail due to transient issues (e.g., database connection), implement retry logic.

```typescript
async executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      // Only retry on transient errors
      if (this.isTransientError(error) && attempt < maxRetries) {
        this.logger.warn(`Attempt ${attempt} failed, retrying...`)
        await this.delay(delayMs * attempt) // Exponential backoff
        continue
      }
      
      throw error
    }
  }
  
  throw lastError
}

private isTransientError(error: Error): boolean {
  // Prisma connection errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P1001', 'P1002', 'P1008', 'P1017'].includes(error.code)
  }
  return false
}
```

### Error Logging Strategy

Different error severities require different logging levels:

```typescript
class ErrorLogger {
  logError(error: Error, context: Record<string, any>): void {
    const severity = this.getErrorSeverity(error)
    
    const logData = {
      ...context,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }
    
    switch (severity) {
      case 'critical':
        this.logger.error(logData)
        // Send to alerting system (e.g., Sentry, PagerDuty)
        break
      case 'error':
        this.logger.error(logData)
        break
      case 'warning':
        this.logger.warn(logData)
        break
      case 'info':
        this.logger.log(logData)
        break
    }
  }
  
  private getErrorSeverity(error: Error): 'critical' | 'error' | 'warning' | 'info' {
    // Database connection failures are critical
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return 'critical'
    }
    
    // Internal server errors are errors
    if (error instanceof InternalServerErrorException) {
      return 'error'
    }
    
    // Client errors (4xx) are warnings
    if (error instanceof HttpException && error.getStatus() < 500) {
      return 'warning'
    }
    
    return 'error'
  }
}
```



## Testing Strategy

### Testing Approach

The application uses a comprehensive testing strategy with multiple test types to ensure correctness and reliability.

#### Test Pyramid

```
        /\
       /  \
      / E2E \
     /--------\
    /          \
   / Integration \
  /--------------\
 /                \
/   Unit Tests     \
--------------------
```

### Unit Testing

Unit tests focus on individual components in isolation using mocks for dependencies.

#### Service Layer Unit Tests

```typescript
describe('UserPackService', () => {
  let service: UserPackService
  let prisma: DeepMockProxy<PrismaClient>
  let randomService: jest.Mocked<RandomService>

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>()
    randomService = {
      selectWeighted: jest.fn()
    } as any

    service = new UserPackService(prisma, randomService)
  })

  describe('purchasePack', () => {
    it('should successfully purchase pack when user has sufficient coins', async () => {
      // Arrange
      const userId = 'user-123'
      const packId = 'pack-456'
      const mockUser = { id: userId, coinBalance: 1000 }
      const mockPack = { id: packId, price: 500, isActive: true }

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma)
      })
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.packDefinition.findUnique.mockResolvedValue(mockPack as any)
      prisma.user.update.mockResolvedValue({ ...mockUser, coinBalance: 500 } as any)
      prisma.userPack.create.mockResolvedValue({ id: 'userpack-789' } as any)

      // Act
      const result = await service.purchasePack(userId, packId)

      // Assert
      expect(result).toBeDefined()
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { coinBalance: 500 }
      })
      expect(prisma.transaction.create).toHaveBeenCalled()
    })

    it('should throw PaymentRequiredException when user has insufficient coins', async () => {
      // Arrange
      const userId = 'user-123'
      const packId = 'pack-456'
      const mockUser = { id: userId, coinBalance: 100 }
      const mockPack = { id: packId, price: 500, isActive: true }

      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma)
      })
      prisma.user.findUnique.mockResolvedValue(mockUser as any)
      prisma.packDefinition.findUnique.mockResolvedValue(mockPack as any)

      // Act & Assert
      await expect(service.purchasePack(userId, packId))
        .rejects
        .toThrow(PaymentRequiredException)
    })
  })

  describe('openPack', () => {
    it('should return cached result for already opened pack', async () => {
      // Arrange
      const userId = 'user-123'
      const userPackId = 'userpack-456'
      const mockOpeningResult = {
        cardSnapshot: [{ cardId: 'card-1', name: 'Player 1' }]
      }
      const mockUserPack = {
        id: userPackId,
        userId,
        status: 'OPENED',
        openedAt: new Date(),
        pack: { name: 'Gold Pack' },
        openingResult: mockOpeningResult
      }

      prisma.userPack.findUnique.mockResolvedValue(mockUserPack as any)

      // Act
      const result = await service.openPack(userId, userPackId)

      // Assert
      expect(result.isNewOpening).toBe(false)
      expect(result.cards).toEqual(mockOpeningResult.cardSnapshot)
      expect(prisma.$transaction).not.toHaveBeenCalled()
    })

    it('should generate new cards for pending pack', async () => {
      // Arrange
      const userId = 'user-123'
      const userPackId = 'userpack-456'
      const mockUserPack = {
        id: userPackId,
        userId,
        packId: 'pack-789',
        status: 'PENDING',
        pack: { name: 'Gold Pack', cardCount: 3 }
      }
      const mockCardPool = [
        { card: { id: 'card-1', name: 'Player 1', overall: 85 }, weight: 70 },
        { card: { id: 'card-2', name: 'Player 2', overall: 90 }, weight: 30 }
      ]

      prisma.userPack.findUnique.mockResolvedValue(mockUserPack as any)
      prisma.$transaction.mockImplementation(async (callback) => {
        return callback(prisma)
      })
      prisma.packCardPool.findMany.mockResolvedValue(mockCardPool as any)
      randomService.selectWeighted.mockReturnValue(mockCardPool.slice(0, 3))

      // Act
      const result = await service.openPack(userId, userPackId)

      // Assert
      expect(result.isNewOpening).toBe(true)
      expect(randomService.selectWeighted).toHaveBeenCalledWith(mockCardPool, 3)
      expect(prisma.userPack.update).toHaveBeenCalled()
      expect(prisma.packOpeningResult.create).toHaveBeenCalled()
    })
  })
})
```

#### RandomService Unit Tests

```typescript
describe('RandomService', () => {
  let service: RandomService

  beforeEach(() => {
    service = new RandomService()
  })

  describe('selectWeighted', () => {
    it('should select items according to weight distribution', () => {
      // Arrange
      const pool = [
        { id: 'A', weight: 70 },
        { id: 'B', weight: 25 },
        { id: 'C', weight: 5 }
      ]
      const count = 1000

      // Act
      const results = service.selectWeighted(pool, count)

      // Assert
      const countA = results.filter(r => r.id === 'A').length
      const countB = results.filter(r => r.id === 'B').length
      const countC = results.filter(r => r.id === 'C').length

      // Allow 10% variance from expected distribution
      expect(countA).toBeGreaterThan(600)
      expect(countA).toBeLessThan(800)
      expect(countB).toBeGreaterThan(150)
      expect(countB).toBeLessThan(350)
      expect(countC).toBeGreaterThan(0)
      expect(countC).toBeLessThan(100)
    })

    it('should allow duplicate selections', () => {
      // Arrange
      const pool = [{ id: 'A', weight: 100 }]
      const count = 5

      // Act
      const results = service.selectWeighted(pool, count)

      // Assert
      expect(results).toHaveLength(5)
      expect(results.every(r => r.id === 'A')).toBe(true)
    })

    it('should throw error for empty pool', () => {
      // Act & Assert
      expect(() => service.selectWeighted([], 1))
        .toThrow('Pool cannot be empty')
    })

    it('should throw error for non-positive count', () => {
      // Arrange
      const pool = [{ id: 'A', weight: 100 }]

      // Act & Assert
      expect(() => service.selectWeighted(pool, 0))
        .toThrow('Count must be positive')
      expect(() => service.selectWeighted(pool, -1))
        .toThrow('Count must be positive')
    })

    it('should throw error for non-positive weights', () => {
      // Arrange
      const pool = [
        { id: 'A', weight: 100 },
        { id: 'B', weight: 0 }
      ]

      // Act & Assert
      expect(() => service.selectWeighted(pool, 1))
        .toThrow('All weights must be positive')
    })
  })
})
```

### Integration Testing

Integration tests verify interactions between components with a real database.

```typescript
describe('Pack Purchase Integration', () => {
  let app: INestApplication
  let prisma: PrismaService
  let authToken: string
  let userId: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = app.get(PrismaService)
    await app.init()

    // Create test user and get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser'
      })

    authToken = response.body.accessToken
    userId = response.body.user.id
  })

  afterAll(async () => {
    await prisma.user.deleteMany()
    await app.close()
  })

  it('should complete full pack purchase and opening flow', async () => {
    // 1. Create test pack
    const pack = await prisma.packDefinition.create({
      data: {
        name: 'Test Pack',
        price: 500,
        cardCount: 3,
        isActive: true
      }
    })

    // 2. Create test cards and pool
    const card = await prisma.card.create({
      data: {
        sofifaId: 12345,
        name: 'Test Player',
        overall: 85,
        rarity: 'RARE',
        position: 'MID',
        stats: { pace: 80, shooting: 85 },
        sellPrice: 100
      }
    })

    await prisma.packCardPool.create({
      data: {
        packId: pack.id,
        cardId: card.id,
        weight: 100
      }
    })

    // 3. Purchase pack
    const purchaseResponse = await request(app.getHttpServer())
      .post(`/packs/${pack.id}/buy`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201)

    expect(purchaseResponse.body.newBalance).toBe(500)
    const userPackId = purchaseResponse.body.userPack.id

    // 4. Open pack
    const openResponse = await request(app.getHttpServer())
      .post(`/user-packs/${userPackId}/open`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(openResponse.body.cards).toHaveLength(3)
    expect(openResponse.body.isNewOpening).toBe(true)

    // 5. Verify inventory updated
    const inventoryResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(inventoryResponse.body.inventory.length).toBeGreaterThan(0)

    // 6. Verify idempotency - open again
    const reopenResponse = await request(app.getHttpServer())
      .post(`/user-packs/${userPackId}/open`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(reopenResponse.body.isNewOpening).toBe(false)
    expect(reopenResponse.body.cards).toEqual(openResponse.body.cards)
  })
})
```

### End-to-End Testing

E2E tests verify complete user workflows through the API.

```typescript
describe('User Journey: New Player Experience (e2e)', () => {
  let app: INestApplication
  let authToken: string

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should complete new player journey', async () => {
    // 1. Register
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `player-${Date.now()}@example.com`,
        password: 'password123',
        username: 'newplayer'
      })
      .expect(201)

    authToken = registerResponse.body.accessToken
    expect(registerResponse.body.user.coinBalance).toBe(1000)

    // 2. View available packs
    const packsResponse = await request(app.getHttpServer())
      .get('/packs')
      .expect(200)

    expect(packsResponse.body.packs.length).toBeGreaterThan(0)
    const packId = packsResponse.body.packs[0].id

    // 3. Purchase pack
    await request(app.getHttpServer())
      .post(`/packs/${packId}/buy`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201)

    // 4. View purchased packs
    const userPacksResponse = await request(app.getHttpServer())
      .get('/user-packs?status=PENDING')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(userPacksResponse.body.userPacks.length).toBe(1)
    const userPackId = userPacksResponse.body.userPacks[0].id

    // 5. Open pack
    const openResponse = await request(app.getHttpServer())
      .post(`/user-packs/${userPackId}/open`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    const receivedCards = openResponse.body.cards

    // 6. View inventory
    const inventoryResponse = await request(app.getHttpServer())
      .get('/inventory')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(inventoryResponse.body.total).toBeGreaterThan(0)

    // 7. Sell a card
    const cardToSell = inventoryResponse.body.inventory[0]
    const sellResponse = await request(app.getHttpServer())
      .post('/inventory/sell')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        cardId: cardToSell.cardId,
        quantity: 1
      })
      .expect(200)

    expect(sellResponse.body.coinsEarned).toBeGreaterThan(0)

    // 8. View transaction history
    const transactionsResponse = await request(app.getHttpServer())
      .get('/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(transactionsResponse.body.transactions.length).toBeGreaterThanOrEqual(3)
    // Should have: INITIAL_CREDIT, BUY_PACK, SELL_CARD

    // 9. View pack opening history
    const historyResponse = await request(app.getHttpServer())
      .get('/history/pack-openings')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)

    expect(historyResponse.body.history.length).toBe(1)
  })
})
```

### WebSocket Testing

WebSocket tests verify real-time communication.

```typescript
describe('WebSocket Pack Opening (e2e)', () => {
  let app: INestApplication
  let client: Socket
  let authToken: string
  let userPackId: string

  beforeAll(async () => {
    // Setup app and create test data
    // ... (similar to previous tests)
  })

  afterAll(async () => {
    client?.disconnect()
    await app.close()
  })

  it('should emit card reveals in sequence', (done) => {
    client = io('http://localhost:3000/game', {
      auth: { token: authToken }
    })

    const events: string[] = []

    client.on('connect', () => {
      client.emit('pack:open_request', { userPackId })
    })

    client.on('pack:open_started', (data) => {
      events.push('started')
      expect(data.cardCount).toBeGreaterThan(0)
    })

    let cardCount = 0
    client.on('pack:card_revealed', (data) => {
      events.push(`card-${data.cardIndex}`)
      cardCount++
    })

    client.on('pack:open_completed', (data) => {
      events.push('completed')
      
      // Verify event sequence
      expect(events[0]).toBe('started')
      expect(events[events.length - 1]).toBe('completed')
      expect(cardCount).toBe(data.totalCards)
      
      done()
    })

    client.on('error', (error) => {
      done(error)
    })
  })
})
```

### Test Coverage Goals

- **Unit Tests**: 80% code coverage minimum
- **Integration Tests**: All critical business flows
- **E2E Tests**: All major user journeys
- **Focus Areas**:
  - Transaction atomicity
  - Weighted random distribution
  - Idempotency guarantees
  - Error handling paths
  - Authentication and authorization

### Testing Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in afterEach/afterAll
3. **Determinism**: Avoid flaky tests with proper async handling
4. **Meaningful Names**: Test names should describe the scenario
5. **Arrange-Act-Assert**: Follow AAA pattern consistently
6. **Mock External Dependencies**: Use mocks for external services
7. **Test Edge Cases**: Include boundary conditions and error paths



## Logging and Monitoring

### Logging Strategy

The application implements structured logging with different levels and contexts.

#### Log Levels

- **ERROR**: System errors, exceptions, failed operations
- **WARN**: Recoverable issues, validation failures, rate limiting
- **INFO**: Important business events (user registration, pack opening, transactions)
- **DEBUG**: Detailed execution flow (development only)

#### Logging Interceptor

```typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, body, user } = request
    const requestId = randomUUID()
    
    // Attach request ID to request object
    request.id = requestId

    const startTime = Date.now()

    // Log incoming request
    this.logger.log({
      type: 'request',
      requestId,
      method,
      url,
      userId: user?.id,
      body: this.sanitizeBody(body),
      timestamp: new Date().toISOString()
    })

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime
          
          // Log successful response
          this.logger.log({
            type: 'response',
            requestId,
            method,
            url,
            userId: user?.id,
            statusCode: context.switchToHttp().getResponse().statusCode,
            duration,
            timestamp: new Date().toISOString()
          })
        },
        error: (error) => {
          const duration = Date.now() - startTime
          
          // Log error response
          this.logger.error({
            type: 'response',
            requestId,
            method,
            url,
            userId: user?.id,
            error: error.message,
            statusCode: error.status || 500,
            duration,
            timestamp: new Date().toISOString()
          })
        }
      })
    )
  }

  private sanitizeBody(body: any): any {
    if (!body) return body
    
    const sanitized = { ...body }
    
    // Remove sensitive fields
    if (sanitized.password) {
      sanitized.password = '[REDACTED]'
    }
    if (sanitized.passwordHash) {
      sanitized.passwordHash = '[REDACTED]'
    }
    
    return sanitized
  }
}
```

#### Business Event Logging

```typescript
class PackService {
  private readonly logger = new Logger(PackService.name)

  async purchasePack(userId: string, packId: string): Promise<UserPack> {
    this.logger.log({
      event: 'pack_purchase_started',
      userId,
      packId,
      timestamp: new Date().toISOString()
    })

    try {
      const result = await this.executePackPurchase(userId, packId)
      
      this.logger.log({
        event: 'pack_purchase_completed',
        userId,
        packId,
        userPackId: result.id,
        timestamp: new Date().toISOString()
      })
      
      return result
    } catch (error) {
      this.logger.error({
        event: 'pack_purchase_failed',
        userId,
        packId,
        error: error.message,
        timestamp: new Date().toISOString()
      })
      throw error
    }
  }

  async openPack(userId: string, userPackId: string): Promise<OpenPackResult> {
    this.logger.log({
      event: 'pack_opening_started',
      userId,
      userPackId,
      timestamp: new Date().toISOString()
    })

    const result = await this.executePackOpening(userId, userPackId)

    this.logger.log({
      event: 'pack_opening_completed',
      userId,
      userPackId,
      cardsReceived: result.cards.length,
      cardRarities: result.cards.map(c => c.rarity),
      isNewOpening: result.isNewOpening,
      timestamp: new Date().toISOString()
    })

    return result
  }
}
```

#### Database Query Logging

```typescript
// Prisma middleware for query logging
prisma.$use(async (params, next) => {
  const startTime = Date.now()
  
  const result = await next(params)
  
  const duration = Date.now() - startTime
  
  // Log slow queries (> 1000ms)
  if (duration > 1000) {
    logger.warn({
      type: 'slow_query',
      model: params.model,
      action: params.action,
      duration,
      timestamp: new Date().toISOString()
    })
  }
  
  return result
})
```

### Monitoring and Observability

#### Health Check Endpoint

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  async check(): Promise<HealthCheckResponse> {
    const startTime = Date.now()
    
    // Check database connectivity
    let dbStatus: 'connected' | 'disconnected' = 'disconnected'
    let dbResponseTime = 0
    
    try {
      const dbStartTime = Date.now()
      await this.prisma.$queryRaw`SELECT 1`
      dbResponseTime = Date.now() - dbStartTime
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = 'disconnected'
    }
    
    const status = dbStatus === 'connected' ? 'ok' : 'error'
    
    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal
      },
      version: this.configService.get('APP_VERSION') || '1.0.0'
    }
  }
}

interface HealthCheckResponse {
  status: 'ok' | 'error'
  timestamp: string
  uptime: number
  database: {
    status: 'connected' | 'disconnected'
    responseTime: number
  }
  memory: {
    used: number
    total: number
  }
  version: string
}
```

#### Metrics Collection

Key metrics to track:

**Business Metrics:**
- Pack purchases per hour
- Pack openings per hour
- Card sales per hour
- Average coins per user
- Most popular packs
- Rarity distribution in openings

**Technical Metrics:**
- Request rate (requests/second)
- Response time (P50, P95, P99)
- Error rate (errors/total requests)
- Database connection pool usage
- Memory usage
- CPU usage

**Example Metrics Service:**

```typescript
@Injectable()
export class MetricsService {
  private metrics = {
    packPurchases: 0,
    packOpenings: 0,
    cardSales: 0,
    errors: 0
  }

  incrementPackPurchases(): void {
    this.metrics.packPurchases++
  }

  incrementPackOpenings(): void {
    this.metrics.packOpenings++
  }

  incrementCardSales(): void {
    this.metrics.cardSales++
  }

  incrementErrors(): void {
    this.metrics.errors++
  }

  getMetrics(): Record<string, number> {
    return { ...this.metrics }
  }

  resetMetrics(): void {
    this.metrics = {
      packPurchases: 0,
      packOpenings: 0,
      cardSales: 0,
      errors: 0
    }
  }
}

// Expose metrics endpoint
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  getMetrics(): Record<string, number> {
    return this.metricsService.getMetrics()
  }
}
```

### Performance Monitoring

#### Response Time Tracking

```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Performance')

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const startTime = Date.now()

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime
        const { method, url } = request

        // Log slow requests (> 1000ms)
        if (duration > 1000) {
          this.logger.warn({
            type: 'slow_request',
            method,
            url,
            duration,
            timestamp: new Date().toISOString()
          })
        }

        // Track response time distribution
        this.trackResponseTime(url, duration)
      })
    )
  }

  private trackResponseTime(url: string, duration: number): void {
    // Implementation would send to metrics aggregation service
    // e.g., Prometheus, CloudWatch, Datadog
  }
}
```

### Alerting Strategy

#### Alert Conditions

**Critical Alerts** (immediate response required):
- Database connection failure
- Error rate > 5% for 5 minutes
- P95 response time > 2000ms for 10 minutes
- Memory usage > 90%

**Warning Alerts** (investigation needed):
- Error rate > 1% for 15 minutes
- P95 response time > 1000ms for 15 minutes
- Slow query detected (> 5 seconds)
- Unusual spike in pack purchases (potential abuse)

**Info Alerts** (monitoring):
- New user registrations spike
- Pack opening rate changes significantly
- Database connection pool near capacity

### Log Aggregation

For production environments, logs should be aggregated to a centralized system:

**Recommended Tools:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **CloudWatch Logs** (AWS)
- **Datadog**
- **Splunk**

**Log Format:**

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "context": "PackService",
  "event": "pack_opening_completed",
  "userId": "user-123",
  "userPackId": "pack-456",
  "cardsReceived": 3,
  "cardRarities": ["COMMON", "RARE", "COMMON"],
  "isNewOpening": true,
  "requestId": "req-789",
  "environment": "production",
  "version": "1.0.0"
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The Pack Opener Backend API contains several core algorithms and business logic components that are suitable for property-based testing. While much of the system involves database transactions and external dependencies (better tested with integration tests), the following properties capture universal invariants that should hold across all valid inputs.

### Property 1: Weighted Random Distribution Correctness

*For any* valid card pool with positive weights and any positive card count, the weighted random selection algorithm SHALL:
- Return exactly the requested number of cards
- Select cards with probability proportional to their weights
- Allow duplicate selections
- Only return cards that exist in the input pool

**Validates: Requirements 5.1, 5.7**

**Test Implementation Notes:**
- Generate random card pools with varying sizes (1-100 cards) and weight distributions
- Test with different card counts (1-11 cards per pack)
- Run 1000+ iterations to verify statistical distribution matches expected probabilities within 10% variance
- Verify all returned cards exist in the original pool
- Verify duplicates can occur

### Property 2: Pack Purchase Transaction Correctness

*For any* user with sufficient coin balance and any active pack, when a pack purchase succeeds, the system SHALL:
- Deduct exactly the pack price from the user's coin balance (newBalance = oldBalance - packPrice)
- Create exactly one UserPack record with PENDING status
- Create exactly one transaction record with type BUY_PACK and amount equal to negative pack price
- Record the correct balance_after value in the transaction

**Validates: Requirements 4.2, 4.3, 4.4**

**Test Implementation Notes:**
- Generate random user balances (1000-10000 coins) and pack prices (100-1000 coins)
- Use mocked database to verify all three operations occur
- Verify arithmetic: newBalance = oldBalance - packPrice
- Verify transaction.balanceAfter = newBalance

### Property 3: Pack Opening Generates Correct Card Count

*For any* UserPack with PENDING status and any pack definition with cardCount N, when the pack is opened, the system SHALL generate exactly N cards.

**Validates: Requirements 5.2**

**Test Implementation Notes:**
- Generate random pack configurations with cardCount ranging from 1-11
- Verify opening result contains exactly cardCount cards
- Test with various card pool sizes

### Property 4: Pack Opening Updates Inventory Correctly

*For any* pack opening that generates cards [C1, C2, ..., CN], the system SHALL update inventory such that:
- For each unique card C with count K in the opening, inventory quantity increases by K
- If card C did not exist in inventory before, a new inventory record is created with quantity K
- If card C existed in inventory with quantity Q, the new quantity is Q + K

**Validates: Requirements 5.5**

**Test Implementation Notes:**
- Generate random pack openings with varying card distributions
- Track inventory state before and after opening
- Verify quantity changes match card counts in opening result
- Test both new cards and existing cards in inventory

### Property 5: Pack Opening Idempotency

*For any* UserPack that has been opened, opening it again SHALL return the exact same cards in the same order without generating new random cards or modifying inventory.

**Validates: Requirements 5.6**

**Test Implementation Notes:**
- Open a pack and record the result
- Open the same pack again multiple times
- Verify all subsequent openings return identical card lists
- Verify inventory is not modified on subsequent openings
- Verify no new PackOpeningResult records are created

### Property 6: Card Selling Transaction Correctness

*For any* user selling a card they own with quantity Q, selling amount S where S ≤ Q, the system SHALL:
- Decrease inventory quantity by S (newQuantity = Q - S)
- Increase user balance by (sellPrice × S) where sellPrice is the card's sell price
- Create a transaction record with type SELL_CARD and amount = (sellPrice × S)
- Delete the inventory record if newQuantity = 0

**Validates: Requirements 8.2, 8.3, 8.4, 8.6**

**Test Implementation Notes:**
- Generate random inventory quantities (1-100) and sell amounts (1-quantity)
- Generate random sell prices (10-1000 coins)
- Verify arithmetic: newQuantity = oldQuantity - sellAmount
- Verify arithmetic: newBalance = oldBalance + (sellPrice × sellAmount)
- Verify inventory deletion when quantity reaches exactly 0

### Property 7: Insufficient Balance Rejection

*For any* user with coin balance B and any pack with price P where B < P, attempting to purchase the pack SHALL fail with a 402 Payment Required error without modifying the user's balance or creating any records.

**Validates: Requirements 4.6**

**Test Implementation Notes:**
- Generate random cases where balance < price (e.g., balance = price - random(1, price))
- Verify error is thrown
- Verify balance remains unchanged
- Verify no UserPack or Transaction records are created

### Property 8: Insufficient Quantity Rejection

*For any* user attempting to sell quantity S of a card they own with quantity Q where S > Q, the sell operation SHALL fail with a 400 Bad Request error without modifying inventory or balance.

**Validates: Requirements 8.8**

**Test Implementation Notes:**
- Generate random cases where sellQuantity > ownedQuantity
- Verify error is thrown
- Verify inventory quantity remains unchanged
- Verify balance remains unchanged
- Verify no transaction record is created

### Property Testing Configuration

All property-based tests SHALL:
- Run a minimum of 100 iterations per property
- Use a property-based testing library (e.g., fast-check for TypeScript)
- Include the property number and description in test tags
- Tag format: `Feature: pack-opener-backend-api, Property {number}: {property title}`

### Properties Not Suitable for PBT

The following aspects of the system are NOT suitable for property-based testing and should use integration/example-based tests instead:

- **Database transaction atomicity** (Requirements 4.5, 8.5): Test with integration tests that force failures
- **Authentication and JWT generation** (Requirements 1.7, 2.5): Test with example-based unit tests
- **Database constraints** (Requirements 1.9, 18.2-18.4): Test with integration tests
- **WebSocket event sequencing** (Requirement 14): Test with E2E WebSocket tests
- **API endpoint routing and HTTP status codes**: Test with E2E API tests
- **Password hashing configuration** (Requirement 1.4): Test with unit tests

These components involve external systems, configuration, or are already tested by their underlying libraries.



## Security Considerations

### Authentication and Authorization

#### JWT Token Security

```typescript
// JWT Configuration
{
  secret: process.env.JWT_SECRET,  // Strong random secret (min 32 characters)
  expiresIn: '24h',                // Token expiration
  algorithm: 'HS256'               // HMAC SHA-256
}

// Token Payload
{
  sub: userId,      // Subject (user ID)
  email: userEmail,
  iat: issuedAt,    // Issued at timestamp
  exp: expiration   // Expiration timestamp
}
```

**Security Measures:**
- JWT secret stored in environment variables, never in code
- Tokens expire after 24 hours
- No sensitive data (passwords, payment info) in token payload
- Token validation on every protected endpoint

#### Password Security

```typescript
// Password Hashing Configuration
const BCRYPT_ROUNDS = 12  // Cost factor for bcrypt

// Password Requirements
- Minimum length: 6 characters
- Hashed using bcrypt with cost factor 12
- Original password never stored or logged
- Password hash never exposed in API responses
```

#### Route Protection

```typescript
// Public Routes (no authentication required)
GET  /health
GET  /packs
GET  /packs/:id
GET  /cards
GET  /cards/:id

// Protected Routes (JWT required)
GET    /users/me
PATCH  /users/me
POST   /packs/:id/buy
GET    /user-packs
POST   /user-packs/:id/open
GET    /inventory
GET    /inventory/summary
GET    /inventory/:cardId
POST   /inventory/sell
GET    /transactions
GET    /history/pack-openings

// WebSocket (JWT required in handshake)
WS /game
```

### Input Validation

All inputs are validated using class-validator decorators:

```typescript
// Example: Registration DTO
export class RegisterDto {
  @IsEmail()
  @MaxLength(255)
  email: string

  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password: string

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string
}

// Example: Sell Card DTO
export class SellCardDto {
  @IsUUID()
  cardId: string

  @IsInt()
  @Min(1)
  @Max(1000)
  quantity: number
}
```

**Validation Rules:**
- All string inputs have maximum length limits
- Numeric inputs have min/max bounds
- UUIDs validated for correct format
- Email addresses validated for correct format
- Enum values validated against allowed values

### Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
// Rate Limiting Configuration
{
  '/auth/register': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5                      // 5 requests per window
  },
  '/auth/login': {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 10                     // 10 requests per window
  },
  '/packs/:id/buy': {
    windowMs: 60 * 1000,       // 1 minute
    max: 10                     // 10 purchases per minute
  },
  '/user-packs/:id/open': {
    windowMs: 60 * 1000,       // 1 minute
    max: 20                     // 20 openings per minute
  }
}
```

### SQL Injection Prevention

- Prisma ORM provides automatic SQL injection prevention
- All queries use parameterized statements
- No raw SQL queries with user input concatenation
- Input validation before database operations

### CORS Configuration

```typescript
// CORS Settings
{
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Sensitive Data Handling

**Never Log or Expose:**
- Password hashes
- JWT secrets
- Database connection strings
- Internal error stack traces (in production)

**Sanitization in Logs:**
```typescript
private sanitizeForLogging(data: any): any {
  const sanitized = { ...data }
  const sensitiveFields = ['password', 'passwordHash', 'token', 'secret']
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  }
  
  return sanitized
}
```

## Deployment Considerations

### Environment Configuration

```bash
# Required Environment Variables
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-secret-key-min-32-characters
PORT=3000
NODE_ENV=production

# Optional Environment Variables
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
LOG_LEVEL=info
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=24h
```

### Database Setup

#### Initial Migration

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data (optional)
npx prisma db seed
```

#### Database Indexes

Ensure these indexes exist for optimal performance:

```sql
CREATE INDEX idx_user_packs_user_id ON user_packs(user_id);
CREATE INDEX idx_user_packs_status ON user_packs(status);
CREATE INDEX idx_inventory_user_id ON inventory(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_pack_card_pool_pack_id ON pack_card_pool(pack_id);
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/packopener
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=packopener
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

### Production Checklist

**Before Deployment:**
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] JWT secret is strong and unique
- [ ] CORS origins configured correctly
- [ ] Rate limiting enabled
- [ ] Logging configured for production
- [ ] Health check endpoint tested
- [ ] Database connection pool sized appropriately
- [ ] SSL/TLS certificates configured
- [ ] Backup strategy in place

**Monitoring Setup:**
- [ ] Health check monitoring configured
- [ ] Error rate alerts configured
- [ ] Response time monitoring enabled
- [ ] Database performance monitoring enabled
- [ ] Log aggregation configured
- [ ] Uptime monitoring configured

### Scaling Considerations

#### Horizontal Scaling

The application is stateless and can be horizontally scaled:

```yaml
# Kubernetes Deployment Example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pack-opener-api
spec:
  replicas: 3  # Run 3 instances
  selector:
    matchLabels:
      app: pack-opener-api
  template:
    metadata:
      labels:
        app: pack-opener-api
    spec:
      containers:
      - name: api
        image: pack-opener-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

#### Database Connection Pooling

```typescript
// Prisma Connection Pool Configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Connection pool settings in DATABASE_URL
postgresql://user:password@host:5432/dbname?connection_limit=10&pool_timeout=20
```

**Recommended Pool Sizes:**
- Development: 5-10 connections
- Production (per instance): 10-20 connections
- Total connections should not exceed PostgreSQL max_connections

#### Caching Strategy

For frequently accessed data that rarely changes:

```typescript
// Cache pack definitions (rarely change)
@Injectable()
export class PackService {
  private packCache: Map<string, PackDefinition> = new Map()
  private cacheExpiry: number = 5 * 60 * 1000  // 5 minutes

  async findAllActive(): Promise<PackDefinition[]> {
    // Check cache first
    // Fetch from DB if cache miss or expired
    // Update cache
  }
}
```

**Cacheable Data:**
- Pack definitions (5 minute TTL)
- Card catalog (10 minute TTL)
- Pack drop odds (5 minute TTL)

**Never Cache:**
- User balances
- Inventory quantities
- Transaction history
- User pack status

### Backup and Recovery

**Database Backup Strategy:**
- Daily full backups
- Hourly incremental backups
- 30-day retention period
- Automated backup verification

**Critical Data:**
- Users table (account data)
- Transactions table (immutable financial records)
- Pack_opening_results table (immutable game history)
- Inventory table (user assets)

**Recovery Procedures:**
- Document restore process
- Test recovery regularly
- Maintain backup of environment variables
- Keep migration history

## Summary

This design document specifies a comprehensive NestJS-based backend API for a card pack opening game. The architecture follows modular design principles with clear separation of concerns across 8 database tables, 21 REST endpoints, and WebSocket support for real-time experiences.

**Key Design Highlights:**

1. **Atomic Transactions**: All coin-related operations use database transactions to ensure data consistency
2. **Idempotent Operations**: Pack opening returns cached results for already-opened packs
3. **Weighted Random Algorithm**: Mathematically sound card distribution based on rarity weights
4. **Comprehensive Error Handling**: Global exception filters with consistent error responses
5. **Security First**: JWT authentication, bcrypt password hashing, input validation, and rate limiting
6. **Property-Based Testing**: Core business logic validated with universal properties
7. **Observability**: Structured logging, health checks, and performance monitoring
8. **Scalability**: Stateless design enabling horizontal scaling

The system is designed to handle the complete player lifecycle from registration through pack purchasing, opening, inventory management, and card trading, with robust error handling and monitoring to ensure a reliable gaming experience.

