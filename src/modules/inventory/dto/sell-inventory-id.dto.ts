import { IsInt, Min } from 'class-validator';

export class SellInventoryIdDto {
  @IsInt()
  @Min(1)
  quantity!: number;
}
