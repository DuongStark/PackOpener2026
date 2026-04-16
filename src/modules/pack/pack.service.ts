import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { PackStatus, Status, Type } from '../../generated/prisma/enums.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { Pack } from './entities/pack.entity.js';

interface buyPackResult {
  userPackId: string;
  packName: string;
  price: number;
  newBalance: number;
  status: string;
}
@Injectable()
export class PackService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly transactionService: TransactionService,
  ) {}

  async findAll(
    page: number,
    limit: number,
  ): Promise<{ data: any[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.packDefinition.findMany({
        skip,
        take: limit,
        orderBy: {
          price: 'asc',
        },
      }),
      this.prisma.packDefinition.count(),
    ]);
    return { data: data, total: total };
  }

  async findOne(id: string): Promise<any> {
    return this.prisma.packDefinition.findUnique({
      where: { id },
    });
  }

  async findOneWithOdds(id: string): Promise<any> {
    //doan nay la dang lay weight voi rarerity cua cac the trong pack de tinh ti le
    const pack = await this.prisma.packDefinition.findUnique({
      where: { id },
      include: {
        packCardPools: {
          select: {
            weight: true,
            card: {
              select: {
                id: true,
                rarity: true,
              },
            },
          },
        },
      },
    });

    if (!pack) {
      throw new NotFoundException(`Không tìm thấy pack với id ${id}`);
    }

    const totalWeight = pack.packCardPools.reduce(
      (sum, pool) => sum + pool.weight,
      0,
    );
    const odds: Record<string, number> = {};
    for (const pool of pack.packCardPools) {
      const rarity = pool.card.rarity;
      //tinh ti le cua tung loai do hiem
      odds[rarity] = (odds[rarity] || 0) + pool.weight / totalWeight;
    }

    return {
      id: pack.id,
      name: pack.name,
      price: pack.price,
      cardCount: pack.cardCount,
      odds,
      imageUrl: pack.imageUrl,
      isActive: pack.isActive,
      createdAt: pack.createdAt,
    };
  }

  async buyPack(packId: string, userId: string): Promise<buyPackResult> {
    const pack = await this.findOne(packId);
    if (!pack) {
      throw new NotFoundException('Pack not found or inactive');
    }
    if (!pack.isActive) {
      throw new NotFoundException('Pack not found or inactive');
    }
    const price = pack.price;
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
          description: `Mua pack ${pack.name}`,
        };
        await this.transactionService.create(transaction, userPack.id, tx);

        return [userPack.id, data.balance];
      },
    );

    return {
      userPackId,
      packName: pack.name,
      price,
      newBalance,
      status: PackStatus.PENDING,
    };
  }
}
