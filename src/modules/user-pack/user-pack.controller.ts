import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { UserPackService } from './user-pack.service.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';
import { Status } from '../../generated/prisma/enums.js';
import { getUserPacksDto } from './dto/get-userpack.dto.js';
import { OpenPackResponseDto } from './dto/open-pack.dto.js';

interface buyPackResult {
  userPackId: string;
  packName: string;
  price: number;
  newBalance: number;
  status: string;
}

@Controller()
export class UserPackController {
  constructor(private readonly userPackService: UserPackService) {}

  @Get('/user-packs')
  @UseGuards(JwtAuthGuard)
  async getUserPacks(
    @Req() req,
    @Query() query: getUserPacksDto,
  ): Promise<PaginatedOutput> {
    return this.userPackService.getUserPacks(req.user.id, query);
  }

  @Get('/user-packs/:id')
  @UseGuards(JwtAuthGuard)
  async getUserPackById(@Param('id') id: string, @Req() req) {
    return this.userPackService.getUserPackById(id, req.user.id);
  }

  @Post('packs/:id/buy')
  @UseGuards(JwtAuthGuard)
  async buyPack(@Param('id') id: string, @Req() req): Promise<buyPackResult> {
    return this.userPackService.buyPack(id, req.user.id);
  }

  @Post('user-packs/:id/open')
  @UseGuards(JwtAuthGuard)
  async openPack(@Param('id') id: string, @Req() req): Promise<OpenPackResponseDto> {
    return this.userPackService.openPack(id, req.user.id);
  }
}
