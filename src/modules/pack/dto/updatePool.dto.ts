import { IsInt, Min } from "class-validator";

export class updateWeightDto {
    @IsInt()
    @Min(1)
    weight!: number;
}

export class updateWeightResponseDto {
    id!: string;
    weight!: number;
    probability!: number;
}