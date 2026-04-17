import { IsInt, IsUUID, Min } from "class-validator";

export class SellCardDto {
    @IsUUID()
    cardId!: string;

    @IsInt()
    @Min(1)
    quantity!: number;
}