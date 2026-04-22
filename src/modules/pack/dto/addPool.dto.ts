import { IsInt, IsString, IsUUID, Min } from 'class-validator';
import { PackCardPool } from '../../../generated/prisma/client.js';

export class addPoolDto {
  @IsUUID()
  cardId!: string;

  @IsInt()
  @Min(1)
  weight!: number;
}

export interface addPoolResponseDto extends PackCardPool {
  probability: number;
}

