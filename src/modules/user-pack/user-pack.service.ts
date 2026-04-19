import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PackService } from '../pack/pack.service.js';
import { PrismaService } from '../../core/database/prisma.service.js';
import { UserService } from '../user/user.service.js';
import { PackStatus, Status, Type } from '../../generated/prisma/enums.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';
import { Pack } from '../pack/entities/pack.entity.js';
import { getUserPacksDto } from './dto/get-userpack.dto.js';

interface buyPackResult {
  userPackId: string;
  packName: string;
  price: number;
  newBalance: number;
  status: string;
}

interface CardSnapshot {
  name: string;
  overall: number;
  rarity: string;
  position: string;
  imageUrl: string;
  sellPrice: number;
  club?: string;
  nation?: string;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  physical?: number;
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
    query: getUserPacksDto,
  ): Promise<PaginatedOutput> {
    const { page = 1, limit = 20, status = PackStatus.PENDING, includeCards } = query;
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(status && { status }),
    };

    const [total, data] = await Promise.all([
      this.prisma.userPack.count({
        where,
      }),

      this.prisma.userPack.findMany({
        where,
        orderBy: { purchasedAt: 'desc' },
        skip: skip,
        take: limit,
        include: {
          pack: true,
          packOpeningResults: includeCards === true,
        },
      }),
    ]);

   const formattedData = data.map((item) =>
    this.formatUserPack(item, includeCards),
  );

  return { data: formattedData, total, page, limit };
    
  }

  private formatUserPack(item: any, includeCards?: boolean) {
  const base = {
    id: item.id,
    packId: item.packId,
    packName: item.pack.name,
    status: item.status,
    purchasedAt: item.purchasedAt,
    ...(item.openedAt && { openedAt: item.openedAt }),
  };

  // Không includeCards hoặc pack chưa mở → trả base
  if (!includeCards || item.status !== PackStatus.OPENED) return base;

  // Pack đã mở + includeCards=true → kèm cards
  const cards = item.packOpeningResults.map((r: any) => {
    const snapshot = r.cardSnapshot as CardSnapshot;
    return {
      name: snapshot.name,
      rarity: snapshot.rarity,
    };
  });

  return { ...base, cards };
}

  async getUserPackById(id: string, userId: string): Promise<any> {
  const userPack = await this.prisma.userPack.findUnique({
    where: { id },
    include: {
      pack: true,                    
      packOpeningResults: true,    
    },
  });

  if (!userPack) {
    throw new NotFoundException('UserPack not found');
  }

  if (userPack.userId !== userId) {
    throw new ForbiddenException('Forbidden');
  }

  // PENDING trả base
  if (userPack.status === PackStatus.PENDING) {
    return {
      id: userPack.id,
      packName: userPack.pack.name,
      status: userPack.status,
      purchasedAt: userPack.purchasedAt,
    };
  }

  // OPENED trả kèm cards từ snapshot
  return {
    id: userPack.id,
    packName: userPack.pack.name,
    status: userPack.status,
    purchasedAt: userPack.purchasedAt,
    openedAt: userPack.openedAt,
    cards: userPack.packOpeningResults.map((r: any) => {
      const snapshot = r.cardSnapshot as CardSnapshot;
      return {
        cardId: r.cardId,
        name: snapshot.name,
        rarity: snapshot.rarity,
        overall: snapshot.overall,
        position: snapshot.position,
        imageUrl: snapshot.imageUrl,
        sellPrice: snapshot.sellPrice,
      };
    }),
  };
}
}
