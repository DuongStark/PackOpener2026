-- AlterTable
ALTER TABLE "pack_definitions" ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_limited" BOOLEAN NOT NULL DEFAULT false;
