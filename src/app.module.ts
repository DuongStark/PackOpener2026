import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './core/database/prisma.module';
import { ConfigModule } from './core/config/config.module';
import { RandomModule } from './core/random/random.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { PackModule } from './modules/pack/pack.module';
import { CardModule } from './modules/card/card.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { UserPackModule } from './user-pack/user-pack.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RandomModule,
    AuthModule,
    UserModule,
    PackModule,
    CardModule,
    InventoryModule,
    TransactionModule,
    UserPackModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
