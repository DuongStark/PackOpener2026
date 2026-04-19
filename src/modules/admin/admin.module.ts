import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminUserController } from './controllers/admin-user/admin-user.controller';
import { AdminPackController } from './controllers/admin-pack/admin-pack.controller';
import { AdminCardController } from './controllers/admin-card/admin-card.controller';
import { AdminStatsController } from './controllers/admin-stats/admin-stats.controller';
import { AdminTransactionsController } from './controllers/admin-transactions/admin-transactions.controller';
import { UserModule } from '../user/user.module.js';
import { CardModule } from '../card/card.module.js';
import { TransactionModule } from '../transaction/transaction.module.js';
import { UserPackModule } from '../user-pack/user-pack.module.js';


@Module({
  imports: [UserModule, CardModule, TransactionModule, UserPackModule],
  controllers: [AdminUserController, AdminPackController, AdminCardController, AdminStatsController, AdminTransactionsController],
  providers: [AdminService]
})
export class AdminModule {}
