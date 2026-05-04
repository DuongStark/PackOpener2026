export class CardResultDto {
  cardId!: string;
  name!: string;
  rarity!: string;
  overall!: number;
  pace?: number;
  shooting?: number;
  passing?: number;
  dribbling?: number;
  defending?: number;
  position!: string;
  club?: string;
  nation?: string;
  imageUrl?: string | null;
  clubImageUrl?: string;
  nationImageUrl?: string;
  sellPrice?: number;
  physical?: number;
}

export class OpenPackResponseDto {
  userPackId!: string;
  openedAt!: string;
  cards!: CardResultDto[];
}
