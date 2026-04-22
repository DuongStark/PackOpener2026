import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PackService } from '../../../pack/pack.service.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { CreatePackDto } from '../../../pack/dto/create-pack.dto.js';
import { UpdatePackDto } from '../../../pack/dto/update-pack.dto.js';
import { PackDefinition } from '../../../../generated/prisma/client.js';
import { packPoolDto } from '../../../pack/dto/packPool.dto.js';
import { addPoolDto } from '../../../pack/dto/addPool.dto.js';
import {
  updateWeightDto,
  updateWeightResponseDto,
} from '../../../pack/dto/updatePool.dto.js';

@Controller('admin/packs')
@Roles(Role.ADMIN)
export class AdminPackController {
  constructor(private readonly packService: PackService) {}

  @Get(':id/pool')
  @UseGuards(JwtAuthGuard, RolesGuard)
  getPackPool(@Param('id') id: string): Promise<packPoolDto> {
    return this.packService.getPackPool(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  createPack(@Body() body: CreatePackDto): Promise<PackDefinition> {
    return this.packService.createPack(body);
  }

  @Post(':id/pool')
  @UseGuards(JwtAuthGuard, RolesGuard)
  addToPackPool(
    @Param('id') id: string,
    @Body() body: addPoolDto,
  ): Promise<any> {
    return this.packService.addToPackPool(id, body);
  }

  @Patch(':id/pool/:poolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateWeightCard(
    @Param('id') packId: string,
    @Param('poolId') id: string,
    @Body() body: updateWeightDto,
  ): Promise<updateWeightResponseDto> {
    return this.packService.updateWeightCard(packId, id, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updatePack(
    @Param('id') id: string,
    @Body() body: UpdatePackDto,
  ): Promise<PackDefinition> {
    return this.packService.updatePack(id, body);
  }

  @Delete(':packId/pool/:poolId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteFromPackPool(
    @Param('packId') packId: string,
    @Param('poolId') poolId: string,
  ) {
    await this.packService.deleteFromPackPool(packId, poolId);
    return { message: 'Card removed from pack pool successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  deletePack(@Param('id') id: string): Promise<any> {
    return this.packService.deletePack(id);
  }
}
