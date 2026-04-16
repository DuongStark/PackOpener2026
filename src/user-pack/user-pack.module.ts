import { Module } from '@nestjs/common';
import { UserPackController } from './user-pack.controller';
import { UserPackService } from './user-pack.service';
import { PackModule } from '../modules/pack/pack.module.js';
import { PrismaModule } from '../core/database/prisma.module.js';
import { UserModule } from '../modules/user/user.module.js';
import { TransactionModule } from '../modules/transaction/transaction.module.js';

@Module({
  imports: [PackModule, UserModule, TransactionModule],
  controllers: [UserPackController],
  providers: [UserPackService]
})
export class UserPackModule {}
