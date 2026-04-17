import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { PrismaService } from '../../core/database/prisma.service.js';
import { getCardDto } from './dto/get-card.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';
import { Cards } from '../../generated/prisma/client.js';

@Injectable()
export class CardService {
  constructor(private readonly prisma: PrismaService) {}

  async getCards(query: getCardDto): Promise<PaginatedOutput> {
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
      this.prisma.cards.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.cards.count({ where }),
    ]);

    return {
        data,
        total,
        page,
        limit,
    }
  }

  async getCardById(id: string):Promise<Cards> {
    const card = await this.prisma.cards.findUnique({
      where: { id },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    return card;
  }
}
