import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { GetInventoryDto } from './dto/get-inventory.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

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
}
