/*
  Warnings:

  - Changed the type of `position` on the `cards` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GK', 'CB', 'LB', 'RB', 'LM', 'RM', 'CM', 'CDM', 'CAM', 'LW', 'RW', 'ST');

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "position",
ADD COLUMN     "position" "Position" NOT NULL;
