import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CardService } from './card.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { getCardDto } from './dto/get-card.dto.js';
import { PaginatedOutput } from '../../common/constants/global.dto.js';

@Controller('cards')
export class CardController {
  constructor(private readonly cardService: CardService) {}

  @Get()
  getCards(@Query() query: getCardDto): Promise<PaginatedOutput> {
    return this.cardService.getCards(query);
  }
}
