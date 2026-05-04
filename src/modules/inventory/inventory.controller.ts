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
  Query,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { GetInventoryDto } from './dto/get-inventory.dto.js';
import { SellCardDto } from './dto/sell-card.dto.js';
import { SellBulkDto } from './dto/sell-bulk.dto.js';
import { SellInventoryIdDto } from './dto/sell-inventory-id.dto.js';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  getInventory(@Req() req, @Query() query: GetInventoryDto): Promise<any> {
    return this.inventoryService.getInventory(req.user.id, query);
  }

  @Get('/summary')
  @UseGuards(JwtAuthGuard)
  getInventorySummary(@Req() req) {
    return this.inventoryService.getInventorySummary(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getInventoryItemById(@Param('id') cardId: string, @Req() req) {
    return this.inventoryService.getInventoryItemById(cardId, req.user.id);
  }

  @Post('/sell')
  @UseGuards(JwtAuthGuard)
  sellInventoryItem(@Body() body: SellCardDto, @Req() req) {
    return this.inventoryService.sellInventoryItem(body, req.user.id);
  }

  @Post('/sell-bulk')
  @UseGuards(JwtAuthGuard)
  sellBulkInventoryItems(@Body() body: SellBulkDto, @Req() req) {
    return this.inventoryService.sellBulkInventoryItems(body, req.user.id);
  }

  @Post('/:id/sell')
  @UseGuards(JwtAuthGuard)
  sellInventoryById(
    @Param('id') inventoryId: string,
    @Body() body: SellInventoryIdDto,
    @Req() req,
  ) {
    return this.inventoryService.sellInventoryById(
      inventoryId,
      body,
      req.user.id,
    );
  }
}
