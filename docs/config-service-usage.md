# Hướng dẫn sử dụng ConfigService

## Tổng quan

ConfigService giúp quản lý environment variables một cách an toàn và có tổ chức.

## Cách sử dụng

### 1. Inject ConfigService vào constructor

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../core/config/config.service';

@Injectable()
export class MyService {
  constructor(private readonly configService: ConfigService) {}
  
  someMethod() {
    // Sử dụng config ở đây
  }
}
```

### 2. Các methods có sẵn

#### Lấy giá trị string
```typescript
const jwtSecret = this.configService.getJwtSecret();
// Hoặc generic:
const anyValue = this.configService.get('MY_VAR', 'default-value');
```

#### Lấy giá trị number
```typescript
const port = this.configService.getPort(); // 3000
const bcryptRounds = this.configService.getBcryptRounds(); // 12
// Hoặc generic:
const timeout = this.configService.getNumber('TIMEOUT', 5000);
```

#### Lấy giá trị boolean
```typescript
const isProduction = this.configService.isProduction();
const isDevelopment = this.configService.isDevelopment();
// Hoặc generic:
const enableCache = this.configService.getBoolean('ENABLE_CACHE', false);
```

### 3. Ví dụ thực tế

#### Trong AuthModule - Setup JWT

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '../core/config/config.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getJwtSecret(),
        signOptions: {
          expiresIn: config.getJwtExpiresIn(),
        },
      }),
    }),
  ],
})
export class AuthModule {}
```

#### Trong AuthService - Hash password

```typescript
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '../core/config/config.service';

@Injectable()
export class AuthService {
  constructor(private readonly configService: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    const rounds = this.configService.getBcryptRounds();
    return bcrypt.hash(password, rounds);
  }
}
```

#### Trong main.ts - Setup server port

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from './core/config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  const port = configService.getPort();
  
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

## Environment Variables

Tất cả biến môi trường được định nghĩa trong file `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/packopener

# JWT Authentication
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# Server
PORT=3000
NODE_ENV=development

# Bcrypt
BCRYPT_ROUNDS=12
```

## Lợi ích

✅ **Type-safe**: Tự động convert kiểu dữ liệu  
✅ **Validation**: Báo lỗi ngay nếu thiếu biến bắt buộc  
✅ **Default values**: Hỗ trợ giá trị mặc định  
✅ **Centralized**: Quản lý config ở một chỗ  
✅ **Testable**: Dễ mock trong unit tests  

## Testing

Khi viết unit tests, bạn có thể mock ConfigService:

```typescript
const mockConfigService = {
  getJwtSecret: jest.fn().mockReturnValue('test-secret'),
  getPort: jest.fn().mockReturnValue(3000),
  getBcryptRounds: jest.fn().mockReturnValue(10),
};

const module = await Test.createTestingModule({
  providers: [
    MyService,
    {
      provide: ConfigService,
      useValue: mockConfigService,
    },
  ],
}).compile();
```
