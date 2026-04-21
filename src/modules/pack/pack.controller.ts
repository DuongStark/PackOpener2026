import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PackService } from './pack.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { Query } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@Controller('packs')
export class PackController {
  constructor(private readonly packService: PackService) {}

  @Get()
  async findPack(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const result = await this.packService.findAll(pageNumber, limitNumber);
    return {
      ...result,
      page: pageNumber,
      limit: limitNumber,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packService.findOne(id);
  }
}
