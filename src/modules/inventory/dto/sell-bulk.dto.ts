import { Type } from 'class-transformer';
import { IsArray, IsInt, IsUUID, Min, ValidateNested } from 'class-validator';

export class SellBulkItemDto {
  @IsUUID()
  inventoryId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class SellBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SellBulkItemDto)
  items!: SellBulkItemDto[];
}
