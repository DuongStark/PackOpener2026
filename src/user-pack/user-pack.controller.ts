import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { UserPackService } from './user-pack.service.js';
import { PaginatedOutput } from '../common/constants/global.dto.js';

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
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<PaginatedOutput> {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    return this.userPackService.getUserPacks(req.user.id, pageNumber, limitNumber);
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
}
