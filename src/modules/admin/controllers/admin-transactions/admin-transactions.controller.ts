import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from '../../../transaction/transaction.service.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { PaginatedOutput } from '../../../../common/constants/global.dto.js';

@Controller('admin/transactions')
@Roles(Role.ADMIN)
export class AdminTransactionsController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getAllTransactions(@Query() query): Promise<PaginatedOutput> {
    return this.transactionService.getAllTransactions(query);
  }
}
