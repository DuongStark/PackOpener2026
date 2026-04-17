import { Injectable } from '@nestjs/common';
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
}
