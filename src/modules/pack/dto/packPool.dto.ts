export class packPoolDto {
    packId!: string;
    packName!: string;
    totalWeight!: number;
    pool?: packPoolItem[];
}

interface packPoolItem {
        id: string;
        cardName: string;
        rarity: string;
        weight: number;
        probability: number;
    }