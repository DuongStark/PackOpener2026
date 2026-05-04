-- Sync migration history with current schema without data reset

-- cards table drift
ALTER TABLE "cards" ADD COLUMN "club_image_url" TEXT;
ALTER TABLE "cards" ADD COLUMN "nation_image_url" TEXT;

-- pack_definitions table drift
ALTER TABLE "pack_definitions" ADD COLUMN "tier_code" TEXT NOT NULL DEFAULT 'PK-00';
ALTER TABLE "pack_definitions" ADD COLUMN "subtitle" TEXT NOT NULL DEFAULT 'Pack Series';
CREATE UNIQUE INDEX "pack_definitions_name_key" ON "pack_definitions"("name");

-- users table drift
ALTER TABLE "users" ALTER COLUMN "balance" SET DEFAULT 300;
