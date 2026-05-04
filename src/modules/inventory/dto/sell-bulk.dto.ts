import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SellCardDto } from './sell-card.dto.js';

export class SellBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellCardDto)
  items!: SellCardDto[];
}
