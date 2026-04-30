import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { CreateCardDto } from '../../../card/dto/create-card.dto.js';
import { Cards } from '../../../../generated/prisma/client.js';
import { CardService } from '../../../card/card.service.js';
import { UpdateCardDto } from '../../../card/dto/update-card.dto.js';

@Controller('admin/cards')
@Roles(Role.ADMIN)
export class AdminCardController {
  constructor(private cardService: CardService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  createCard(@Body() body: CreateCardDto): Promise<Cards> {
    return this.cardService.createCard(body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  updateCard(
    @Param('id') id: string,
    @Body() body: UpdateCardDto,
  ): Promise<Cards> {
    return this.cardService.updateCard(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteCard(@Param('id') id: string): Promise<{ message: string }> {
    await this.cardService.deleteCard(id);
    return { message: 'Card deleted successfully' };
  }
}
