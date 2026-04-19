# RBAC Implementation Guide (NestJS + Prisma)

## 1) Mục tiêu

Bạn đang có sẵn:

- `JWT` authentication (`JwtStrategy`, `JwtAuthGuard`).
- `role` trong bảng `users` (`USER`, `ADMIN`) và đã đưa vào JWT payload.

Bạn chưa có đầy đủ:

- `@Roles()` decorator.
- `RolesGuard` để chặn truy cập theo role.
- Cơ chế kết hợp guard cho toàn bộ `/admin/*`.
- Bộ test xác nhận hành vi `401/403/200`.

Mục tiêu tài liệu này là giúp bạn triển khai RBAC theo lộ trình an toàn, dễ mở rộng lên permission-based sau này.

---

## 2) Trạng thái hiện tại của codebase (để bám vào)

Các điểm đã có:

- `src/modules/auth/strategies/jwt.strategy.ts`: `validate()` trả về `id`, `email`, `role`, `username`.
- `src/modules/auth/auth.service.ts`: payload login đã có `role`.
- `src/common/guards/jwt-auth.guard.ts`: đã có guard JWT.
- `prisma/schema.prisma`: enum `Role { USER ADMIN }`, field `User.role`.

Các điểm còn thiếu cho RBAC:

- Chưa có `src/common/decorators/roles.decorator.ts`.
- Chưa có `src/common/guards/roles.guard.ts`.
- Chưa có pattern áp dụng `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)` ở admin controllers.
- `src/modules/admin/controllers/admin-user/admin-user.controller.ts` đang chưa hoàn thiện endpoint/guard.

---

## 3) Lộ trình triển khai đề xuất (theo thứ tự)

## Bước 0 - Chốt phạm vi RBAC ban đầu

Khuyến nghị Phase 1:

- Chỉ dùng **role-based** với 2 role: `USER`, `ADMIN`.
- Rule cứng:
  - Tất cả endpoint `/admin/*` => yêu cầu `ADMIN`.
  - Endpoint user thường (`/me`, mua pack, mở pack...) => chỉ cần JWT hợp lệ.

Lý do:

- Fit với kiến trúc hiện tại.
- Triển khai nhanh, ít rủi ro.
- Dễ nâng cấp sang permission matrix ở Phase 2.

## Bước 1 - Tạo `@Roles()` decorator

Tạo file: `src/common/decorators/roles.decorator.ts`

Nội dung gợi ý:

```ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

Ý nghĩa:

- Gắn metadata roles yêu cầu cho controller/method.

## Bước 2 - Tạo `RolesGuard`

Tạo file: `src/common/guards/roles.guard.ts`

Nội dung gợi ý:

```ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../../generated/prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Route không khai báo @Roles thì cho qua
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { role?: Role } }>();
    const userRole = request.user?.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException('Forbidden: insufficient role');
    }

    return true;
  }
}
```

Lưu ý quan trọng:

- `RolesGuard` luôn chạy **sau** `JwtAuthGuard` để chắc chắn `request.user` đã có.

## Bước 3 - Áp dụng guard + decorator ở admin endpoints

Tại các controller admin (ví dụ `AdminUserController`, `AdminPackController`, ...):

```ts
import { Controller, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { Role } from '../../../generated/prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/users')
export class AdminUserController {}
```

Bạn có thể đặt ở cấp class cho toàn bộ controller admin để đỡ lặp.

## Bước 4 - Chuẩn hóa kiểu dữ liệu user trong request

Nên tạo type dùng chung để tránh `any`:

- Ví dụ `src/common/constants/global.dto.ts` hoặc file mới `auth-user.type.ts`.

Gợi ý:

```ts
import { Role } from '../../generated/prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  username: string;
  role: Role;
};
```

Sau đó dùng trong `CurrentUser` decorator và các controller.

## Bước 5 - Hardening bảo mật cho RBAC

1. Không tin role từ client body/query.

- Chỉ đọc role từ JWT (`request.user.role`) do server ký.

2. Kiểm tra account trạng thái khóa (`isActive`).

- Có thể xử lý ở `JwtStrategy.validate()` hoặc guard bổ sung.
- Nếu user bị khóa => trả `403` khi truy cập protected routes.

3. Cân nhắc token stale role.

- Nếu đổi role sau khi token đã phát hành, token cũ vẫn mang role cũ.
- Tùy yêu cầu bảo mật:
  - Chấp nhận delay đến khi token hết hạn, hoặc
  - Check role từ DB theo mỗi request admin (an toàn hơn, tốn query hơn).

## Bước 6 - Viết test RBAC (rất quan trọng)

### E2E test tối thiểu

1. `GET /admin/users` không token => `401`.
2. `GET /admin/users` token USER => `403`.
3. `GET /admin/users` token ADMIN => `200`.

### Unit test cho RolesGuard

Case cần có:

1. Không có metadata roles => `true`.
2. Có metadata `ADMIN`, user role `USER` => throw `ForbiddenException`.
3. Có metadata `ADMIN`, user role `ADMIN` => `true`.

## Bước 7 - Seed dữ liệu admin chuẩn

Trong `prisma/seed.ts`:

- Seed 1 tài khoản admin mặc định.
- Password hash bằng bcrypt.
- Role = `ADMIN`.

Điều này giúp test và vận hành dễ hơn ngay từ đầu.

---

## 4) Cấu trúc file đề xuất thêm

```txt
src/
  common/
    decorators/
      roles.decorator.ts        // NEW
    guards/
      jwt-auth.guard.ts         // EXISTING
      roles.guard.ts            // NEW
```

Nếu muốn scalable hơn, thêm:

```txt
src/
  common/
    authorization/
      permissions.enum.ts       // Phase 2
      permissions.decorator.ts  // Phase 2
      permissions.guard.ts      // Phase 2
```

---

## 5) Áp dụng nhanh cho project của bạn ngay bây giờ

Với hiện trạng code hiện tại, thứ tự thực thi thực tế nên là:

1. Hoàn thiện `AdminUserController` trước (đang dang dở).
2. Thêm `roles.decorator.ts`.
3. Thêm `roles.guard.ts`.
4. Gắn `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN)` cho toàn bộ admin controllers.
5. Chạy test 3 case `401/403/200`.
6. Sau khi ổn, mở rộng guard cho các module admin còn lại.

---

## 6) Sai lầm thường gặp khi làm RBAC trong NestJS

1. Chỉ gắn `@Roles` nhưng quên `RolesGuard`.

- Kết quả: metadata có nhưng không ai kiểm tra.

2. Đảo thứ tự guard.

- `RolesGuard` chạy trước `JwtAuthGuard` => `request.user` rỗng.

3. Dùng string role hard-code khắp nơi.

- Nên dùng enum `Role` từ Prisma client để tránh typo.

4. Không test negative path.

- Dẫn đến production bị lọt quyền.

5. Quên kiểm soát hành vi admin tự tác động chính mình.

- Theo business rule của bạn: admin không tự khóa/xóa/hạ quyền chính mình.

---

## 7) Checklist Done Definition

- [ ] Có `roles.decorator.ts`.
- [ ] Có `roles.guard.ts`.
- [ ] Mọi `/admin/*` dùng `JwtAuthGuard + RolesGuard`.
- [ ] Mọi `/admin/*` có `@Roles(Role.ADMIN)` ở class/method.
- [ ] Test đủ 3 case `401/403/200` cho admin route đại diện.
- [ ] Có admin seed account để verify thủ công.
- [ ] Không có endpoint nào tin role từ request body/query.

---

## 8) Hướng mở rộng sau Phase 1

Khi bạn cần chi tiết hơn role:

- Chuyển từ `Role` sang `Permission` matrix.
- Role -> list permissions (ví dụ: `user.read`, `user.update`, `pack.manage`).
- Dùng `@Permissions()` + `PermissionsGuard`.

Gợi ý chiến lược:

- Giữ role để coarse-grained access (ADMIN/USER).
- Dùng permission cho fine-grained action.

---

## 9) Tóm tắt ngắn

Điểm bắt đầu tốt nhất cho bạn lúc này:

1. Dựng `@Roles` + `RolesGuard`.
2. Gắn vào toàn bộ admin controllers.
3. Viết test `401/403/200` trước khi triển khai business logic admin còn lại.

Đây là đường đi nhanh nhất để có RBAC chạy đúng và không phá kiến trúc hiện tại.
