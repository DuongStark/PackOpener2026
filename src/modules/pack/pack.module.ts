import { Module } from '@nestjs/common';
import { PackService } from './pack.service';
import { PackController } from './pack.controller';
import { UserService } from '../user/user.service.js';
import { UserModule } from '../user/user.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';

@Module({
  imports: [UserModule, TransactionModule],
  controllers: [PackController],
  providers: [PackService],
})
export class PackModule {}
