import { IsEnum, IsNumber, IsUUID } from 'class-validator';
import { Type } from '../../../generated/prisma/enums.js';

export class CreateTransactionDto {
  @IsUUID()
  userId!: string;

  @IsEnum(Type, {
    message: `type must be one of: ${Object.values(Type).join(', ')}`,
  })
  type!: Type;

  @IsNumber()
  amount!: number;

  @IsNumber()
  balanceBefore!: number;

  @IsNumber()
  balanceAfter!: number;

  description?: string;
}
