import { IsEnum, IsOptional } from 'class-validator';

export enum PurchaseMode {
  SEND_INVENTORY = 'SEND_INVENTORY',
  OPEN_NOW = 'OPEN_NOW',
}

export class BuyPackDto {
  @IsEnum(PurchaseMode)
  @IsOptional()
  mode?: PurchaseMode;
}

