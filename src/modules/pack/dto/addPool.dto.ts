import { IsInt, IsString, IsUUID, Min } from "class-validator";

export class addPoolDto {
    @IsUUID()
    cardId!: string;

    @IsInt()
    @Min(1)
    weight!: number;
}