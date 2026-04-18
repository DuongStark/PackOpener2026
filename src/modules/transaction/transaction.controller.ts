import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Req } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GetTransactionDto } from './dto/get-transaction.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: GetTransactionDto, @Req() req): Promise<PaginatedOutput> {
    const result = await this.transactionService.findAllByUser(req.user.id, query);

    return {...result, page: query.page, limit: query.limit};
  }
}
