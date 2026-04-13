# Kế hoạch Implementation: Pack Opener Game Backend API

## Tổng quan

Tài liệu này mô tả các tasks cần thực hiện để implement Pack Opener Game Backend API - một REST API với WebSocket support được xây dựng bằng NestJS. Hệ thống cho phép người chơi đăng ký tài khoản, mua pack thẻ bằng coins, mở pack để nhận thẻ ngẫu nhiên, quản lý inventory, bán thẻ, và xem lịch sử giao dịch.

## Danh sách Tasks

- [ ] 1. Cấu hình Database Schema và Prisma
  - Cập nhật Prisma schema với đầy đủ models theo design
  - Tạo và chạy migrations
  - Cấu hình Prisma Client với output path
  - Tạo seed data cho cards và pack definitions
  - _Requirements: 18.1-18.10_

- [ ] 2. Implement Core Infrastructure Modules
  - [ ] 2.1 Cấu hình ConfigModule và ConfigService
    - Tạo ConfigService để quản lý environment variables
    - Validate các biến môi trường bắt buộc (DATABASE_URL, JWT_SECRET)
    - Export ConfigModule globally
    - _Requirements: 15.1_

  - [ ] 2.2 Implement PrismaService và PrismaModule
    - Tạo PrismaService extends PrismaClient
    - Implement lifecycle hooks (onModuleInit, onModuleDestroy)
    - Cấu hình connection pooling
    - Export PrismaModule globally
    - _Requirements: 18.1_

  - [ ] 2.3 Implement RandomService cho weighted random algorithm
    - Implement selectWeighted method với thuật toán cumulative weight
    - Validate inputs (pool không rỗng, weights dương, count dương)
    - Hỗ trợ duplicate selections
    - _Requirements: 5.1, 5.7_

  - [ ]* 2.4 Viết property test cho RandomService
    - **Property 1: Weighted Random Distribution Correctness**
    - **Validates: Requirements 5.1, 5.7**
    - Test với 1000+ iterations để verify phân phối xác suất
    - Verify số lượng cards trả về chính xác
    - Verify tất cả cards thuộc pool ban đầu
    - Verify duplicates có thể xảy ra

- [ ] 3. Implement Authentication Module
  - [ ] 3.1 Tạo AuthModule, AuthService, AuthController
    - Setup module với imports (JwtModule, UserModule, PrismaModule)
    - Tạo RegisterDto và LoginDto với validation decorators
    - Implement password hashing với bcrypt (cost factor 12)
    - _Requirements: 1.4, 15.1_

  - [ ] 3.2 Implement user registration với atomic transaction
    - Validate email uniqueness
    - Hash password với bcrypt
    - Tạo user với 1000 coins ban đầu
    - Tạo INITIAL_CREDIT transaction record
    - Wrap trong Prisma transaction
    - _Requirements: 1.1, 1.2, 1.10_

  - [ ] 3.3 Implement user login và JWT generation
    - Validate credentials
    - Generate JWT token với 24h expiration
    - Return access token và user info
    - _Requirements: 1.7, 1.8_

  - [ ] 3.4 Implement JwtStrategy và JwtAuthGuard
    - Tạo JwtStrategy extends PassportStrategy
    - Validate JWT payload và extract user
    - Tạo JwtAuthGuard extends AuthGuard('jwt')
    - _Requirements: 2.5_

  - [ ] 3.5 Tạo CurrentUser decorator
    - Extract authenticated user từ request context
    - Sử dụng createParamDecorator
    - _Requirements: 2.1_

  - [ ]* 3.6 Viết unit tests cho AuthService
    - Test registration success case
    - Test email conflict (409 error)
    - Test login success và failure cases
    - Test password hashing

- [ ] 4. Checkpoint - Kiểm tra authentication flow
  - Đảm bảo registration và login hoạt động
  - Verify JWT token được generate đúng
  - Test protected routes với JwtAuthGuard
  - Hỏi user nếu có vấn đề phát sinh

- [ ] 5. Implement User Module
  - [ ] 5.1 Tạo UserModule, UserService, UserController
    - Setup module với PrismaModule import
    - Tạo UpdateUserDto với validation
    - _Requirements: 2.1-2.4_

  - [ ] 5.2 Implement GET /users/me endpoint
    - Protect với JwtAuthGuard
    - Return user profile (không expose password hash)
    - _Requirements: 2.1, 2.4_

  - [ ] 5.3 Implement PATCH /users/me endpoint
    - Validate và update username
    - Return updated user profile
    - _Requirements: 2.3_

  - [ ]* 5.4 Viết unit tests cho UserService
    - Test findById, findByEmail
    - Test updateProfile

- [ ] 6. Implement Card Module
  - [ ] 6.1 Tạo CardModule, CardService, CardController
    - Setup module với PrismaModule
    - Tạo DTOs cho filters và pagination
    - _Requirements: 11.1-11.8_

  - [ ] 6.2 Implement GET /cards endpoint với filters
    - Support rarity, position, search filters
    - Support sorting (overall, name, rarity)
    - Support pagination (limit, offset)
    - Public endpoint (không cần auth)
    - _Requirements: 11.1-11.6_

  - [ ] 6.3 Implement GET /cards/:id endpoint
    - Return complete card information
    - Public endpoint
    - _Requirements: 11.8_

  - [ ]* 6.4 Viết integration tests cho CardController
    - Test filtering và sorting
    - Test pagination
    - Test card details endpoint

- [ ] 7. Implement Pack Module
  - [ ] 7.1 Tạo PackModule, PackService, PackController
    - Setup module với PrismaModule, RandomModule
    - Tạo DTOs cho pack responses
    - _Requirements: 3.1-3.6_

  - [ ] 7.2 Implement GET /packs endpoint
    - Return active packs sorted by price ascending
    - Public endpoint
    - _Requirements: 3.1, 3.2_

  - [ ] 7.3 Implement GET /packs/:id endpoint với drop odds
    - Calculate drop odds từ PackCardPool weights
    - Return pack details với probability percentages
    - Public endpoint
    - _Requirements: 3.3, 3.4_

  - [ ]* 7.4 Viết unit tests cho PackService
    - Test getActivePacks
    - Test calculateDropOdds algorithm

- [ ] 8. Implement Pack Purchase Logic
  - [ ] 8.1 Implement POST /packs/:id/buy endpoint
    - Protect với JwtAuthGuard
    - Validate pack exists và is_active
    - _Requirements: 4.1, 4.7, 4.8, 4.9_

  - [ ] 8.2 Implement purchasePack với atomic transaction
    - Verify sufficient coins (throw 402 nếu không đủ)
    - Deduct pack price từ user balance
    - Create UserPack với PENDING status
    - Create BUY_PACK transaction record
    - Wrap tất cả trong Prisma transaction
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.3 Viết property test cho pack purchase
    - **Property 2: Pack Purchase Transaction Correctness**
    - **Validates: Requirements 4.2, 4.3, 4.4**
    - Verify newBalance = oldBalance - packPrice
    - Verify transaction.balanceAfter = newBalance
    - Verify UserPack và Transaction được tạo

  - [ ]* 8.4 Viết property test cho insufficient balance
    - **Property 7: Insufficient Balance Rejection**
    - **Validates: Requirements 4.6**
    - Test cases với balance < price
    - Verify 402 error được throw
    - Verify không có records được tạo

- [ ] 9. Checkpoint - Kiểm tra pack catalog và purchase
  - Test pack listing và details endpoints
  - Test pack purchase với sufficient và insufficient coins
  - Verify transactions được ghi nhận đúng
  - Hỏi user nếu có vấn đề

- [ ] 10. Implement Pack Opening Logic
  - [ ] 10.1 Tạo UserPackModule, UserPackService, UserPackController
    - Setup module với PrismaModule, RandomModule
    - Tạo DTOs cho pack opening responses
    - _Requirements: 5.1-5.10_

  - [ ] 10.2 Implement GET /user-packs endpoint
    - List user's packs với status filter
    - Support pagination
    - Sort by purchasedAt descending
    - _Requirements: 12.1-12.7_

  - [ ] 10.3 Implement idempotency check cho pack opening
    - Check nếu pack đã OPENED
    - Return cached PackOpeningResult nếu đã mở
    - Set isNewOpening = false
    - _Requirements: 5.6_

  - [ ] 10.4 Implement POST /user-packs/:id/open với atomic transaction
    - Verify ownership (throw 403 nếu không phải owner)
    - Get card pool cho pack
    - Use RandomService.selectWeighted để chọn cards
    - Update UserPack status thành OPENED
    - Create PackOpeningResult với card snapshots (JSONB)
    - Update inventory cho mỗi card (upsert)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8, 5.9_

  - [ ]* 10.5 Viết property test cho pack opening card count
    - **Property 3: Pack Opening Generates Correct Card Count**
    - **Validates: Requirements 5.2**
    - Test với cardCount từ 1-11
    - Verify số cards trả về = cardCount

  - [ ]* 10.6 Viết property test cho inventory updates
    - **Property 4: Pack Opening Updates Inventory Correctly**
    - **Validates: Requirements 5.5**
    - Track inventory trước và sau opening
    - Verify quantity increases đúng
    - Test cả new cards và existing cards

  - [ ]* 10.7 Viết property test cho idempotency
    - **Property 5: Pack Opening Idempotency**
    - **Validates: Requirements 5.6**
    - Open pack nhiều lần
    - Verify cards giống nhau mỗi lần
    - Verify inventory không thay đổi lần 2+

- [ ] 11. Implement Inventory Module
  - [ ] 11.1 Tạo InventoryModule, InventoryService, InventoryController
    - Setup module với PrismaModule
    - Tạo DTOs cho filters, pagination, sell
    - _Requirements: 6.1-6.10, 7.1-7.4_

  - [ ] 11.2 Implement GET /inventory endpoint với filters
    - Filter by rarity, position, search
    - Sort by overall, name, rarity, quantity
    - Support pagination
    - Return only cards với quantity > 0
    - _Requirements: 6.1-6.9_

  - [ ] 11.3 Implement GET /inventory/summary endpoint
    - Calculate total cards, unique cards
    - Aggregate cards by rarity
    - Calculate total value
    - _Requirements: 6.10_

  - [ ] 11.4 Implement GET /inventory/:cardId endpoint
    - Return card details với quantity owned
    - Throw 404 nếu card không trong inventory
    - _Requirements: 7.1-7.4_

  - [ ]* 11.5 Viết integration tests cho InventoryController
    - Test filtering và sorting
    - Test summary calculations
    - Test inventory item details

- [ ] 12. Implement Card Selling Logic
  - [ ] 12.1 Implement POST /inventory/sell endpoint
    - Validate quantity > 0
    - Verify user owns card với sufficient quantity
    - _Requirements: 8.1, 8.7, 8.8, 8.9_

  - [ ] 12.2 Implement sellCard với atomic transaction
    - Decrease inventory quantity
    - Delete inventory nếu quantity = 0
    - Increase user balance by (sellPrice × quantity)
    - Create SELL_CARD transaction record
    - _Requirements: 8.2, 8.3, 8.4, 8.5, 8.6, 8.10_

  - [ ]* 12.3 Viết property test cho card selling
    - **Property 6: Card Selling Transaction Correctness**
    - **Validates: Requirements 8.2, 8.3, 8.4, 8.6**
    - Verify newQuantity = oldQuantity - sellAmount
    - Verify newBalance = oldBalance + (sellPrice × sellAmount)
    - Verify inventory deletion khi quantity = 0

  - [ ]* 12.4 Viết property test cho insufficient quantity
    - **Property 8: Insufficient Quantity Rejection**
    - **Validates: Requirements 8.8**
    - Test với sellQuantity > ownedQuantity
    - Verify 400 error được throw
    - Verify không có changes

- [ ] 13. Checkpoint - Kiểm tra pack opening và inventory
  - Test pack opening flow hoàn chỉnh
  - Verify inventory được update đúng
  - Test card selling với các scenarios khác nhau
  - Verify idempotency của pack opening
  - Hỏi user nếu có vấn đề

- [ ] 14. Implement Transaction Module
  - [ ] 14.1 Tạo TransactionModule, TransactionService, TransactionController
    - Setup module với PrismaModule
    - Tạo DTOs cho filters và pagination
    - _Requirements: 9.1-9.7_

  - [ ] 14.2 Implement GET /transactions endpoint
    - Filter by transaction type
    - Sort by createdAt descending
    - Support pagination
    - Return transaction history cho authenticated user
    - _Requirements: 9.1-9.6_

  - [ ]* 14.3 Viết integration tests cho TransactionController
    - Test filtering by type
    - Test pagination
    - Test sorting order

- [ ] 15. Implement Pack Opening History
  - [ ] 15.1 Tạo HistoryModule, HistoryService, HistoryController
    - Setup module với PrismaModule
    - Tạo DTOs cho history responses
    - _Requirements: 10.1-10.7_

  - [ ] 15.2 Implement GET /history/pack-openings endpoint
    - Return opened UserPacks với PackOpeningResult
    - Include card snapshots từ JSONB
    - Sort by openedAt descending
    - Support pagination
    - _Requirements: 10.1-10.6_

  - [ ]* 15.3 Viết integration tests cho HistoryController
    - Test pack opening history retrieval
    - Test pagination
    - Verify card snapshots được return đúng

- [ ] 16. Implement WebSocket Gateway
  - [ ] 16.1 Setup GameGateway với Socket.IO
    - Install @nestjs/websockets và socket.io
    - Tạo GameGateway với namespace '/game'
    - Configure CORS cho WebSocket
    - _Requirements: 14.1_

  - [ ] 16.2 Implement WebSocket authentication
    - Extract JWT từ handshake
    - Validate token và extract user
    - Reject connection nếu invalid token
    - _Requirements: 14.1, 14.2_

  - [ ] 16.3 Implement user rooms
    - Create room cho mỗi user: "room-{userId}"
    - Join user vào room khi connect
    - _Requirements: 14.8_

  - [ ] 16.4 Implement pack:open_request handler
    - Validate pack ownership
    - Call UserPackService.openPack
    - Emit pack:open_started event
    - Emit pack:card_revealed cho mỗi card với 500ms delay
    - Emit pack:open_completed event
    - Emit balance:updated event
    - Handle errors và emit error event
    - _Requirements: 14.3-14.7, 14.9, 14.10, 14.12_

  - [ ] 16.5 Implement rate limiting cho WebSocket
    - Limit 10 events per second per user
    - _Requirements: 14.11_

  - [ ]* 16.6 Viết E2E tests cho WebSocket
    - Test connection với valid/invalid JWT
    - Test pack opening flow
    - Test event sequencing
    - Test error handling

- [ ] 17. Implement Global Filters và Interceptors
  - [ ] 17.1 Implement HttpExceptionFilter
    - Catch tất cả exceptions
    - Handle HttpException, PrismaClientKnownRequestError
    - Return consistent error response format
    - Log errors với context
    - _Requirements: 16.1-16.6_

  - [ ] 17.2 Implement LoggingInterceptor
    - Log incoming requests (method, path, userId)
    - Log outgoing responses (status, duration)
    - Use structured logging format
    - _Requirements: 17.1-17.7_

  - [ ] 17.3 Apply global filters và interceptors
    - Register HttpExceptionFilter globally
    - Register LoggingInterceptor globally
    - Configure ValidationPipe globally
    - _Requirements: 15.1-15.4_

- [ ] 18. Implement Health Check
  - [ ] 18.1 Tạo HealthModule và HealthController
    - Setup module với PrismaModule
    - _Requirements: 13.1-13.5_

  - [ ] 18.2 Implement GET /health endpoint
    - Check application status
    - Verify database connectivity
    - Return status, uptime, database info
    - Public endpoint
    - _Requirements: 13.1-13.5_

  - [ ]* 18.3 Viết integration tests cho health check
    - Test với database connected
    - Test response format

- [ ] 19. Checkpoint - Kiểm tra toàn bộ hệ thống
  - Test tất cả REST endpoints
  - Test WebSocket pack opening flow
  - Verify error handling hoạt động đúng
  - Test logging và health check
  - Chạy tất cả tests (unit, integration, E2E)
  - Hỏi user nếu có vấn đề

- [ ] 20. Setup Environment Configuration và Documentation
  - [ ] 20.1 Tạo .env.example file
    - Document tất cả environment variables
    - Provide example values
    - _Requirements: 15.1_

  - [ ] 20.2 Update README.md
    - Installation instructions
    - Environment setup
    - Database migration commands
    - Running the application
    - API documentation link

  - [ ] 20.3 Setup Swagger/OpenAPI documentation
    - Install @nestjs/swagger
    - Add ApiTags, ApiOperation decorators
    - Configure SwaggerModule
    - Generate API documentation

- [ ] 21. Final Testing và Optimization
  - [ ]* 21.1 Chạy tất cả property-based tests
    - Verify tất cả 8 properties pass
    - Run với minimum 100 iterations mỗi property
    - Document test results

  - [ ]* 21.2 Chạy integration tests
    - Test database transactions
    - Test error scenarios
    - Test concurrent operations

  - [ ]* 21.3 Chạy E2E tests
    - Test complete user flows
    - Test WebSocket scenarios
    - Test error handling end-to-end

  - [ ] 21.4 Performance optimization
    - Review database queries
    - Add missing indexes nếu cần
    - Optimize N+1 queries
    - _Requirements: 19.1-19.5_

  - [ ] 21.5 Security review
    - Verify JWT configuration
    - Check password hashing
    - Review input validation
    - Test rate limiting
    - _Requirements: 15.1-15.8_

## Ghi chú

- Tasks đánh dấu `*` là optional và có thể skip để có MVP nhanh hơn
- Mỗi task reference đến requirements cụ thể để dễ traceability
- Các checkpoint tasks giúp validate tiến độ và catch errors sớm
- Property tests validate universal correctness properties từ design document
- Unit tests và integration tests validate specific examples và edge cases
- Tất cả mô tả và comments trong code nên bằng tiếng Anh (best practice)
- Commit messages và documentation có thể bằng tiếng Việt hoặc tiếng Anh tùy team

## Thứ tự thực hiện đề xuất

1. **Phase 1 (Tasks 1-4)**: Setup infrastructure và authentication
2. **Phase 2 (Tasks 5-9)**: Implement core modules (User, Card, Pack purchase)
3. **Phase 3 (Tasks 10-13)**: Implement game logic (Pack opening, Inventory, Selling)
4. **Phase 4 (Tasks 14-16)**: Implement history và WebSocket
5. **Phase 5 (Tasks 17-21)**: Global concerns, health check, testing, optimization

Mỗi phase kết thúc với checkpoint để đảm bảo chất lượng trước khi tiếp tục.
