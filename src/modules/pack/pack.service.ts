import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';

@Injectable()
export class PackService {
  constructor(private readonly prisma: PrismaService) {}

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

  async findPackPrices(id: string): Promise<[number, string]> {
    const pack = await this.findOne(id);
    if (!pack) {
      throw new NotFoundException('Pack not found or inactive');
    }
    if (!pack.isActive) {
      throw new NotFoundException('Pack not found or inactive');
    }
    return [pack.price, pack.name];
  }
}
