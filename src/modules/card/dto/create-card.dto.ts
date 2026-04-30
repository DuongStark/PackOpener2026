import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Max, MaxLength, Min } from "class-validator";
import { Position, Rarity } from "../../../generated/prisma/enums.js";

export class CreateCardDto {

  @IsNotEmpty({ message: 'sofifaId không được để trống' })
  @IsInt({ message: 'sofifaId phải là số nguyên' })
  sofifaId!: number;

  @IsNotEmpty({ message: 'Tên cầu thủ không được để trống' })
  @IsString()
  @MaxLength(255, { message: 'Tên cầu thủ không được vượt quá 255 ký tự' })
  name!: string;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Chỉ số overall tối thiểu là 1' })
  @Max(99, { message: 'Chỉ số overall tối đa là 99' })
  overall!: number;

  @IsNotEmpty()
  @IsEnum(Rarity, { message: 'Độ hiếm không hợp lệ' })
  rarity!: Rarity;

  @IsNotEmpty()
  @IsEnum(Position, { message: 'Vị trí thi đấu không hợp lệ' })
  position!: Position;

  @IsNotEmpty()
  @IsInt()
  @Min(1, { message: 'Giá bán tối thiểu phải là 1 coin' })
  sellPrice!: number;


  @IsOptional()
  @IsString()
  @MaxLength(100)
  club?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nation?: string;

  @IsOptional()
  @IsUrl({}, { message: 'imageUrl phải là một đường dẫn URL hợp lệ' })
  imageUrl?: string;



  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  pace?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  shooting?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  passing?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  dribbling?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  defending?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99)
  physical?: number;
}
