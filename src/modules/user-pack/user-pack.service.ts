import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackService } from '../pack/pack.service.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { PackStatus, Type } from '../../generated/prisma/enums.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';

interface buyPackResult {
  userPackId: string;
  packName: string;
  price: number;
  newBalance: number;
  status: string;
}

@Injectable()
export class UserPackService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly packService: PackService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  async buyPack(packId: string, userId: string): Promise<buyPackResult> {
    const [price, name] = await this.packService.findPackPrices(packId);
    const [userPackId, newBalance] = await this.prisma.$transaction(
      async (tx) => {
        const data = await this.userService.deductBalance(userId, price, tx);
        const userPack = await tx.userPack.create({
          data: {
            userId,
            packId,
            status: PackStatus.PENDING,
          },
        });
        const transaction = {
          userId,
          type: Type.BUY_PACK,
          amount: price,
          balanceBefore: data.balance + price,
          balanceAfter: data.balance,
          description: `Mua pack ${name}`,
        };
        await this.transactionService.create(transaction, userPack.id, tx);

        return [userPack.id, data.balance];
      },
    );

    return {
      userPackId,
      packName: name,
      price,
      newBalance,
      status: PackStatus.PENDING,
    };
  }

  async getUserPacks(
    userId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedOutput> {
    const skip = (page - 1) * limit;

    const total = await this.prisma.userPack.count({
      where: {
        userId,
      },
    });

    const userPacks = await this.prisma.userPack.findMany({
      where: { userId },
      skip: skip,
      take: limit,
      include: {
        pack: true,
      },
    });

    //format lai data cho giong api docs
    const data = userPacks.map((up) => ({
      ...up.pack, // Thông tin chung của Pack
      instanceId: up.id,
    }));

    return { data, total, page, limit };
  }

  async getUserPackById(id: string, userId: string): Promise<any> {
    const userPackData = await this.prisma.userPack.findUnique({
      where: { id },
      include: {
        pack: {
          include: {
            packCardPools: {
              include: {
                card: true,
              },
            },
          },
        },
      },
    });

    if (!userPackData) {
      throw new NotFoundException('User pack not found');
    }

    if (userPackData.userId !== userId) {
      throw new ForbiddenException('User pack not found');
    }

    if (userPackData.status === PackStatus.PENDING) {
      return {
        ...userPackData.pack,
        id: userPackData.id,
        status: userPackData.status,
      };
    }

    return {
      ...userPackData.pack,
      id: userPackData.id,
      status: userPackData.status,
      cards: userPackData.pack.packCardPools,
    };
  }
}
