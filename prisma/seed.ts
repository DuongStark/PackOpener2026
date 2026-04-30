import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'csv-parse/sync';
import {
  Position,
  Prisma,
  PrismaClient,
  Rarity,
} from '../src/generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run prisma seed');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const VALID_POSITIONS: Set<Position> = new Set(Object.values(Position));

function mapPosition(rawPositions: string): Position {
  const primary = (rawPositions ?? '')
    .split(',')[0]
    ?.trim()
    .toUpperCase() as Position;

  if (!VALID_POSITIONS.has(primary)) {
    throw new Error(`Invalid position value from CSV: ${rawPositions}`);
  }

  return primary;
}

function mapRarity(overall: number): Rarity {
  if (overall >= 91) return Rarity.DIAMOND_RARE;
  if (overall >= 88) return Rarity.DIAMOND_COMMON;
  if (overall >= 85) return Rarity.GOLD_EPIC;
  if (overall >= 80) return Rarity.GOLD_RARE;
  if (overall >= 75) return Rarity.GOLD_COMMON;
  if (overall >= 70) return Rarity.SILVER_RARE;
  if (overall >= 65) return Rarity.SILVER_COMMON;
  if (overall >= 60) return Rarity.BRONZE_RARE;
  return Rarity.BRONZE_COMMON;
}

function calcSellPrice(valueEur: number): number {
  if (valueEur < 100_000) return 1;
  return Math.max(Math.round(valueEur / 100_000), 1);
}

function toIntOrNull(val: string | undefined): number | null {
  if (!val || val.trim() === '') return null;

  const n = Number.parseInt(val, 10);
  return Number.isNaN(n) ? null : n;
}

type SeedCard = {
  id: string;
  sofifaId: number;
  name: string;
  overall: number;
  rarity: Rarity;
  position: Position;
  club: string | null;
  nation: string | null;
  imageUrl: string | null;
  sellPrice: number;
  pace: number | null;
  shooting: number | null;
  passing: number | null;
  dribbling: number | null;
  defending: number | null;
  physical: number | null;
};

function normalizeRow(row: Record<string, string>, rowIndex: number): SeedCard {
  const sofifaId = Number.parseInt(row.player_id, 10);
  const overall = Number.parseInt(row.overall, 10);
  const valueEur = Number.parseFloat(row.value_eur || '0') || 0;

  if (Number.isNaN(sofifaId) || Number.isNaN(overall)) {
    throw new Error(
      `Invalid numeric field at row index ${rowIndex}: player_id=${row.player_id}, overall=${row.overall}`,
    );
  }

  return {
    id: randomUUID(),
    sofifaId,
    name: row.short_name,
    overall,
    rarity: mapRarity(overall),
    position: mapPosition(row.player_positions),
    club: row.club_name || null,
    nation: row.nationality_name || null,
    imageUrl: row.player_face_url || null,
    sellPrice: calcSellPrice(valueEur),
    pace: toIntOrNull(row.pace),
    shooting: toIntOrNull(row.shooting),
    passing: toIntOrNull(row.passing),
    dribbling: toIntOrNull(row.dribbling),
    defending: toIntOrNull(row.defending),
    physical: toIntOrNull(row.physic),
  };
}

async function upsertCardsBatch(batch: SeedCard[]): Promise<void> {
  const values = batch.map((card) => {
    return Prisma.sql`(
      ${card.id}::uuid,
      ${card.sofifaId},
      ${card.name},
      ${card.overall},
      ${card.rarity}::"Rarity",
      ${card.position}::"Position",
      ${card.club},
      ${card.nation},
      ${card.imageUrl},
      ${card.sellPrice},
      ${card.pace},
      ${card.shooting},
      ${card.passing},
      ${card.dribbling},
      ${card.defending},
      ${card.physical}
    )`;
  });

  await prisma.$executeRaw`
    INSERT INTO "cards" (
      "id",
      "sofifa_id",
      "name",
      "overall",
      "rarity",
      "position",
      "club",
      "nation",
      "image_url",
      "sell_price",
      "pace",
      "shooting",
      "passing",
      "dribbling",
      "defending",
      "physical"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("sofifa_id") DO UPDATE SET
      "name" = EXCLUDED."name",
      "overall" = EXCLUDED."overall",
      "rarity" = EXCLUDED."rarity",
      "position" = EXCLUDED."position",
      "club" = EXCLUDED."club",
      "nation" = EXCLUDED."nation",
      "image_url" = EXCLUDED."image_url",
      "sell_price" = EXCLUDED."sell_price",
      "pace" = EXCLUDED."pace",
      "shooting" = EXCLUDED."shooting",
      "passing" = EXCLUDED."passing",
      "dribbling" = EXCLUDED."dribbling",
      "defending" = EXCLUDED."defending",
      "physical" = EXCLUDED."physical"
  `;
}

async function main() {
  const csvPath = path.resolve(process.cwd(), 'docs', 'FC26_20250921.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  console.log(`[seed] Loaded ${rows.length} raw rows from ${csvPath}`);

  const normalizedBySofifa = new Map<number, SeedCard>();
  rows.forEach((row, idx) => {
    const card = normalizeRow(row, idx);
    normalizedBySofifa.set(card.sofifaId, card);
  });

  const cards = [...normalizedBySofifa.values()];
  console.log(`[seed] Normalized ${cards.length} unique cards`);

  // 16 params/row, keep under Postgres ~65535 parameter cap with margin.
  const BATCH_SIZE = 2000;

  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    const batch = cards.slice(i, i + BATCH_SIZE);
    await upsertCardsBatch(batch);

    console.log(`[seed] Upserted ${Math.min(i + BATCH_SIZE, cards.length)}/${cards.length}`);
  }

  const total = await prisma.cards.count();
  console.log(`[seed] Done. cards count=${total}`);
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
