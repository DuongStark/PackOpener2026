import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service.js';
import { CreatePackDto } from './dto/create-pack.dto.js';
import { UpdatePackDto } from './dto/update-pack.dto.js';
import { PackDefinition } from '../../generated/prisma/client.js';

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

  async createPack(data: CreatePackDto): Promise<PackDefinition> {
    const existing = await this.prisma.packDefinition.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new BadRequestException(`Tên pack "${data.name}" đã tồn tại`);
    }

    return this.prisma.packDefinition.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        cardCount: data.cardCount,
        imageUrl: data.imageUrl,
        isActive: data.isActive ?? false,
      },
    });
  }

  async updatePack(id: string, data: UpdatePackDto): Promise<PackDefinition> {
    const pack = await this.prisma.packDefinition.findUnique({
      where: { id },
    });

    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    if (data.name && data.name !== pack.name) {
      const existing = await this.prisma.packDefinition.findUnique({
        where: { name: data.name },
      });

      if (existing) {
        throw new BadRequestException(`Tên pack "${data.name}" đã tồn tại`);
      }
    }

    if (data.cardCount !== undefined && data.cardCount !== pack.cardCount) {
      const soldCount = await this.prisma.userPack.count({
        where: { packId: id },
      });

      if (soldCount > 0) {
        throw new BadRequestException(
          'Cannot change cardCount after packs have been sold',
        );
      }
    }

    return this.prisma.packDefinition.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        cardCount: data.cardCount,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
      },
    });
  }

  async deletePack(id: string): Promise<any> {
    const pack = await this.prisma.packDefinition.findUnique({
      where: { id },
    });

    if (!pack) {
      throw new NotFoundException('Pack not found');
    }

    const soldCount = await this.prisma.userPack.count({
      where: { packId: id },
    });

    if (soldCount > 0) {
      throw new BadRequestException(
        `Cannot delete pack with existing purchases. Set isActive=false instead.", "purchaseCount": ${soldCount}`,
      );
    }

    await this.prisma.packDefinition.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Pack deleted successfully' };
  }
}
