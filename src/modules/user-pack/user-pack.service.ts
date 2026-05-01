import {
  ConflictException,
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
import { OpenPackResponseDto } from './dto/open-pack.dto.js';
import { RandomService } from '../../core/random/random.service.js';

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

const FREE_PACK_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const FREE_PACK_DAILY_LIMIT = 10;

@Injectable()
export class UserPackService {
  constructor(
    private readonly transactionService: TransactionService,
    private readonly packService: PackService,
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
    private readonly randomService: RandomService,
  ) {}

  async buyPack(packId: string, userId: string): Promise<buyPackResult> {
    const [price, name] = await this.packService.findPackPrices(packId);
    if (price === 0) {
      await this.assertFreePackAvailable(packId, userId);
    }

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
          amount: -price,
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

  private async assertFreePackAvailable(
    packId: string,
    userId: string,
  ): Promise<void> {
    const cooldownStartedAt = new Date(Date.now() - FREE_PACK_COOLDOWN_MS);
    const recentClaims = await this.prisma.userPack.findMany({
      where: {
        userId,
        packId,
        purchasedAt: { gte: cooldownStartedAt },
      },
      orderBy: { purchasedAt: 'desc' },
      select: { purchasedAt: true },
    });

    if (recentClaims.length < FREE_PACK_DAILY_LIMIT) return;

    const oldestCountedClaim = recentClaims[recentClaims.length - 1];

    const availableAt = new Date(
      oldestCountedClaim.purchasedAt.getTime() + FREE_PACK_COOLDOWN_MS,
    );
    throw new ConflictException({
      statusCode: 409,
      message: `Free pack is limited to ${FREE_PACK_DAILY_LIMIT} claims every 24 hours`,
      limit: FREE_PACK_DAILY_LIMIT,
      availableAt: availableAt.toISOString(),
    });
  }

  async getUserPacks(
    userId: string,
    query: getUserPacksDto,
  ): Promise<PaginatedOutput> {
    const {
      page = 1,
      limit = 20,
      status = PackStatus.PENDING,
      includeCards,
    } = query;
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

  async openPack(
    userPackId: string,
    userId: string,
  ): Promise<OpenPackResponseDto> {
    const userPack = await this.prisma.userPack.findUnique({
      where: { id: userPackId },
      include: {
        pack: true,
        // lay ket qua mo pack sap xep theo positionInPack
        packOpeningResults: {
          orderBy: { positionInPack: 'asc' },
        },
      },
    });

    if (!userPack) {
      throw new NotFoundException('UserPack not found');
    }

    if (userPack.userId !== userId) {
      throw new ForbiddenException('Forbidden');
    }

    //nếu mà pack mở r thì trả về kết quả
    if (userPack.status === PackStatus.OPENED && userPack.openedAt) {
      return {
        userPackId: userPack.id,
        openedAt: userPack.openedAt.toISOString(),
        cards: userPack.packOpeningResults.map((r: any) => {
          const snap = r.cardSnapshot as CardSnapshot;
          return {
            cardId: r.cardId,
            name: snap.name,
            rarity: snap.rarity,
            overall: snap.overall,
            pace: snap.pace,
            shooting: snap.shooting,
            passing: snap.passing,
            dribbling: snap.dribbling,
            defending: snap.defending,
            physical: snap.physical,
            position: snap.position,
            club: snap.club,
            country: snap.nation,
            imageUrl: snap.imageUrl,
          };
        }),
      };
    }

    //pack pending
    const cardCount = userPack.pack.cardCount;

    const result = await this.prisma.$transaction(async (tx) => {
      // lay danh sach card va weight
      const cardPools = await tx.packCardPool.findMany({
        where: { packId: userPack.packId },
        select: { cardId: true, weight: true },
      });

      // Bước 3b: Random cardCount lan
      const selectedCardIds: string[] = [];
      for (let i = 0; i < cardCount; i++) {
        const cardId = this.randomService.weightedRandom(
          cardPools.map((cp) => ({ item: cp.cardId, weight: cp.weight })),
        );
        selectedCardIds.push(cardId);
      }

      // lay tt card de luu vao snapshot voi hien thi cho ng dung
      const cards = await tx.cards.findMany({
        where: { id: { in: selectedCardIds } },
      });

      // Map card arr de giam tg truy cap
      const cardMap = new Map(cards.map((c) => [c.id, c]));

      // luu vao packOpeningResult
      const openResults = await tx.packOpeningResult.createManyAndReturn({
        data: selectedCardIds.map((cardId, index) => {
          const card = cardMap.get(cardId)!;
          return {
            userPackId,
            cardId,
            positionInPack: index,
            cardSnapshot: {
              name: card.name,
              overall: card.overall,
              rarity: card.rarity,
              position: card.position,
              imageUrl: card.imageUrl || '',
              sellPrice: card.sellPrice,
              club: card.club || '',
              nation: card.nation || '',
              pace: card.pace || 0,
              shooting: card.shooting || 0,
              passing: card.passing || 0,
              dribbling: card.dribbling || 0,
              defending: card.defending || 0,
              physical: card.physical || 0,
            } satisfies CardSnapshot,
          };
        }),
      });
      //add vao inventoryItem
      await tx.inventoryItems.createMany({
        data: openResults.map((r) => ({
          userId,
          cardId: r.cardId,
          sourceResultId: r.id,
          status: Status.IN_INVENTORY,
        })),
      });

      //dem so card xuat hien bao lan trong kq
      const cardCountMap = new Map<string, number>();
      for (const r of openResults) {
        cardCountMap.set(r.cardId, (cardCountMap.get(r.cardId) || 0) + 1);
      }

      //update va insert
      for (const [cardId, count] of cardCountMap) {
        await tx.inventory.upsert({
          where: { userId_cardId: { userId, cardId } },
          create: { userId, cardId, quantity: count },
          update: { quantity: { increment: count } },
        });
      }

      const updated = await tx.userPack.update({
        where: { id: userPackId },
        data: {
          status: PackStatus.OPENED,
          openedAt: new Date(),
        },
      });

      return { updated, openResults };
    });

    return {
      userPackId: result.updated.id,
      openedAt: result.updated.openedAt!.toISOString(),
      cards: result.openResults.map((r: any) => {
        const snap = r.cardSnapshot as CardSnapshot;
        return {
          cardId: r.cardId,
          name: snap.name,
          rarity: snap.rarity,
          overall: snap.overall,
          pace: snap.pace ?? 0,
          shooting: snap.shooting ?? 0,
          passing: snap.passing ?? 0,
          dribbling: snap.dribbling ?? 0,
          defending: snap.defending ?? 0,
          physical: snap.physical ?? 0,
          position: snap.position,
          club: snap.club ?? '',
          nation: snap.nation ?? '',
          imageUrl: snap.imageUrl,
        };
      }),
    };
  }
}
