import { Injectable } from '@nestjs/common';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { PrismaService } from '../../core/database/prisma.service.js';


@Injectable()
export class PackService {

  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.packDefinition.findMany({
        skip,
        take: limit,
        orderBy: {
          price: 'asc',
        }
      }),
      this.prisma.packDefinition.count(),
    ]
    )
    return { data: data, total: total };

  }



  findOne(id: number) {
    return `This action returns a #${id} pack`;
  }

  update(id: number, updatePackDto: UpdatePackDto) {
    return `This action updates a #${id} pack`;
  }

  remove(id: number) {
    return `This action removes a #${id} pack`;
  }
}
