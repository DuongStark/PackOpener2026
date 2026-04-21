import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PackService } from '../../../pack/pack.service.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../../common/guards/roles.guard.js';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';
import { CreatePackDto } from '../../../pack/dto/create-pack.dto.js';
import { PackDefinition } from '../../../../generated/prisma/client.js';

@Controller('admin/packs')
@Roles(Role.ADMIN)
export class AdminPackController {

    constructor(private readonly packService: PackService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    createPack(@Body() body: CreatePackDto): Promise<PackDefinition> {
        return this.packService.createPack(body);
    }
}
