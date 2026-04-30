/*
  Warnings:

  - The values [Common,Rare,Epic,Legendary] on the enum `Rarity` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `user_packs` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PackStatus" AS ENUM ('PENDING', 'OPENED');

-- AlterEnum
BEGIN;
CREATE TYPE "Rarity_new" AS ENUM ('BRONZE_COMMON', 'BRONZE_RARE', 'SILVER_COMMON', 'SILVER_RARE', 'GOLD_COMMON', 'GOLD_RARE', 'GOLD_EPIC', 'DIAMOND_COMMON', 'DIAMOND_RARE');
ALTER TABLE "cards" ALTER COLUMN "rarity" TYPE "Rarity_new" USING ("rarity"::text::"Rarity_new");
ALTER TYPE "Rarity" RENAME TO "Rarity_old";
ALTER TYPE "Rarity_new" RENAME TO "Rarity";
DROP TYPE "public"."Rarity_old";
COMMIT;

-- AlterTable
ALTER TABLE "user_packs" DROP COLUMN "status",
ADD COLUMN     "status" "PackStatus" NOT NULL DEFAULT 'PENDING';
