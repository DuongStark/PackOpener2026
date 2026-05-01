import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import {
  Position,
  Prisma,
  PrismaClient,
  Rarity,
} from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed packs');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const WEIGHT_SCALE = 1_000_000;
const CREATE_MANY_BATCH_SIZE = 2_000;

type PoolRule = {
  label: string;
  share: number;
  where: Prisma.CardsWhereInput;
};

type PackSeed = {
  name: string;
  description: string;
  price: number;
  cardCount: number;
  imageUrl?: string | null;
  isActive?: boolean;
  pool: PoolRule[];
};

const PACKS: PackSeed[] = [
  {
    name: 'Free Recovery Pack',
    description: 'A small free pack for players who need a way back in.',
    price: 0,
    cardCount: 3,
    pool: [
      {
        label: 'Bronze common only',
        share: 100,
        where: { rarity: Rarity.BRONZE_COMMON },
      },
    ],
  },
  {
    name: 'Starter Pack',
    description: 'A beginner-friendly pack with low-tier players.',
    price: 40,
    cardCount: 5,
    pool: [
      { label: 'Bronze common', share: 50, where: { rarity: Rarity.BRONZE_COMMON } },
      { label: 'Bronze rare', share: 35, where: { rarity: Rarity.BRONZE_RARE } },
      { label: 'Silver common', share: 15, where: { rarity: Rarity.SILVER_COMMON } },
    ],
  },
  {
    name: 'Bronze Pack',
    description: 'Entry-level bronze player pack.',
    price: 25,
    cardCount: 5,
    pool: [
      { label: 'Bronze common', share: 80, where: { rarity: Rarity.BRONZE_COMMON } },
      { label: 'Bronze rare', share: 20, where: { rarity: Rarity.BRONZE_RARE } },
    ],
  },
  {
    name: 'Bronze Plus Pack',
    description: 'Upgraded bronze pack with a small silver chance.',
    price: 60,
    cardCount: 5,
    pool: [
      { label: 'Bronze rare', share: 80, where: { rarity: Rarity.BRONZE_RARE } },
      { label: 'Silver common', share: 20, where: { rarity: Rarity.SILVER_COMMON } },
    ],
  },
  {
    name: 'Silver Pack',
    description: 'Standard silver tier pack.',
    price: 120,
    cardCount: 5,
    pool: [
      { label: 'Silver common', share: 75, where: { rarity: Rarity.SILVER_COMMON } },
      { label: 'Silver rare', share: 25, where: { rarity: Rarity.SILVER_RARE } },
    ],
  },
  {
    name: 'Silver Plus Pack',
    description: 'Silver pack with a small gold common chance.',
    price: 300,
    cardCount: 5,
    pool: [
      { label: 'Silver rare', share: 85, where: { rarity: Rarity.SILVER_RARE } },
      { label: 'Gold common', share: 15, where: { rarity: Rarity.GOLD_COMMON } },
    ],
  },
  {
    name: 'Gold Pack',
    description: 'Main gold tier pack.',
    price: 950,
    cardCount: 5,
    pool: [
      { label: 'Gold common', share: 85, where: { rarity: Rarity.GOLD_COMMON } },
      { label: 'Gold rare', share: 15, where: { rarity: Rarity.GOLD_RARE } },
    ],
  },
  {
    name: 'Premium Gold Pack',
    description: 'More cards and better gold odds.',
    price: 1900,
    cardCount: 7,
    pool: [
      { label: 'Gold common', share: 65, where: { rarity: Rarity.GOLD_COMMON } },
      { label: 'Gold rare', share: 30, where: { rarity: Rarity.GOLD_RARE } },
      { label: 'Gold epic', share: 5, where: { rarity: Rarity.GOLD_EPIC } },
    ],
  },
  {
    name: 'Rare Gold Pack',
    description: 'Focused rare gold and epic gold pack.',
    price: 2600,
    cardCount: 5,
    pool: [
      { label: 'Gold rare', share: 90, where: { rarity: Rarity.GOLD_RARE } },
      { label: 'Gold epic', share: 10, where: { rarity: Rarity.GOLD_EPIC } },
    ],
  },
  {
    name: 'Mixed Value Pack',
    description: 'A larger mixed pack with bronze, silver, and low gold players.',
    price: 375,
    cardCount: 8,
    pool: [
      { label: 'Bronze rare', share: 35, where: { rarity: Rarity.BRONZE_RARE } },
      { label: 'Silver common', share: 35, where: { rarity: Rarity.SILVER_COMMON } },
      { label: 'Silver rare', share: 20, where: { rarity: Rarity.SILVER_RARE } },
      { label: 'Gold common', share: 10, where: { rarity: Rarity.GOLD_COMMON } },
    ],
  },
  {
    name: 'Goalkeeper Pack',
    description: 'Specialist pack for goalkeepers.',
    price: 150,
    cardCount: 3,
    pool: [
      {
        label: 'Goalkeepers 65+',
        share: 100,
        where: { position: Position.GK, overall: { gte: 65 } },
      },
    ],
  },
  {
    name: 'Defender Pack',
    description: 'Position pack for defenders and defensive midfielders.',
    price: 550,
    cardCount: 5,
    pool: [
      {
        label: 'Defenders 70+',
        share: 100,
        where: {
          position: { in: [Position.CB, Position.LB, Position.RB, Position.CDM] },
          overall: { gte: 70 },
        },
      },
    ],
  },
  {
    name: 'Midfielder Pack',
    description: 'Position pack for midfielders.',
    price: 700,
    cardCount: 5,
    pool: [
      {
        label: 'Midfielders 70+',
        share: 100,
        where: {
          position: {
            in: [Position.CM, Position.CDM, Position.CAM, Position.LM, Position.RM],
          },
          overall: { gte: 70 },
        },
      },
    ],
  },
  {
    name: 'Forward Pack',
    description: 'Position pack for forwards and attacking midfielders.',
    price: 800,
    cardCount: 5,
    pool: [
      {
        label: 'Forwards 70+',
        share: 100,
        where: {
          position: { in: [Position.ST, Position.LW, Position.RW, Position.CAM] },
          overall: { gte: 70 },
        },
      },
    ],
  },
  {
    name: 'Elite Pack',
    description: 'High-tier pack for strong gold players.',
    price: 2800,
    cardCount: 5,
    pool: [
      {
        label: 'Elite 80-87',
        share: 100,
        where: { overall: { gte: 80, lte: 87 } },
      },
    ],
  },
  {
    name: 'Ultimate Pack',
    description: 'The top-end pack with the best player odds.',
    price: 7500,
    cardCount: 10,
    pool: [
      { label: 'Gold rare', share: 70, where: { rarity: Rarity.GOLD_RARE } },
      { label: 'Gold epic', share: 25, where: { rarity: Rarity.GOLD_EPIC } },
      { label: 'Diamond common', share: 4, where: { rarity: Rarity.DIAMOND_COMMON } },
      { label: 'Diamond rare', share: 1, where: { rarity: Rarity.DIAMOND_RARE } },
    ],
  },
];

function mergePoolWeight(
  poolWeights: Map<string, number>,
  cardId: string,
  weight: number,
) {
  poolWeights.set(cardId, (poolWeights.get(cardId) ?? 0) + weight);
}

async function createPoolEntries(packId: string, rules: PoolRule[]) {
  const poolWeights = new Map<string, number>();
  const summaries: string[] = [];

  for (const rule of rules) {
    const cards = await prisma.cards.findMany({
      where: rule.where,
      select: { id: true },
    });

    if (!cards.length) {
      throw new Error(`Pool rule "${rule.label}" matched 0 cards`);
    }

    const weightPerCard = Math.max(
      1,
      Math.round((rule.share * WEIGHT_SCALE) / cards.length),
    );

    for (const card of cards) {
      mergePoolWeight(poolWeights, card.id, weightPerCard);
    }

    summaries.push(`${rule.label}: ${cards.length} cards x weight ${weightPerCard}`);
  }

  const entries = [...poolWeights.entries()].map(([cardId, weight]) => ({
    packId,
    cardId,
    weight,
  }));

  for (let i = 0; i < entries.length; i += CREATE_MANY_BATCH_SIZE) {
    await prisma.packCardPool.createMany({
      data: entries.slice(i, i + CREATE_MANY_BATCH_SIZE),
      skipDuplicates: true,
    });
  }

  return { totalCards: entries.length, summaries };
}

async function syncPack(seed: PackSeed) {
  const pack = await prisma.packDefinition.upsert({
    where: { name: seed.name },
    create: {
      name: seed.name,
      description: seed.description,
      price: seed.price,
      cardCount: seed.cardCount,
      imageUrl: seed.imageUrl ?? null,
      isActive: seed.isActive ?? true,
    },
    update: {
      description: seed.description,
      price: seed.price,
      cardCount: seed.cardCount,
      imageUrl: seed.imageUrl ?? null,
      isActive: seed.isActive ?? true,
    },
  });

  await prisma.packCardPool.deleteMany({ where: { packId: pack.id } });
  const result = await createPoolEntries(pack.id, seed.pool);

  console.log(
    `[seed-packs] ${seed.name}: ${result.totalCards} pool cards, price=${seed.price}, cardCount=${seed.cardCount}`,
  );
  for (const summary of result.summaries) {
    console.log(`  - ${summary}`);
  }
}

async function main() {
  const cardCount = await prisma.cards.count();
  if (cardCount === 0) {
    throw new Error('No cards found. Run `npm run seed:cards` first.');
  }

  console.log(`[seed-packs] Found ${cardCount} cards`);

  for (const pack of PACKS) {
    await syncPack(pack);
  }

  console.log(`[seed-packs] Done. Synced ${PACKS.length} packs.`);
}

main()
  .catch((error) => {
    console.error('[seed-packs] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
