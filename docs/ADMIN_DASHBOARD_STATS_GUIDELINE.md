# Guideline: 4.8.15 GET /admin/stats/dashboard (Admin)

## 1) Muc tieu

Xay dung endpoint thong ke tong quan cho dashboard admin:

- Route: `GET /admin/stats/dashboard`
- Quyen truy cap: `ADMIN`
- Cache: 5 phut (300 giay) de giam tai DB
- Response mau:

```json
{
  "users": { "total": 1520, "newToday": 45, "activeToday": 230 },
  "packs": { "totalSold": 8400, "totalOpened": 7800, "revenueToday": 45000 },
  "cards": { "totalTypes": 200, "totalInCirculation": 125000 },
  "transactions": { "totalVolume": 980000, "todayVolume": 45000 },
  "topCards": [{ "cardId": "uuid", "name": "L. Messi", "timesOpened": 320 }],
  "generatedAt": "2026-04-13T..."
}
```

---

## 2) Mapping voi schema hien tai

Du lieu se lay tu cac model sau:

- `User`: tong user, user moi hom nay
- `Transaction`: active user hom nay (theo giao dich), doanh thu hom nay, tong volume
- `UserPack`: tong pack da mua, tong pack da mo
- `Cards`: tong so loai the
- `Inventory`: tong so luong the dang luu thong (sum quantity)
- `PackOpeningResult`: top card mo ra nhieu nhat

Luu y:

- Schema hien tai chua co cot `last_login`, vi vay `activeToday` can dinh nghia theo hanh vi. De xuat: user co phat sinh `Transaction` hom nay.
- Neu muon active dung nghia "co hoat dong bat ky", co the gom them `UserPack` da mua/mo hom nay.

---

## 3) DTO response de on dinh contract

Tao DTO response rieng de khoa shape du lieu:

```ts
// src/modules/admin/dto/admin-dashboard-stats.dto.ts
export type AdminDashboardStatsResponse = {
  users: {
    total: number;
    newToday: number;
    activeToday: number;
  };
  packs: {
    totalSold: number;
    totalOpened: number;
    revenueToday: number;
  };
  cards: {
    totalTypes: number;
    totalInCirculation: number;
  };
  transactions: {
    totalVolume: number;
    todayVolume: number;
  };
  topCards: Array<{
    cardId: string;
    name: string;
    timesOpened: number;
  }>;
  generatedAt: string;
};
```

---

## 4) Cach cache 5 phut (khuyen nghi dung cache-aside)

### 4.1. Cach A - In-memory cache (de nhat)

Phu hop local/dev, 1 instance app.

1. Cai package:

```bash
npm i @nestjs/cache-manager cache-manager
```

2. Dang ky cache module (global):

```ts
// src/app.module.ts
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 300000, // milliseconds = 5 phut
      max: 100,
    }),
    // ...cac module khac
  ],
})
export class AppModule {}
```

### 4.2. Cach B - Redis cache (production, multi instance)

Phu hop khi scale nhieu replica.

1. Cai package:

```bash
npm i @nestjs/cache-manager cache-manager cache-manager-redis-store
```

2. Dang ky cache module voi Redis store (tham khao theo version package ban dung).

Ghi chu:

- Nen dung Redis trong production de tranh cache lech giua cac instance.
- Van giu TTL 300 giay.

### 4.3. Vi sao nen cache-aside thay vi chi dung CacheInterceptor

Co 2 cach:

- `CacheInterceptor + @CacheTTL + @CacheKey`: nhanh gon.
- Manual cache-aside trong service: linh hoat hon cho invalidation va quan ly key.

Voi dashboard admin, nen dung manual cache-aside de:

- Chu dong xoa cache khi co event quan trong.
- Kiem soat key version (`admin:stats:dashboard:v1`).

---

## 5) Trien khai endpoint

### 5.1. Controller

Dung route dung spec va guard ADMIN.

```ts
// src/modules/admin/controllers/admin-stats/admin-stats.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { AdminService } from '../../admin.service.js';

@Controller('admin/stats')
@Roles(Role.ADMIN)
export class AdminStatsController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
```

### 5.2. Service (manual cache-aside)

```ts
// src/modules/admin/admin.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../../core/database/prisma.service.js';
import { PackStatus, Type } from '../../generated/prisma/enums.js';

const DASHBOARD_CACHE_KEY = 'admin:stats:dashboard:v1';
const DASHBOARD_TTL_MS = 300000; // 5 phut

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async getDashboardStats() {
    const cached = await this.cache.get(DASHBOARD_CACHE_KEY);
    if (cached) return cached;

    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const [
      usersTotal,
      usersNewToday,
      activeTodayDistinct,
      packsTotalSold,
      packsTotalOpened,
      revenueTodayAgg,
      cardsTotalTypes,
      cardsInCirculationAgg,
      transactionsTotalVolumeAgg,
      transactionsTodayVolumeAgg,
      topCardRows,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.transaction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.userPack.count(),
      this.prisma.userPack.count({ where: { status: PackStatus.OPENED } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          type: Type.BUY_PACK,
          createdAt: { gte: startOfToday },
        },
      }),
      this.prisma.cards.count(),
      this.prisma.inventory.aggregate({ _sum: { quantity: true } }),
      this.prisma.transaction.aggregate({ _sum: { amount: true } }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { createdAt: { gte: startOfToday } },
      }),
      this.prisma.packOpeningResult.groupBy({
        by: ['cardId'],
        _count: { cardId: true },
        orderBy: { _count: { cardId: 'desc' } },
        take: 10,
      }),
    ]);

    const topCardIds = topCardRows.map((r) => r.cardId);
    const cards = topCardIds.length
      ? await this.prisma.cards.findMany({
          where: { id: { in: topCardIds } },
          select: { id: true, name: true },
        })
      : [];

    const cardNameMap = new Map(cards.map((c) => [c.id, c.name]));
    const response = {
      users: {
        total: usersTotal,
        newToday: usersNewToday,
        activeToday: activeTodayDistinct.length,
      },
      packs: {
        totalSold: packsTotalSold,
        totalOpened: packsTotalOpened,
        revenueToday: revenueTodayAgg._sum.amount ?? 0,
      },
      cards: {
        totalTypes: cardsTotalTypes,
        totalInCirculation: cardsInCirculationAgg._sum.quantity ?? 0,
      },
      transactions: {
        totalVolume: transactionsTotalVolumeAgg._sum.amount ?? 0,
        todayVolume: transactionsTodayVolumeAgg._sum.amount ?? 0,
      },
      topCards: topCardRows.map((r) => ({
        cardId: r.cardId,
        name: cardNameMap.get(r.cardId) ?? 'Unknown card',
        timesOpened: r._count.cardId,
      })),
      generatedAt: now.toISOString(),
    };

    await this.cache.set(DASHBOARD_CACHE_KEY, response, DASHBOARD_TTL_MS);
    return response;
  }

  async invalidateDashboardStatsCache() {
    await this.cache.del(DASHBOARD_CACHE_KEY);
  }
}
```

Ghi chu:

- Neu cache manager version cua ban su dung `ttl` theo giay, doi `300000` thanh `300`.
- Trong Nest 11 + cache-manager moi, thuong dung milliseconds; nhung nen test 1 lan de chac chan.

---

## 6) Invalidation cache (rat quan trong)

Chi TTL 5 phut la du cho dashboard. Tuy nhien neu muon so lieu cap nhat nhanh sau cac action nhay cam, xoa cache ngay sau khi mutate:

Nen goi `invalidateDashboardStatsCache()` sau cac luong:

- Tao/xoa user quan trong
- Mua pack (`BUY_PACK`)
- Mo pack (tao `PackOpeningResult`)
- Them/xoa card (anh huong `totalTypes`)
- Admin adjust balance (anh huong volume)

Cach lam:

- Inject `AdminService` vao cac service mutate hoac
- Tao `StatsCacheService` nho de tranh coupling

Neu chua can real-time, co the bo qua invalidation va chi de TTL 5 phut.

---

## 7) Toi uu query cho DB

Nen tao index cho cot thoi gian va cot group/filter:

- `transactions(created_at)`
- `transactions(type, created_at)`
- `user_packs(status)`
- `pack_opening_results(card_id)`
- `users(created_at)`

Voi Prisma, co the them `@@index` vao model roi migrate.

---

## 8) Kiem thu de dam bao dung

Checklist:

1. Goi endpoint lan 1: data dung, co `generatedAt` moi.
2. Goi endpoint lan 2 trong 5 phut: nhanh hon, data giong lan 1 (cache hit).
3. Sau 5 phut: cache het han, `generatedAt` thay doi.
4. Thu tao 1 giao dich `BUY_PACK`, neu co invalidation thi endpoint cap nhat ngay.
5. Thu role USER goi endpoint phai bi 403.

---

## 9) Muc tieu rollout

MVP nhanh:

1. Them endpoint + service query.
2. Bat cache 300s (in-memory).
3. Test qua Postman/Swagger.

Production-ready:

1. Chuyen Redis cache.
2. Them invalidation khi mutate.
3. Them index DB.
4. Them test integration cho stats.

---

## 10) Ghi nho cho route spec

Trong code hien tai, controller dang de `@Controller('admin-stats')`.
De dung voi spec 4.8.15, can doi thanh:

- `@Controller('admin/stats')`
- `@Get('dashboard')`

=> Khi do route dung la: `GET /admin/stats/dashboard`.
