import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Prisma, Transaction } from '../../generated/prisma/client.js';

@Injectable()
export class TransactionService {

  constructor(private readonly prisma: PrismaService) {}
  
  async create(createTransactionDto: CreateTransactionDto, relatedEntity: string, tx: Prisma.TransactionClient): Promise<Transaction> {
    return await tx.transaction.create({
      data: {
        ...createTransactionDto,
        relatedEntityId: relatedEntity
      },
    });
  } 
}
