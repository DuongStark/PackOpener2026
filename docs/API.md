# PackOpener API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

API yêu cầu JWT token cho các endpoint bảo vệ. Token được gửi trong header:
```
Authorization: Bearer <token>
```

---

## Enum Values

### Position
`GK`, `CB`, `LB`, `RB`, `LM`, `RM`, `CM`, `CDM`, `CAM`, `LW`, `RW`, `ST`

### Rarity
`BRONZE_COMMON`, `BRONZE_RARE`, `SILVER_COMMON`, `SILVER_RARE`, `GOLD_COMMON`, `GOLD_RARE`, `GOLD_EPIC`, `DIAMOND_COMMON`, `DIAMOND_RARE`

### Role
`USER`, `ADMIN`

### Status (Inventory)
`IN_INVENTORY`, `LISTED`, `SOLD`, `BURNED`

### Type (Transaction)
`BUY_PACK`, `SELL_CARD`, `INITIAL_CREDIT`, `ADMIN_ADJUSTMENT`

### PackStatus
`PENDING`, `OPENED`

### SortOrder
`asc`, `desc`

---

## 1. Auth Module

### POST /auth/register - Đăng ký tài khoản mới

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Email hợp lệ |
| password | string | Yes | Tối thiểu 6 ký tự |
| username | string | Yes | 6-20 ký tự, phải có cả chữ và số |

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username123",
    "role": "USER",
    "balance": 10000
  }
}
```

---

### POST /auth/login - Đăng nhập

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username123",
    "role": "USER",
    "balance": 10000
  }
}
```

---

## 2. User Module

### GET /me - Lấy thông tin user hiện tại

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username123",
  "role": "USER",
  "balance": 10000,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /me - Cập nhật username

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "username": "newusername123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | 6-100 ký tự |

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "newusername123",
  "role": "USER",
  "balance": 10000
}
```

---

## 3. User-Pack Module

### GET /user-packs - Lấy danh sách pack của user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Số trang |
| limit | number | 20 | Số items/trang (max 100) |
| status | string | - | Lọc theo PackStatus: `PENDING`, `OPENED` |
| includeCards | boolean | false | Bao gồm cards trong response |

**Example:** `/user-packs?page=1&limit=20&status=PENDING&includeCards=true`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "packId": "uuid",
      "userId": "uuid",
      "status": "PENDING",
      "pack": {
        "id": "uuid",
        "name": "Premium Pack",
        "price": 500
      }
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 20
}
```

---

### GET /user-packs/:id - Lấy pack chi tiết

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "packId": "uuid",
  "userId": "uuid",
  "status": "PENDING",
  "openedAt": null,
  "pack": {
    "id": "uuid",
    "name": "Premium Pack",
    "price": 500
  }
}
```

---

### POST /packs/:id/buy - Mua pack

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | ID của pack |

**Response (200):**
```json
{
  "userPackId": "uuid",
  "packName": "Premium Pack",
  "price": 500,
  "newBalance": 9500,
  "status": "PENDING"
}
```

---

### POST /user-packs/:id/open - Mở pack

**Headers:** `Authorization: Bearer <token>`

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| id | string | ID của user pack |

**Response (200):**
```json
{
  "userPackId": "uuid",
  "openedAt": "2024-01-01T00:00:00.000Z",
  "cards": [
    {
      "cardId": "uuid",
      "name": "Lionel Messi",
      "rarity": "GOLD_EPIC",
      "overall": 93,
      "pace": 85,
      "shooting": 92,
      "passing": 91,
      "dribbling": 95,
      "defending": 45,
      "position": "ST",
      "club": "Inter Miami",
      "nation": "Argentina",
      "imageUrl": "https://..."
    }
  ]
}
```

---

## 4. Transaction Module

### GET /transactions - Lấy lịch sử giao dịch

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Số trang (default: 1) |
| limit | number | Số items/trang (default: 20, max: 100) |
| type | string | Lọc theo Type: `BUY_PACK`, `SELL_CARD`, `INITIAL_CREDIT`, `ADMIN_ADJUSTMENT` |
| from | string | Lọc từ ngày (ISO date) |
| to | string | Lọc đến ngày (ISO date) |

**Example:** `/transactions?page=1&limit=10&type=BUY_PACK&from=2024-01-01&to=2024-12-31`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "BUY_PACK",
      "amount": 500,
      "description": "Bought Premium Pack",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10
}
```

---

### GET /transactions/:id - Lấy giao dịch chi tiết

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "BUY_PACK",
  "amount": 500,
  "description": "Bought Premium Pack",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## 5. Pack Module (Public)

### GET /packs - Lấy danh sách packs

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | Số trang |
| limit | number | 10 | Số items/trang |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Premium Pack",
      "price": 500,
      "description": "Contains 5 cards",
      "imageUrl": "https://..."
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 10
}
```

---

### GET /packs/:id - Lấy pack chi tiết

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Premium Pack",
  "price": 500,
  "description": "Contains 5 cards",
  "imageUrl": "https://..."
}
```

---

## 6. Inventory Module

### GET /inventory - Lấy inventory của user

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Số trang (default: 1) |
| limit | number | Số items/trang (default: 20, max: 100) |
| rarity | string | Lọc theo Rarity |
| position | string | Lọc theo Position |
| search | string | Tìm kiếm theo tên |
| sortBy | string | Sắp xếp: `overall`, `name`, `rarity` |
| sortOrder | string | Thứ tự: `asc`, `desc` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "cardId": "uuid",
      "userId": "uuid",
      "quantity": 1,
      "status": "IN_INVENTORY",
      "card": {
        "id": "uuid",
        "name": "Lionel Messi",
        "rarity": "GOLD_EPIC",
        "overall": 93,
        "position": "ST",
        "imageUrl": "https://..."
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET /inventory/summary - Lấy tổng quan inventory

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "totalCards": 100,
  "totalValue": 50000,
  "byRarity": {
    "GOLD_EPIC": 5,
    "GOLD_RARE": 20,
    "SILVER_RARE": 30,
    "BRONZE_COMMON": 45
  }
}
```

---

### GET /inventory/:id - Lấy item inventory chi tiết

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": "uuid",
  "cardId": "uuid",
  "userId": "uuid",
  "quantity": 1,
  "status": "IN_INVENTORY",
  "card": {
    "id": "uuid",
    "name": "Lionel Messi",
    "rarity": "GOLD_EPIC",
    "overall": 93,
    "position": "ST",
    "imageUrl": "https://..."
  }
}
```

---

### POST /inventory/sell - Bán card

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "cardId": "uuid-cua-card",
  "quantity": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cardId | string (UUID) | Yes | ID của card |
| quantity | number | Yes | Số lượng bán (>=1) |

**Response (200):**
```json
{
  "success": true,
  "soldQuantity": 1,
  "totalEarned": 1000,
  "newBalance": 10500
}
```

---

## 7. Card Module (Public)

### GET /cards - Lấy danh sách cards

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Số trang (default: 1) |
| limit | number | Số items/trang (default: 20, max: 100) |
| rarity | string | Lọc theo Rarity |
| position | string | Lọc theo Position |
| search | string | Tìm kiếm theo tên |
| sortBy | string | Sắp xếp: `overall`, `name`, `rarity` |
| sortOrder | string | Thứ tự: `asc`, `desc` |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Lionel Messi",
      "rarity": "GOLD_EPIC",
      "overall": 93,
      "pace": 85,
      "shooting": 92,
      "passing": 91,
      "dribbling": 95,
      "defending": 45,
      "position": "ST",
      "club": "Inter Miami",
      "nation": "Argentina",
      "imageUrl": "https://..."
    }
  ],
  "total": 500,
  "page": 1,
  "limit": 20
}
```

---

### GET /cards/:id - Lấy card chi tiết

**Response (200):**
```json
{
  "id": "uuid",
  "name": "Lionel Messi",
  "rarity": "GOLD_EPIC",
  "overall": 93,
  "pace": 85,
  "shooting": 92,
  "passing": 91,
  "dribbling": 95,
  "defending": 45,
  "position": "ST",
  "club": "Inter Miami",
  "nation": "Argentina",
  "imageUrl": "https://..."
}
```

---

## 8. Health Module

### GET /health - Health check

**Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "uptime": 3600
}
```

**Response (503):**
```json
{
  "status": "error",
  "database": "disconnected",
  "message": "Database unreachable"
}
```

---

## 9. Admin Module

### Cấu trúc API Admin

Tất cả API admin yêu cầu:
- Header: `Authorization: Bearer <token>`
- User phải có role `ADMIN`

---

### GET /admin/users - Lấy danh sách users

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Số trang |
| limit | number | Số items/trang |
| search | string | Tìm kiếm theo email hoặc username |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username123",
      "role": "USER",
      "balance": 10000,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

---

### GET /admin/users/:id - Lấy user chi tiết

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username123",
  "role": "USER",
  "balance": 10000,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### PATCH /admin/users/:id - Cập nhật role user

**Request Body:**
```json
{
  "role": "ADMIN"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username123",
  "role": "ADMIN",
  "balance": 10000
}
```

---

### DELETE /admin/users/:id - Xóa mềm user

**Response (200):**
```json
{
  "message": "User deleted successfully"
}
```

---

### POST /admin/cards - Tạo card mới

**Request Body:**
```json
{
  "name": "Lionel Messi",
  "rarity": "GOLD_EPIC",
  "overall": 93,
  "pace": 85,
  "shooting": 92,
  "passing": 91,
  "dribbling": 95,
  "defending": 45,
  "position": "ST",
  "club": "Inter Miami",
  "nation": "Argentina",
  "imageUrl": "https://..."
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Lionel Messi",
  "rarity": "GOLD_EPIC",
  ...
}
```

---

### PATCH /admin/cards/:id - Cập nhật card

**Request Body:** (các trường cần cập nhật)
```json
{
  "name": "New Name",
  "overall": 95
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "New Name",
  ...
}
```

---

### DELETE /admin/cards/:id - Xóa card

**Response (200):**
```json
{
  "message": "Card deleted successfully"
}
```

---

### GET /admin/packs/:id/pool - Lấy pack pool

**Response (200):**
```json
{
  "packId": "uuid",
  "packName": "Premium Pack",
  "pool": [
    {
      "id": "uuid",
      "cardId": "uuid",
      "weight": 10,
      "card": {
        "id": "uuid",
        "name": "Lionel Messi",
        "rarity": "GOLD_EPIC"
      }
    }
  ]
}
```

---

### POST /admin/packs - Tạo pack mới

**Request Body:**
```json
{
  "name": "Premium Pack",
  "price": 500,
  "description": "Contains 5 cards"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "Premium Pack",
  "price": 500,
  "description": "Contains 5 cards"
}
```

---

### POST /admin/packs/:id/pool - Thêm card vào pack pool

**Request Body:**
```json
{
  "cardId": "uuid-cua-card",
  "weight": 10
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cardId | string (UUID) | Yes | ID của card |
| weight | number | Yes | Trọng số xuất hiện |

**Response (200):**
```json
{
  "message": "Card added to pack pool successfully"
}
```

---

### PATCH /admin/packs/:id/pool/:poolId - Cập nhật trọng số card trong pool

**Request Body:**
```json
{
  "weight": 20
}
```

**Response (200):**
```json
{
  "packId": "uuid",
  "cardId": "uuid",
  "newWeight": 20
}
```

---

### PATCH /admin/packs/:id - Cập nhật pack

**Request Body:** (các trường cần cập nhật)
```json
{
  "name": "New Pack Name",
  "price": 600
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "New Pack Name",
  "price": 600
}
```

---

### DELETE /admin/packs/:packId/pool/:poolId - Xóa card khỏi pool

**Response (200):**
```json
{
  "message": "Card removed from pack pool successfully"
}
```

---

### DELETE /admin/packs/:id - Xóa pack

**Response (200):**
```json
{
  "message": "Pack deleted successfully"
}
```

---

### GET /admin/transactions - Lấy tất cả giao dịch

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Số trang |
| limit | number | Số items/trang |
| type | string | Lọc theo Type |
| from | string | Lọc từ ngày |
| to | string | Lọc đến ngày |
| userId | string (UUID) | Lọc theo user |

**Response (200):**
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

---

### GET /admin/stats/dashboard - Lấy thống kê dashboard

**Response (200):**
```json
{
  "totalUsers": 100,
  "totalRevenue": 50000,
  "totalPacksSold": 500,
  "totalCardsSold": 1000
}
```

---

### GET /admin/stats/revenue - Lấy thống kê doanh thu

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| from | string | Từ ngày (ISO date) |
| to | string | Đến ngày (ISO date) |
| granularity | string | `day`, `week`, `month` |

**Example:** `/admin/stats/revenue?from=2024-01-01&to=2024-12-31&granularity=day`

**Response (200):**
```json
{
  "data": [
    {
      "date": "2024-01-01",
      "revenue": 5000,
      "transactions": 10
    }
  ],
  "total": 50000
}
```

---

### GET /admin/stats/users/:id - Lấy thống kê của user

**Response (200):**
```json
{
  "userId": "uuid",
  "totalPacksBought": 20,
  "totalCardsOpened": 100,
  "totalSpent": 10000,
  "totalCardsSold": 50,
  "totalEarned": 5000,
  "currentBalance": 5000
}
```

---

## Error Responses

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "statusCode": 403,
  "message": "Forbidden"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Not Found"
}
```

**422 Unprocessable Entity:**
```json
{
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [...]
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```