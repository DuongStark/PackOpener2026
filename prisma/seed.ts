import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import { parse } from 'csv-parse/sync';
import { Position, PrismaClient, Rarity } from '../src/generated/prisma/client';

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

async function main() {
  const csvPath = path.resolve(process.cwd(), 'docs', 'FC26_20250921.csv');
  const raw = fs.readFileSync(csvPath, 'utf8');

  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[];

  console.log(`[seed] Loaded ${rows.length} rows from ${csvPath}`);

  const BATCH_SIZE = 500;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const sofifaId = Number.parseInt(row.player_id, 10);
      const overall = Number.parseInt(row.overall, 10);
      const valueEur = Number.parseFloat(row.value_eur || '0') || 0;

      if (Number.isNaN(sofifaId) || Number.isNaN(overall)) {
        throw new Error(
          `Invalid numeric field at row index ${i}: player_id=${row.player_id}, overall=${row.overall}`,
        );
      }

      await prisma.cards.upsert({
        where: { sofifaId },
        update: {
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
        },
        create: {
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
        },
      });
    }

    console.log(
      `[seed] Upserted ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
    );
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
