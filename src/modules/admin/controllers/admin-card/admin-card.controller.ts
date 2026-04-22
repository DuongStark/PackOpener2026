import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { CreateCardDto } from '../../../card/dto/create-card.dto.js';
import { Cards } from '../../../../generated/prisma/client.js';
import { CardService } from '../../../card/card.service.js';

@Controller('admin/cards')
@Roles(Role.ADMIN)
export class AdminCardController {

    constructor(private cardService: CardService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    createCard(@Body() body: CreateCardDto): Promise<Cards> {
        return this.cardService.createCard(body);
    }
}
