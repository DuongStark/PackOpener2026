import { Controller } from '@nestjs/common';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { Role } from '../../../../generated/prisma/enums.js';

@Controller('admin-card')
@Roles(Role.ADMIN)
export class AdminCardController {}
