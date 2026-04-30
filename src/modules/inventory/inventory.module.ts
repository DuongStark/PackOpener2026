import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { UserModule } from '../user/user.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';

@Module({
  imports: [UserModule, TransactionModule],
  controllers: [InventoryController],
  providers: [InventoryService],
})
export class InventoryModule {}
