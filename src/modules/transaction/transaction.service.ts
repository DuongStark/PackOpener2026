import { Injectable } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { Prisma, Transaction } from '../../generated/prisma/client.js';
import { GetTransactionDto } from './dto/get-transaction.dto.js';

@Injectable()
export class TransactionService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createTransactionDto: CreateTransactionDto,
    relatedEntity: string,
    tx: Prisma.TransactionClient,
  ): Promise<Transaction> {
    return await tx.transaction.create({
      data: {
        ...createTransactionDto,
        relatedEntityId: relatedEntity,
      },
    });
  }

  async findAllByUser(
    userId: string,
    query: GetTransactionDto,
  ): Promise<{ data: Transaction[]; total: number }> {
    const { type, from, to, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = {
      userId,
      ...(type && { type }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    };

    if (from && to && new Date(from) > new Date(to)) {
      throw new Error('Invalid date range: "from" date must be before "to" date.');
    }

    const data = await this.prisma.transaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const total = await this.prisma.transaction.count({ where: {userId} });

    return {data, total}
  }

  async findOne(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { id },
    });
  }
}
