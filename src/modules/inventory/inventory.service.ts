import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { GetInventoryDto } from './dto/get-inventory.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';
import { SellCardDto } from './dto/sell-card.dto.js';
import { Status, Type } from '../../generated/prisma/enums.js';
import { TransactionService } from '../transaction/transaction.service.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService, private transactionService: TransactionService, private readonly userService: UserService) {}

  async getInventory(
    userId: string,
    query: GetInventoryDto,
  ): Promise<PaginatedOutput> {
    const {
      rarity,
      position,
      search,
      sortBy = 'desc',
      sortOrder,
      page = 1,
      limit = 20,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(rarity && { rarity }),
      ...(position && { position }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive',
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where: {
          userId,
          card: where,
        },
        orderBy: {
          card: {
            [sortBy]: sortOrder,
          },
        },
        skip,
        take: limit,
        include: {
          card: true,
        },
      }),
      this.prisma.inventory.count({
        where: {
          userId,
        },
      }),
    ]);

    const formattedData = data.map((item) => ({
      ...item.card,
      quantity: item.quantity,
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
    };
  }

  async getInventorySummary(userId: string) {
    const inventoryItems = await this.prisma.inventory.findMany({
      where: { userId },
      select: {
        quantity: true,
        card: {
          select: { rarity: true },
        },
      },
    });

    const totalCards = inventoryItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );
    const uniqueCards = inventoryItems.length;

    const byRarity = {
      BRONZE_COMMON: 0,
      BRONZE_RARE: 0,
      SILVER_COMMON: 0,
      SILVER_RARE: 0,
      GOLD_COMMON: 0,
      GOLD_RARE: 0,
      GOLD_EPIC: 0,
      DIAMOND_COMMON: 0,
      DIAMOND_RARE: 0,
    };

    inventoryItems.forEach((item) => {
      const rarity = item.card.rarity;
      if (byRarity[rarity] !== undefined) {
        byRarity[rarity] += item.quantity;
      }
    });

    return {
      totalCards,
      uniqueCards,
      byRarity,
    };
  }

  async getInventoryItemById(cardId: string, userId: string) {
    const item = await this.prisma.inventory.findFirst({
      where: {
        userId,
        cardId,
      },
      include: {
        card: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Card not found in inventory');
    }

    const data = {
      ...item.card,
      quantity: item.quantity,
    };

    return data;
  }

  async sellInventoryItem(body: SellCardDto, userId: string) {
    const data = await this.prisma.$transaction(async (prisma) => {
      const { cardId, quantity } = body;
      const inventoryItem = await prisma.inventory.findFirst({
        where: {
          userId,
          cardId,
        },
        include: {
          card: true,
        },
      });

      if (!inventoryItem) {
        throw new NotFoundException('You do not own this card');
      }
      if (inventoryItem.quantity < 1) {
        throw new BadRequestException('quantity must be at least 1');
      }
      if (inventoryItem.quantity < quantity) {
        throw new ConflictException({
          statusCode: 409,
          message: 'Insufficient quantity',
          owned: inventoryItem.quantity,
          requested: quantity,
        });
      }

      const coinEarned = inventoryItem.card.sellPrice * quantity;

      const itemToSell = await prisma.inventoryItems.findMany({
        where: {
          userId,
          cardId,
          status: Status.IN_INVENTORY,
        },
        orderBy: {
          acquiredAt: 'asc',
        },
        take: quantity,
        include: {
          card: true,
        }
      });

      itemToSell.forEach(async (item) => {
        await prisma.inventoryItems.update({
          where: {
            id: item.id,
          },
          data: {
            status: Status.SOLD,
          }
        })
      })

      await prisma.inventory.update({
        where: {
          userId_cardId: {
            userId,
            cardId,}
        },
        data: {
          quantity: {
            decrement: quantity,
          }
        }
      })

      await prisma.inventory.deleteMany({
        where: {
          userId,
            quantity: 0,
        },
      })
      const balanceBefore = await this.userService.getUserBalance(userId);

      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {increment: coinEarned},
        },
      })

      const createTransactionDto = {
        userId,
    type: Type.SELL_CARD,
    amount: coinEarned,
    balanceBefore,
    balanceAfter: balanceBefore + coinEarned,
    description: `Sold ${quantity}x ${inventoryItem.card.name} for ${coinEarned} coins`,
  }
      await this.transactionService.create(createTransactionDto, cardId, prisma);

      return {
        cardId,
        cardName: inventoryItem.card.name,
        quantitySold: quantity,
        coinEarned,
        newBalance: balanceBefore + coinEarned,
      }
    });

    return data
  }
}
